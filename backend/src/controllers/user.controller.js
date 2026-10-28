const User = require('../models/User.model');
const Loan = require('../models/Loan.model');
const Reservation = require('../models/Reservation.model');
const Fine = require('../models/Fine.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { getDBStatus } = require('../config/db');

const getProfile = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Fetch real library circulation metrics for this member
  const [activeLoans, overdueLoans, activeReservations, unpaidFines] = await Promise.all([
    Loan.countDocuments({ member: user._id, status: 'active' }),
    Loan.countDocuments({ member: user._id, status: 'active', dueDate: { $lt: new Date() } }),
    Reservation.countDocuments({ member: user._id, status: { $in: ['pending', 'available'] } }),
    Fine.countDocuments({ member: user._id, status: 'outstanding' })
  ]);

  const stats = {
    activeLoans,
    overdueLoans,
    activeReservations,
    unpaidFines,
    maxBorrowLimit: user.maxBorrowLimit || 5,
    membershipStatus: user.membershipStatus || 'active'
  };

  return res.json(
    new ApiResponse(200, {
      user,
      stats
    }, 'User profile fetched successfully')
  );
});

const updateProfile = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const { name, bio, favoriteGenres, avatar, phone, address } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();
  if (favoriteGenres !== undefined && Array.isArray(favoriteGenres)) {
    user.favoriteGenres = favoriteGenres;
  }
  if (avatar !== undefined) user.avatar = avatar.trim();

  await user.save();

  return res.json(
    new ApiResponse(200, user, 'Profile updated successfully')
  );
});

// Admin/Librarian: List all library members with search and stats
const getMembers = asyncHandler(async (req, res) => {
  const { search, status, role, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) {
    query.membershipStatus = status;
  }

  if (role) {
    query.role = role;
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: regex },
      { email: regex },
      { membershipId: regex },
      { phone: regex }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('-password');

  return res.json(
    new ApiResponse(200, {
      items: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Members retrieved successfully')
  );
});

// Admin/Librarian: Get member details with loan and fine statistics
const getMemberById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ApiError(404, 'Member not found');
  }

  const Loan = require('../models/Loan.model');
  const Fine = require('../models/Fine.model');
  const Reservation = require('../models/Reservation.model');

  const [activeLoansCount, overdueLoansCount, totalLoansCount, outstandingFines, pendingReservations] = await Promise.all([
    Loan.countDocuments({ member: user._id, status: 'active' }),
    Loan.countDocuments({ member: user._id, status: 'overdue' }),
    Loan.countDocuments({ member: user._id }),
    Fine.aggregate([
      { $match: { member: user._id, status: 'outstanding' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Reservation.countDocuments({ member: user._id, status: { $in: ['pending', 'available'] } })
  ]);

  const stats = {
    activeLoans: activeLoansCount,
    overdueLoans: overdueLoansCount,
    totalLoans: totalLoansCount,
    outstandingFines: outstandingFines[0]?.total || 0,
    pendingReservations
  };

  return res.json(
    new ApiResponse(200, {
      user,
      stats
    }, 'Member details retrieved successfully')
  );
});

// Admin/Librarian: Create new member directly
const createMember = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, maxBorrowLimit, membershipExpiry, role = 'member' } = req.body;

  if (!name || !email) {
    throw new ApiError(400, 'Name and email are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Only admins can create admin or librarian users
  let assignedRole = 'member';
  if (req.user.role === 'admin' && (role === 'librarian' || role === 'admin')) {
    assignedRole = role;
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password || 'LibraryPass123!',
    phone: phone ? phone.trim() : '',
    address: address ? address.trim() : '',
    role: assignedRole,
    maxBorrowLimit: maxBorrowLimit ? Number(maxBorrowLimit) : 5,
    membershipExpiry: membershipExpiry ? new Date(membershipExpiry) : undefined
  });

  const { logAudit } = require('../services/audit.service');
  await logAudit({
    actor: req.user,
    action: 'MEMBER_CREATE',
    entityType: 'User',
    entityId: user._id,
    details: { name: user.name, email: user.email, role: user.role, membershipId: user.membershipId },
    ipAddress: req.ip
  });

  return res.status(201).json(
    new ApiResponse(201, user, 'Member created successfully')
  );
});

// Admin/Librarian: Update member status or borrow limit
const updateMembership = asyncHandler(async (req, res) => {
  const { membershipStatus, maxBorrowLimit, membershipExpiry, phone, address } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Member not found');
  }

  if (membershipStatus && ['active', 'suspended', 'expired'].includes(membershipStatus)) {
    user.membershipStatus = membershipStatus;
  }
  if (maxBorrowLimit !== undefined) {
    user.maxBorrowLimit = Math.max(1, Math.min(20, Number(maxBorrowLimit)));
  }
  if (membershipExpiry) {
    user.membershipExpiry = new Date(membershipExpiry);
  }
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();

  await user.save();

  const { logAudit } = require('../services/audit.service');
  await logAudit({
    actor: req.user,
    action: 'MEMBER_STATUS_UPDATE',
    entityType: 'User',
    entityId: user._id,
    details: { membershipStatus: user.membershipStatus, maxBorrowLimit: user.maxBorrowLimit },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, user, 'Membership updated successfully')
  );
});

// Admin ONLY: Change user role (admin, librarian, member)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !['admin', 'librarian', 'member'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be admin, librarian, or member');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent admin from demoting themselves
  if (String(user._id) === String(req.user._id) && role !== 'admin') {
    throw new ApiError(400, 'You cannot demote your own admin account');
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  const { logAudit } = require('../services/audit.service');
  await logAudit({
    actor: req.user,
    action: 'MEMBER_ROLE_UPDATE',
    entityType: 'User',
    entityId: user._id,
    details: { previousRole, newRole: role, targetUser: user.email },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, user, `User role updated to ${role} successfully`)
  );
});

module.exports = {
  getProfile,
  updateProfile,
  getMembers,
  getMemberById,
  createMember,
  updateMembership,
  updateUserRole
};

