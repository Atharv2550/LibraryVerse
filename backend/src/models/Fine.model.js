const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    default: null,
    index: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Fine amount is required'],
    min: [0, 'Fine amount cannot be negative']
  },
  daysOverdue: {
    type: Number,
    default: 0
  },
  dailyRate: {
    type: Number,
    default: 1.0
  },
  reason: {
    type: String,
    enum: ['overdue', 'damaged', 'lost', 'other'],
    default: 'overdue'
  },
  status: {
    type: String,
    enum: ['outstanding', 'paid', 'waived'],
    default: 'outstanding',
    index: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online', 'waiver', 'none'],
    default: 'none'
  },
  waiverReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  transactionReference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

fineSchema.index({ member: 1, status: 1 });
fineSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Fine', fineSchema);
