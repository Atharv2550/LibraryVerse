const Loan = require('../models/Loan.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  issueBookCopy,
  returnBookCopy,
  renewBookLoan,
  updateOverdueLoans
} = require('../services/circulation.service');

// Issue book copy to member (Librarian / Admin)
const issueLoan = asyncHandler(async (req, res) => {
  const { copyIdentifier, memberIdentifier, dueDate, notes } = req.body;

  if (!copyIdentifier || !memberIdentifier) {
    throw new ApiError(400, 'Both copy barcode/accession and member ID/email are required');
  }

  const loan = await issueBookCopy({
    copyIdentifier,
    memberIdentifier,
    issuedBy: req.user,
    customDueDate: dueDate,
    notes,
    ipAddress: req.ip
  });

  return res.status(201).json(
    new ApiResponse(201, loan, 'Book issued successfully')
  );
});

// Return book copy (Librarian / Admin)
const returnLoan = asyncHandler(async (req, res) => {
  const { copyIdentifier, loanId, notes } = req.body;

  if (!copyIdentifier && !loanId) {
    throw new ApiError(400, 'Either copy barcode/accession or loan ID is required to process return');
  }

  const result = await returnBookCopy({
    copyIdentifier,
    loanId,
    returnedTo: req.user,
    notes,
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, result, 'Book return processed successfully')
  );
});

// Renew loan (Member self-service or Librarian)
const renewLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loan = await renewBookLoan({
    loanId: id,
    requestedBy: req.user,
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, loan, 'Loan renewed successfully')
  );
});

// Get all loans with filters and pagination (Librarian / Admin)
const getLoans = asyncHandler(async (req, res) => {
  const { status, memberId, bookId, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }
  if (memberId) {
    query.member = memberId;
  }
  if (bookId) {
    query.book = bookId;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Loan.countDocuments(query);
  const loans = await Loan.find(query)
    .populate('book', 'title author coverImage isbn shelfLocation')
    .populate('copy', 'barcode accessionNumber shelfLocation condition')
    .populate('member', 'name email membershipId phone')
    .populate('issuedBy', 'name')
    .populate('returnedTo', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(
    new ApiResponse(200, {
      items: loans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Loans retrieved successfully')
  );
});

// Get current member's personal loans (Member self-service)
const getMyLoans = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { member: req.user._id };

  if (status) {
    query.status = status;
  }

  const loans = await Loan.find(query)
    .populate('book', 'title author coverImage isbn shelfLocation genre')
    .populate('copy', 'barcode accessionNumber shelfLocation')
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, loans, 'Personal loans retrieved successfully')
  );
});

// Get overdue loans (Librarian / Admin)
const getOverdueLoans = asyncHandler(async (req, res) => {
  await updateOverdueLoans();

  const now = new Date();
  const overdueLoans = await Loan.find({
    status: { $in: ['active', 'overdue'] },
    dueDate: { $lt: now }
  })
    .populate('book', 'title author isbn coverImage')
    .populate('copy', 'barcode accessionNumber')
    .populate('member', 'name email membershipId phone')
    .sort({ dueDate: 1 });

  return res.json(
    new ApiResponse(200, overdueLoans, 'Overdue loans retrieved successfully')
  );
});

// Get single loan by ID
const getLoanById = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id)
    .populate('book')
    .populate('copy')
    .populate('member', 'name email membershipId phone')
    .populate('issuedBy', 'name')
    .populate('returnedTo', 'name');

  if (!loan) {
    throw new ApiError(404, 'Loan record not found');
  }

  // Ensure member can only view their own loan unless librarian/admin
  const isStaff = ['admin', 'librarian'].includes(req.user.role);
  if (!isStaff && String(loan.member._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden: Cannot view another member\'s loan');
  }

  return res.json(
    new ApiResponse(200, loan, 'Loan retrieved successfully')
  );
});

module.exports = {
  issueLoan,
  returnLoan,
  renewLoan,
  getLoans,
  getMyLoans,
  getOverdueLoans,
  getLoanById
};
