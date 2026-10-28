const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET is required in production mode');
      process.exit(1);
    }
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return secret;
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        throw new ApiError(401, 'Not authorized, user no longer exists');
      }

      // Check account suspension & librarian pending status
      if (user.accountStatus === 'suspended' || user.membershipStatus === 'suspended') {
        throw new ApiError(403, 'Your account has been suspended. Please contact the library administrator.');
      }

      if (user.role === 'librarian' && user.accountStatus === 'pending') {
        throw new ApiError(403, 'Your librarian account is awaiting administrator approval.');
      }

      if (user.role === 'librarian' && user.accountStatus === 'rejected') {
        throw new ApiError(403, user.rejectionReason || 'Your librarian account application has been rejected by the administrator.');
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Not authorized, token invalid or expired');
    }
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token failure in optional auth
    }
  }
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized, please authenticate');
    }
    const currentRole = (req.user.role === 'user' || req.user.role === 'member') ? 'user' : req.user.role;
    const isAllowed = roles.some((r) => {
      const targetRole = (r === 'user' || r === 'member') ? 'user' : r;
      // Admin also inherits librarian access for oversight
      if (currentRole === 'admin' && (targetRole === 'librarian' || targetRole === 'admin')) {
        return true;
      }
      return targetRole === currentRole;
    });

    if (!isAllowed) {
      throw new ApiError(403, `Forbidden: Requires one of [${roles.join(', ')}] permissions`);
    }
    next();
  };
};

const admin = authorize('admin');
const librarian = authorize('admin', 'librarian');

module.exports = { protect, optionalAuth, admin, librarian, authorize };
