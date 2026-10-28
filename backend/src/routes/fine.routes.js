const express = require('express');
const router = express.Router();
const {
  getFines,
  getMyFines,
  recordPayment,
  waiveFine,
  assessManualFine
} = require('../controllers/fine.controller');
const { protect, librarian } = require('../middlewares/auth.middleware');

router.get('/my', protect, getMyFines);
router.get('/', protect, librarian, getFines);
router.post('/manual', protect, librarian, assessManualFine);
router.post('/:id/pay', protect, librarian, recordPayment);
router.post('/:id/waive', protect, librarian, waiveFine);

module.exports = router;
