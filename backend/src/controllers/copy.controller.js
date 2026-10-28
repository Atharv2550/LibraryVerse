const BookCopy = require('../models/BookCopy.model');
const Book = require('../models/Book.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { syncBookCopyCounts, generateAccessionAndBarcode } = require('../services/copy.service');
const { logAudit } = require('../services/audit.service');

// Get all copies with pagination and filter
const getAllCopies = asyncHandler(async (req, res) => {
  const { status, condition, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (condition) query.condition = condition;

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { accessionNumber: regex },
      { barcode: regex },
      { shelfLocation: regex }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await BookCopy.countDocuments(query);
  const copies = await BookCopy.find(query)
    .populate('book', 'title author isbn coverImage shelfLocation')
    .populate({
      path: 'currentLoan',
      populate: { path: 'member', select: 'name email membershipId' }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(
    new ApiResponse(200, {
      items: copies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Copies retrieved successfully')
  );
});

// Get all physical copies for a specific book title
const getCopiesByBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const copies = await BookCopy.find({ book: bookId })
    .populate({
      path: 'currentLoan',
      populate: { path: 'member', select: 'name email membershipId' }
    })
    .sort({ copyNumber: 1 });

  return res.json(
    new ApiResponse(200, copies, 'Book copies retrieved successfully')
  );
});

// Fast lookup by barcode or accession number (Used at Circulation Desk)
const lookupCopy = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const trimmed = code.trim();

  const copy = await BookCopy.findOne({
    $or: [
      { barcode: trimmed },
      { accessionNumber: trimmed.toUpperCase() }
    ]
  })
    .populate('book')
    .populate({
      path: 'currentLoan',
      populate: { path: 'member', select: 'name email membershipId phone membershipStatus' }
    });

  if (!copy) {
    throw new ApiError(404, `No physical copy found matching code: ${code}`);
  }

  return res.json(
    new ApiResponse(200, copy, 'Copy retrieved successfully')
  );
});

// Create single copy
const createCopy = asyncHandler(async (req, res) => {
  const { bookId, shelfLocation, condition, price, notes, barcode, accessionNumber } = req.body;

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const generated = await generateAccessionAndBarcode(bookId);

  const copy = await BookCopy.create({
    book: bookId,
    copyNumber: generated.copyNumber,
    accessionNumber: accessionNumber ? accessionNumber.trim().toUpperCase() : generated.accessionNumber,
    barcode: barcode ? barcode.trim() : generated.barcode,
    shelfLocation: shelfLocation ? shelfLocation.trim() : (book.shelfLocation || 'Main Stacks'),
    condition: condition || 'good',
    price: price !== undefined ? Number(price) : 19.99,
    notes: notes ? notes.trim() : ''
  });

  await syncBookCopyCounts(bookId);

  await logAudit({
    actor: req.user,
    action: 'COPY_CREATE',
    entityType: 'BookCopy',
    entityId: copy._id,
    details: { bookTitle: book.title, barcode: copy.barcode, accessionNumber: copy.accessionNumber },
    ipAddress: req.ip
  });

  return res.status(201).json(
    new ApiResponse(201, copy, 'Book copy created successfully')
  );
});

// Bulk create physical copies (e.g., adding 5 copies at once)
const bulkCreateCopies = asyncHandler(async (req, res) => {
  const { bookId, count = 1, shelfLocation, condition = 'good', price = 19.99 } = req.body;

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  const numCount = Math.max(1, Math.min(50, Number(count)));
  const existingCount = await BookCopy.countDocuments({ book: bookId });
  const createdCopies = [];

  for (let i = 1; i <= numCount; i++) {
    const copyNum = existingCount + i;
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(100 + Math.random() * 900);
    const accessionNumber = `ACC-${timestamp}-${copyNum}${rand}`;
    const barcode = `BC${timestamp}${copyNum}${rand}`;

    const newCopy = await BookCopy.create({
      book: bookId,
      copyNumber: copyNum,
      accessionNumber,
      barcode,
      shelfLocation: shelfLocation ? shelfLocation.trim() : (book.shelfLocation || 'Main Stacks'),
      condition,
      price: Number(price)
    });
    createdCopies.push(newCopy);
  }

  await syncBookCopyCounts(bookId);

  await logAudit({
    actor: req.user,
    action: 'COPY_BULK_CREATE',
    entityType: 'BookCopy',
    entityId: book._id,
    details: { bookTitle: book.title, count: numCount },
    ipAddress: req.ip
  });

  return res.status(201).json(
    new ApiResponse(201, createdCopies, `Successfully created ${numCount} copies`)
  );
});

// Update physical copy status/condition/location
const updateCopy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, condition, shelfLocation, price, notes } = req.body;

  const copy = await BookCopy.findById(id).populate('book');
  if (!copy) {
    throw new ApiError(404, 'Copy not found');
  }

  if (status) {
    if (copy.status === 'issued' && status !== 'issued') {
      throw new ApiError(400, 'Cannot change status of an actively issued copy. Process a return first.');
    }
    copy.status = status;
  }

  if (condition) copy.condition = condition;
  if (shelfLocation !== undefined) copy.shelfLocation = shelfLocation.trim();
  if (price !== undefined) copy.price = Number(price);
  if (notes !== undefined) copy.notes = notes.trim();

  await copy.save();
  await syncBookCopyCounts(copy.book._id);

  await logAudit({
    actor: req.user,
    action: 'COPY_UPDATE',
    entityType: 'BookCopy',
    entityId: copy._id,
    details: { barcode: copy.barcode, status: copy.status, condition: copy.condition },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, copy, 'Copy updated successfully')
  );
});

// Delete physical copy
const deleteCopy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const copy = await BookCopy.findById(id);
  if (!copy) {
    throw new ApiError(404, 'Copy not found');
  }

  if (copy.status === 'issued') {
    throw new ApiError(400, 'Cannot delete a copy that is currently issued to a member');
  }

  const bookId = copy.book;
  await BookCopy.findByIdAndDelete(id);
  await syncBookCopyCounts(bookId);

  await logAudit({
    actor: req.user,
    action: 'COPY_DELETE',
    entityType: 'BookCopy',
    entityId: id,
    details: { accessionNumber: copy.accessionNumber, barcode: copy.barcode },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, null, 'Copy deleted successfully')
  );
});

module.exports = {
  getAllCopies,
  getCopiesByBook,
  lookupCopy,
  createCopy,
  bulkCreateCopies,
  updateCopy,
  deleteCopy
};
