const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification recipient user is required'],
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'loan_issued',
      'loan_returned',
      'loan_due_soon',
      'loan_overdue',
      'loan_renewed',
      'reservation_available',
      'reservation_fulfilled',
      'fine_assessed',
      'fine_paid',
      'fine_waived',
      'membership_updated',
      'system'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  referenceType: {
    type: String,
    enum: ['Loan', 'Reservation', 'Fine', 'Book', 'BookCopy', 'User', null],
    default: null
  },
  referenceId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
