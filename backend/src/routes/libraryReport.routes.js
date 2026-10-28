const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  exportReportCsv
} = require('../controllers/libraryReport.controller');
const { protect, librarian } = require('../middlewares/auth.middleware');

router.get('/analytics', protect, librarian, getAnalyticsOverview);
router.get('/export', protect, librarian, exportReportCsv);

module.exports = router;
