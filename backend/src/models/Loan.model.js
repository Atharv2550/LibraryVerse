const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    index: true
  },
  copy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookCopy',
    required: [true, 'Physical copy reference is required'],
    index: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required'],
    index: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Staff member who issued the loan is required']
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  returnDate: {
    type: Date,
    default: null,
    index: true
  },
  renewalCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxRenewals: {
    type: Number,
    default: 2
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active',
    index: true
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, {
  timestamps: true
});

loanSchema.index({ member: 1, status: 1 });
loanSchema.index({ copy: 1, status: 1 });
loanSchema.index({ book: 1, status: 1 });
loanSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Loan', loanSchema);
