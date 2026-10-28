const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { getDBStatus } = require('../config/db');
const { logAudit } = require('../services/audit.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role = 'user', bio, favoriteGenres } = req.body;

  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable. Please try again shortly.');
  }

  // Validate confirm password if provided
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  // Role whitelist security: Strictly disallow self-registering as 'admin'
  const normalizedRole = String(role).trim().toLowerCase();
  if (normalizedRole === 'admin') {
    throw new ApiError(403, 'Administrative accounts cannot be registered publicly.');
  }

  if (!['user', 'librarian'].includes(normalizedRole)) {
    throw new ApiError(400, 'Registration role must be either "user" or "librarian".');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    throw new ApiError(409, 'An account with this email address already exists');
  }

  const isLibrarian = normalizedRole === 'librarian';

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: isLibrarian ? 'librarian' : 'user',
    accountStatus: isLibrarian ? 'pending' : 'active',
    membershipStatus: 'active',
    bio: bio ? bio.trim() : (isLibrarian ? 'Library Staff Member' : 'Library Member & Avid Reader'),
    favoriteGenres: Array.isArray(favoriteGenres) && favoriteGenres.length ? favoriteGenres : ['Fiction', 'Sci-Fi']
  });

  // If registering as a Librarian, require Admin approval first: do NOT return token
  if (isLibrarian) {
    await logAudit({
      actor: { _id: user._id, name: user.name, role: 'librarian' },
      action: 'LIBRARIAN_APPLICATION_SUBMITTED',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, name: user.name },
      ipAddress: req.ip
    });

    return res.status(201).json(
      new ApiResponse(201, {
        pendingApproval: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'librarian',
        accountStatus: 'pending'
      }, 'Your librarian account is awaiting administrator approval.')
    );
  }

  // Regular User: issue token immediately
  const token = generateToken(user._id);

  return res.status(201).json(
    new ApiResponse(201, {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: 'user',
      accountStatus: user.accountStatus,
      membershipId: user.membershipId,
      membershipStatus: user.membershipStatus,
      membershipExpiry: user.membershipExpiry,
      maxBorrowLimit: user.maxBorrowLimit,
      phone: user.phone,
      address: user.address,
      favoriteGenres: user.favoriteGenres,
      token
    }, 'Registration successful')
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable. Please try again shortly.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check account status and role constraints
  if (user.accountStatus === 'suspended' || user.membershipStatus === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Please contact the library administrator.');
  }

  if (user.role === 'librarian') {
    if (user.accountStatus === 'pending') {
      throw new ApiError(403, 'Your librarian account is awaiting administrator approval.');
    }
    if (user.accountStatus === 'rejected') {
      const reasonSuffix = user.rejectionReason ? `: ${user.rejectionReason}` : '.';
      throw new ApiError(403, `Your librarian account application has been rejected by the administrator${reasonSuffix}`);
    }
  }

  const token = generateToken(user._id);
  const normalizedRole = user.role === 'member' ? 'user' : user.role;

  return res.json(
    new ApiResponse(200, {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: normalizedRole,
      accountStatus: user.accountStatus || 'active',
      membershipId: user.membershipId,
      membershipStatus: user.membershipStatus,
      membershipExpiry: user.membershipExpiry,
      maxBorrowLimit: user.maxBorrowLimit,
      phone: user.phone,
      address: user.address,
      favoriteGenres: user.favoriteGenres,
      token
    }, 'Login successful')
  );
});

const getMe = asyncHandler(async (req, res) => {
  const normalizedRole = req.user.role === 'member' ? 'user' : req.user.role;
  const userObj = req.user.toObject ? req.user.toObject() : req.user;
  userObj.role = normalizedRole;
  userObj.accountStatus = req.user.accountStatus || 'active';

  return res.json(
    new ApiResponse(200, userObj, 'Current user profile fetched successfully')
  );
});

module.exports = { register, login, getMe };
