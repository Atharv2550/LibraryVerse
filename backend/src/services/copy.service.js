const BookCopy = require('../models/BookCopy.model');
const Book = require('../models/Book.model');
const ApiError = require('../utils/apiError');

/**
 * Synchronize inventory counts on the Book document based on BookCopy records.
 * Ensures physical copies are always the single source of truth.
 */
const syncBookCopyCounts = async (bookId) => {
  const [total, available, issued, reserved] = await Promise.all([
    BookCopy.countDocuments({ book: bookId }),
    BookCopy.countDocuments({ book: bookId, status: 'available' }),
    BookCopy.countDocuments({ book: bookId, status: 'issued' }),
    BookCopy.countDocuments({ book: bookId, status: 'reserved' })
  ]);

  await Book.findByIdAndUpdate(bookId, {
    totalCopies: total,
    availableCopies: available,
    issuedCopies: issued,
    reservedCopies: reserved
  });

  return { total, available, issued, reserved };
};

/**
 * Generate unique accession number and barcode for a copy
 */
const generateAccessionAndBarcode = async (bookId) => {
  const existingCount = await BookCopy.countDocuments({ book: bookId });
  const copyNumber = existingCount + 1;
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(10 + Math.random() * 90);

  const accessionNumber = `ACC-${timestamp}-${copyNumber}${randomSuffix}`;
  const barcode = `BC${timestamp}${copyNumber}${randomSuffix}`;

  return { copyNumber, accessionNumber, barcode };
};

module.exports = {
  syncBookCopyCounts,
  generateAccessionAndBarcode
};
