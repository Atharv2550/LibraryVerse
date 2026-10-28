const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    index: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required'],
    index: true
  },
  copy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookCopy',
    default: null
  },
  requestDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'available', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  pickupDeadline: {
    type: Date,
    default: null
  },
  notifiedAt: {
    type: Date,
    default: null
  },
  priority: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    maxlength: 300,
    trim: true
  }
}, {
  timestamps: true
});

reservationSchema.index({ book: 1, member: 1, status: 1 });
reservationSchema.index({ book: 1, status: 1, requestDate: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
