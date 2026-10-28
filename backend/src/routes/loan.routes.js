const express = require('express');
const router = express.Router();
const {
  issueLoan,
  returnLoan,
  renewLoan,
  getLoans,
  getMyLoans,
  getOverdueLoans,
  getLoanById
} = require('../controllers/loan.controller');
const { protect, librarian } = require('../middlewares/auth.middleware');

// Member self-service endpoints
router.get('/my-loans', protect, getMyLoans);
router.post('/:id/renew', protect, renewLoan);

// Circulation Desk staff endpoints
router.post('/issue', protect, librarian, issueLoan);
router.post('/return', protect, librarian, returnLoan);
router.get('/overdue', protect, librarian, getOverdueLoans);
router.get('/', protect, librarian, getLoans);
router.get('/:id', protect, getLoanById);

module.exports = router;
