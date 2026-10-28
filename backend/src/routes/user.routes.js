const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getMembers,
  getMemberById,
  createMember,
  updateMembership,
  updateUserRole
} = require('../controllers/user.controller');
const { updateProfileValidation } = require('../validators/user.validator');
const validate = require('../middlewares/validate.middleware');
const { protect, librarian, admin } = require('../middlewares/auth.middleware');

// Personal profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);

// Librarian/Admin Member Management routes
router.get('/members', protect, librarian, getMembers);
router.post('/members', protect, librarian, createMember);
router.get('/members/:id', protect, librarian, getMemberById);
router.put('/members/:id/membership', protect, librarian, updateMembership);
router.put('/members/:id/role', protect, admin, updateUserRole);

module.exports = router;
