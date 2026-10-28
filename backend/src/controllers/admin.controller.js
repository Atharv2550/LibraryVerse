const User = require('../models/User.model');
const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');
const Loan = require('../models/Loan.model');
const Reservation = require('../models/Reservation.model');
const Fine = require('../models/Fine.model');
const AuditLog = require('../models/AuditLog.model');
const Policy = require('../models/Policy.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');

// 1. Admin System Overview with Real Database Counts
const getAdminOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalLibrarians,
    pendingLibrarians,
    totalBooks,
    totalCopies,
    issuedCopies,
    availableCopies,
    activeLoans,
    overdueLoans,
    pendingReservations,
    fulfilledReservations,
    outstandingFinesAgg,
    recentAudits
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ['user', 'member'] } }),
    User.countDocuments({ role: 'librarian', accountStatus: { $in: ['approved', 'active'] } }),
    User.countDocuments({ role: 'librarian', accountStatus: 'pending' }),
    Book.countDocuments(),
    BookCopy.countDocuments(),
    BookCopy.countDocuments({ status: 'issued' }),
    BookCopy.countDocuments({ status: 'available' }),
    Loan.countDocuments({ status: 'active' }),
    Loan.countDocuments({ $or: [{ status: 'overdue' }, { status: 'active', dueDate: { $lt: new Date() } }] }),
    Reservation.countDocuments({ status: { $in: ['pending', 'available'] } }),
    Reservation.countDocuments({ status: 'fulfilled' }),
    Fine.aggregate([
      { $match: { status: 'outstanding' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('actor', 'name email role')
  ]);

  const overview = {
    totalUsers,
    totalLibrarians,
    pendingLibrarians,
    totalBooks,
    totalCopies,
    issuedCopies,
    availableCopies,
    activeLoans,
    overdueLoans,
    pendingReservations,
    fulfilledReservations,
    outstandingFines: outstandingFinesAgg[0]?.total || 0,
    recentAudits
  };

  return res.json(
    new ApiResponse(200, overview, 'Admin overview metrics retrieved successfully')
  );
});

// 2. Librarian Applications Management
const getLibrarians = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = { role: 'librarian' };

  if (status && status !== 'all') {
    query.accountStatus = status;
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { email: regex }];
  }

  const librarians = await User.find(query)
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .select('-password');

  return res.json(
    new ApiResponse(200, librarians, 'Librarian applications retrieved successfully')
  );
});

const approveLibrarian = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'librarian') {
    throw new ApiError(404, 'Librarian account not found');
  }

  user.accountStatus = 'approved';
  user.approvalDate = new Date();
  user.approvedBy = req.user._id;
  user.rejectionReason = '';
  await user.save();

  await logAudit({
    actor: req.user,
    action: 'LIBRARIAN_APPROVED',
    entityType: 'User',
    entityId: user._id,
    details: { email: user.email, name: user.name, approvedBy: req.user.email },
    ipAddress: req.ip
  });

  await createNotification({
    recipient: user._id,
    type: 'ACCOUNT_APPROVED',
    title: 'Librarian Application Approved',
    message: 'Congratulations! Your librarian application has been approved by the Administrator. You now have full operational access to the Library Management System.',
    data: { role: 'librarian', accountStatus: 'approved' }
  });

  return res.json(
    new ApiResponse(200, user, `Librarian application for ${user.name} approved successfully`)
  );
});

const rejectLibrarian = asyncHandler(async (req, res) => {
  const { reason = 'Application does not meet current staff requirements.' } = req.body;
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'librarian') {
    throw new ApiError(404, 'Librarian account not found');
  }

  user.accountStatus = 'rejected';
  user.rejectionReason = reason;
  await user.save();

  await logAudit({
    actor: req.user,
    action: 'LIBRARIAN_REJECTED',
    entityType: 'User',
    entityId: user._id,
    details: { email: user.email, name: user.name, reason, rejectedBy: req.user.email },
    ipAddress: req.ip
  });

  await createNotification({
    recipient: user._id,
    type: 'ACCOUNT_REJECTED',
    title: 'Librarian Application Status',
    message: `Your librarian application was reviewed and rejected. Reason: ${reason}`,
    data: { role: 'librarian', accountStatus: 'rejected', reason }
  });

  return res.json(
    new ApiResponse(200, user, `Librarian application for ${user.name} has been rejected`)
  );
});

// 3. User & Staff Management (Listing, Search, Status Toggling)
const getUsers = asyncHandler(async (req, res) => {
  const { search, role, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (role && role !== 'all') {
    if (role === 'user') {
      query.role = { $in: ['user', 'member'] };
    } else {
      query.role = role;
    }
  }

  if (status && status !== 'all') {
    query.accountStatus = status;
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
    }, 'Users retrieved successfully')
  );
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'approved', 'rejected', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid account status specified');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  // Prevent admin self-suspension
  if (String(user._id) === String(req.user._id) && status === 'suspended') {
    throw new ApiError(400, 'You cannot suspend your own administrator account');
  }

  const previousStatus = user.accountStatus;
  user.accountStatus = status;
  if (['active', 'suspended'].includes(status)) {
    user.membershipStatus = status;
  }
  await user.save();

  await logAudit({
    actor: req.user,
    action: 'USER_STATUS_UPDATE',
    entityType: 'User',
    entityId: user._id,
    details: { targetEmail: user.email, previousStatus, newStatus: status },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, user, `Account status for ${user.email} updated to ${status}`)
  );
});

// 4. System Policies Management
const getPolicies = asyncHandler(async (req, res) => {
  const policy = await Policy.getEffectivePolicy();
  return res.json(
    new ApiResponse(200, policy, 'System policies retrieved successfully')
  );
});

const updatePolicies = asyncHandler(async (req, res) => {
  const { loanDurationDays, maxBorrowLimit, renewalLimit, dailyFineRate, reservationPickupHours, announcements } = req.body;

  let policy = await Policy.findOne();
  if (!policy) {
    policy = new Policy();
  }

  if (loanDurationDays !== undefined) policy.loanDurationDays = Math.max(1, Number(loanDurationDays));
  if (maxBorrowLimit !== undefined) policy.maxBorrowLimit = Math.max(1, Number(maxBorrowLimit));
  if (renewalLimit !== undefined) policy.renewalLimit = Math.max(0, Number(renewalLimit));
  if (dailyFineRate !== undefined) policy.dailyFineRate = Math.max(0, Number(dailyFineRate));
  if (reservationPickupHours !== undefined) policy.reservationPickupHours = Math.max(1, Number(reservationPickupHours));
  if (announcements !== undefined && Array.isArray(announcements)) {
    policy.announcements = announcements;
  }

  await policy.save();

  await logAudit({
    actor: req.user,
    action: 'POLICY_UPDATE',
    entityType: 'Policy',
    entityId: policy._id,
    details: {
      loanDurationDays: policy.loanDurationDays,
      maxBorrowLimit: policy.maxBorrowLimit,
      renewalLimit: policy.renewalLimit,
      dailyFineRate: policy.dailyFineRate
    },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, policy, 'System policies updated successfully')
  );
});

module.exports = {
  getAdminOverview,
  getLibrarians,
  approveLibrarian,
  rejectLibrarian,
  getUsers,
  updateUserStatus,
  getPolicies,
  updatePolicies
};
