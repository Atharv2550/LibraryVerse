const mongoose = require('mongoose');

const bookCopySchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    index: true
  },
  copyNumber: {
    type: Number,
    required: true,
    min: 1
  },
  accessionNumber: {
    type: String,
    required: [true, 'Accession number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  barcode: {
    type: String,
    required: [true, 'Barcode is required'],
    unique: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['available', 'issued', 'reserved', 'damaged', 'lost', 'maintenance'],
    default: 'available',
    index: true
  },
  shelfLocation: {
    type: String,
    trim: true,
    default: 'Main Stacks'
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor', 'damaged'],
    default: 'good'
  },
  price: {
    type: Number,
    min: 0,
    default: 19.99
  },
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  currentLoan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    default: null
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  }
}, {
  timestamps: true
});

bookCopySchema.index({ book: 1, copyNumber: 1 }, { unique: true });

module.exports = mongoose.model('BookCopy', bookCopySchema);
