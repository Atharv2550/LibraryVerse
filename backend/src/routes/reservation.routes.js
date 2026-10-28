const express = require('express');
const router = express.Router();
const {
  createReservation,
  cancelReservation,
  getReservations,
  getMyReservations
} = require('../controllers/reservation.controller');
const { protect, librarian } = require('../middlewares/auth.middleware');

router.get('/my', protect, getMyReservations);
router.post('/', protect, createReservation);
router.post('/:id/cancel', protect, cancelReservation);
router.get('/', protect, librarian, getReservations);

module.exports = router;
