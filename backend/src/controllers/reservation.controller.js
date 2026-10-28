const Reservation = require('../models/Reservation.model');
const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');
const { syncBookCopyCounts } = require('../services/copy.service');

// Member: Create a reservation for a book
const createReservation = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  if (!bookId) {
    throw new ApiError(400, 'Book ID is required');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  if (req.user.membershipStatus !== 'active') {
    throw new ApiError(403, 'Your membership status does not allow reservations');
  }

  // Prevent duplicate active reservations for the same book by this member
  const existing = await Reservation.findOne({
    book: bookId,
    member: req.user._id,
    status: { $in: ['pending', 'available'] }
  });

  if (existing) {
    throw new ApiError(409, 'You already have an active reservation for this book title');
  }

  // Calculate priority in queue
  const pendingCount = await Reservation.countDocuments({
    book: bookId,
    status: 'pending'
  });
  const priority = pendingCount + 1;

  const reservation = await Reservation.create({
    book: bookId,
    member: req.user._id,
    priority,
    status: 'pending'
  });

  await logAudit({
    actor: req.user,
    action: 'RESERVATION_CREATE',
    entityType: 'Reservation',
    entityId: reservation._id,
    details: { bookTitle: book.title, priority },
    ipAddress: req.ip
  });

  await createNotification({
    user: req.user._id,
    type: 'system',
    title: 'Book Reserved',
    message: `You reserved "${book.title}". You are #${priority} in line. We will notify you when a copy is ready.`,
    referenceType: 'Book',
    referenceId: book._id
  });

  return res.status(201).json(
    new ApiResponse(201, reservation, 'Reservation placed successfully')
  );
});

// Member / Staff: Cancel reservation
const cancelReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reservation = await Reservation.findById(id).populate('book');
  if (!reservation) {
    throw new ApiError(404, 'Reservation not found');
  }

  const isStaff = ['admin', 'librarian'].includes(req.user.role);
  if (!isStaff && String(reservation.member) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden: Cannot cancel another member\'s reservation');
  }

  if (['fulfilled', 'cancelled', 'expired'].includes(reservation.status)) {
    throw new ApiError(400, `Cannot cancel reservation with status "${reservation.status}"`);
  }

  const previousStatus = reservation.status;
  const copyId = reservation.copy;
  reservation.status = 'cancelled';
  await reservation.save();

  // If a copy was held for this reservation, release it or pass to next reserver
  if (previousStatus === 'available' && copyId) {
    const nextRes = await Reservation.findOne({
      book: reservation.book._id,
      status: 'pending',
      _id: { $ne: reservation._id }
    }).sort({ requestDate: 1 });

    const copy = await BookCopy.findById(copyId);
    if (copy) {
      if (nextRes) {
        copy.status = 'reserved';
        await copy.save();
        nextRes.status = 'available';
        nextRes.copy = copy._id;
        nextRes.pickupDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await nextRes.save();
      } else {
        copy.status = 'available';
        await copy.save();
      }
      await syncBookCopyCounts(reservation.book._id);
    }
  }

  await logAudit({
    actor: req.user,
    action: 'RESERVATION_CANCEL',
    entityType: 'Reservation',
    entityId: reservation._id,
    details: { bookTitle: reservation.book.title },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, reservation, 'Reservation cancelled successfully')
  );
});

// Staff: Get all reservations with filters
const getReservations = asyncHandler(async (req, res) => {
  const { status, bookId, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (bookId) query.book = bookId;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Reservation.countDocuments(query);
  const reservations = await Reservation.find(query)
    .populate('book', 'title author isbn coverImage shelfLocation')
    .populate('copy', 'barcode accessionNumber')
    .populate('member', 'name email membershipId phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(
    new ApiResponse(200, {
      items: reservations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Reservations retrieved successfully')
  );
});

// Member: Get personal reservations
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ member: req.user._id })
    .populate('book', 'title author coverImage shelfLocation genre')
    .populate('copy', 'barcode accessionNumber')
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, reservations, 'Personal reservations retrieved successfully')
  );
});

module.exports = {
  createReservation,
  cancelReservation,
  getReservations,
  getMyReservations
};
