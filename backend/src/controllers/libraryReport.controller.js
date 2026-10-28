const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');
const Loan = require('../models/Loan.model');
const User = require('../models/User.model');
const Reservation = require('../models/Reservation.model');
const Fine = require('../models/Fine.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

// Staff: Get dashboard analytics overview via MongoDB aggregations
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const [
    totalTitles,
    totalCopies,
    availableCopies,
    issuedCopies,
    damagedCopies,
    lostCopies,
    activeMembers,
    activeLoans,
    overdueLoans,
    pendingReservations,
    finesSummary
  ] = await Promise.all([
    Book.countDocuments(),
    BookCopy.countDocuments(),
    BookCopy.countDocuments({ status: 'available' }),
    BookCopy.countDocuments({ status: 'issued' }),
    BookCopy.countDocuments({ status: 'damaged' }),
    BookCopy.countDocuments({ status: 'lost' }),
    User.countDocuments({ membershipStatus: 'active' }),
    Loan.countDocuments({ status: 'active' }),
    Loan.countDocuments({ status: 'overdue' }),
    Reservation.countDocuments({ status: { $in: ['pending', 'available'] } }),
    Fine.aggregate([
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const outstandingFines = finesSummary.find((f) => f._id === 'outstanding')?.total || 0;
  const collectedFines = finesSummary.find((f) => f._id === 'paid')?.total || 0;

  // Monthly issues and returns in the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyLoans = await Loan.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        issued: { $sum: 1 },
        returned: {
          $sum: { $cond: [{ $ifNull: ['$returnDate', false] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Most borrowed books (Top 5)
  const mostBorrowed = await Loan.aggregate([
    {
      $group: {
        _id: '$book',
        borrowCount: { $sum: 1 }
      }
    },
    { $sort: { borrowCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'book'
      }
    },
    { $unwind: '$book' },
    {
      $project: {
        _id: 1,
        borrowCount: 1,
        title: '$book.title',
        author: '$book.author',
        genre: '$book.genre',
        coverImage: '$book.coverImage'
      }
    }
  ]);

  // Popular categories
  const popularCategories = await Book.aggregate([
    {
      $group: {
        _id: { $ifNull: ['$category', '$genre'] },
        count: { $sum: 1 },
        totalCopies: { $sum: '$totalCopies' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  return res.json(
    new ApiResponse(200, {
      kpis: {
        totalTitles,
        totalCopies,
        availableCopies,
        issuedCopies,
        damagedOrLost: damagedCopies + lostCopies,
        activeMembers,
        activeLoans,
        overdueLoans,
        pendingReservations,
        outstandingFines,
        collectedFines
      },
      monthlyLoans,
      mostBorrowed,
      popularCategories
    }, 'Analytics overview fetched successfully')
  );
});

// Helper to escape CSV cell values
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// Staff: Export reports as CSV
const exportReportCsv = asyncHandler(async (req, res) => {
  const { type = 'loans', status, fromDate, toDate } = req.query;

  let filename = `library-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  let csvContent = '';

  const dateFilter = {};
  if (fromDate) dateFilter.$gte = new Date(fromDate);
  if (toDate) dateFilter.$lte = new Date(toDate);

  if (type === 'loans') {
    const query = {};
    if (status) query.status = status;
    if (fromDate || toDate) query.createdAt = dateFilter;

    const loans = await Loan.find(query)
      .populate('book', 'title author isbn')
      .populate('copy', 'barcode accessionNumber')
      .populate('member', 'name email membershipId')
      .sort({ createdAt: -1 });

    const headers = ['Loan ID', 'Book Title', 'Author', 'ISBN', 'Barcode', 'Accession', 'Member Name', 'Member ID', 'Member Email', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine Amount'];
    const rows = loans.map((l) => [
      l._id,
      l.book?.title,
      l.book?.author,
      l.book?.isbn,
      l.copy?.barcode,
      l.copy?.accessionNumber,
      l.member?.name,
      l.member?.membershipId,
      l.member?.email,
      l.issueDate ? new Date(l.issueDate).toISOString().split('T')[0] : '',
      l.dueDate ? new Date(l.dueDate).toISOString().split('T')[0] : '',
      l.returnDate ? new Date(l.returnDate).toISOString().split('T')[0] : '',
      l.status,
      l.fineAmount || 0
    ]);

    csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  } else if (type === 'overdue') {
    const loans = await Loan.find({
      status: { $in: ['active', 'overdue'] },
      dueDate: { $lt: new Date() }
    })
      .populate('book', 'title author isbn')
      .populate('copy', 'barcode accessionNumber')
      .populate('member', 'name email membershipId phone')
      .sort({ dueDate: 1 });

    const headers = ['Loan ID', 'Book Title', 'Barcode', 'Member Name', 'Member ID', 'Member Email', 'Phone', 'Due Date', 'Days Overdue', 'Estimated Fine'];
    const now = new Date();
    const rows = loans.map((l) => {
      const days = Math.max(1, Math.ceil((now - new Date(l.dueDate)) / (1000 * 60 * 60 * 24)));
      return [
        l._id,
        l.book?.title,
        l.copy?.barcode,
        l.member?.name,
        l.member?.membershipId,
        l.member?.email,
        l.member?.phone || '',
        new Date(l.dueDate).toISOString().split('T')[0],
        days,
        (days * 1.0).toFixed(2)
      ];
    });

    csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  } else if (type === 'inventory') {
    const copies = await BookCopy.find()
      .populate('book', 'title author genre isbn publisher shelfLocation')
      .sort({ createdAt: -1 });

    const headers = ['Copy ID', 'Book Title', 'Author', 'Genre', 'ISBN', 'Publisher', 'Accession Number', 'Barcode', 'Status', 'Condition', 'Shelf Location', 'Price'];
    const rows = copies.map((c) => [
      c._id,
      c.book?.title,
      c.book?.author,
      c.book?.genre,
      c.book?.isbn,
      c.book?.publisher,
      c.accessionNumber,
      c.barcode,
      c.status,
      c.condition,
      c.shelfLocation,
      c.price || 0
    ]);

    csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  } else if (type === 'fines') {
    const fines = await Fine.find()
      .populate('member', 'name email membershipId')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    const headers = ['Fine ID', 'Member Name', 'Member ID', 'Amount', 'Reason', 'Status', 'Payment Method', 'Payment Date', 'Collected By', 'Waiver Reason'];
    const rows = fines.map((f) => [
      f._id,
      f.member?.name,
      f.member?.membershipId,
      f.amount,
      f.reason,
      f.status,
      f.paymentMethod,
      f.paymentDate ? new Date(f.paymentDate).toISOString().split('T')[0] : '',
      f.collectedBy?.name || '',
      f.waiverReason || ''
    ]);

    csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  } else if (type === 'members') {
    const members = await User.find({ role: { $in: ['member', 'user'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    const headers = ['Member ID', 'Name', 'Email', 'Phone', 'Address', 'Status', 'Expiry Date', 'Max Borrow Limit', 'Joined Date'];
    const rows = members.map((m) => [
      m.membershipId || '',
      m.name,
      m.email,
      m.phone || '',
      m.address || '',
      m.membershipStatus,
      m.membershipExpiry ? new Date(m.membershipExpiry).toISOString().split('T')[0] : '',
      m.maxBorrowLimit || 5,
      new Date(m.createdAt).toISOString().split('T')[0]
    ]);

    csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  } else {
    throw new ApiError(400, `Unknown report type: ${type}`);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});

module.exports = {
  getAnalyticsOverview,
  exportReportCsv
};
