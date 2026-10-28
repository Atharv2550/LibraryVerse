const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  getLibrarians,
  approveLibrarian,
  rejectLibrarian,
  getUsers,
  updateUserStatus,
  getPolicies,
  updatePolicies
} = require('../controllers/admin.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

// Protect all admin endpoints strictly with Admin role authorization
router.use(protect, admin);

// 1. Overview KPIs
router.get('/overview', getAdminOverview);

// 2. Librarian Applications & Approval Workflows
router.get('/librarians', getLibrarians);
router.put('/librarians/:id/approve', approveLibrarian);
router.put('/librarians/:id/reject', rejectLibrarian);

// 3. User & Staff Management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// 4. System Policies & Configuration
router.get('/policies', getPolicies);
router.put('/policies', updatePolicies);

module.exports = router;
