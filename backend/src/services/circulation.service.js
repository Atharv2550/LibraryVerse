const Loan = require('../models/Loan.model');
const BookCopy = require('../models/BookCopy.model');
const Book = require('../models/Book.model');
const User = require('../models/User.model');
const Reservation = require('../models/Reservation.model');
const Fine = require('../models/Fine.model');
const Policy = require('../models/Policy.model');
const ApiError = require('../utils/apiError');
const { syncBookCopyCounts } = require('./copy.service');
const { logAudit } = require('./audit.service');
const { createNotification } = require('./notification.service');

const DEFAULT_LOAN_DURATION_DAYS = 14;
const DEFAULT_DAILY_FINE_RATE = 1.0; // $1.00 per day overdue
const DEFAULT_RESERVATION_PICKUP_HOURS = 48;

/**
 * Issue a physical book copy to a library member.
 */
const issueBookCopy = async ({ copyIdentifier, memberIdentifier, issuedBy, customDueDate, notes, ipAddress }) => {
  // 1. Find Member (by ID, membershipId, or email)
  let member;
  if (memberIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
    member = await User.findById(memberIdentifier);
  }
  if (!member) {
    member = await User.findOne({
      $or: [
        { membershipId: memberIdentifier.trim().toUpperCase() },
        { email: memberIdentifier.trim().toLowerCase() }
      ]
    });
  }

  if (!member) {
    throw new ApiError(404, `Member not found matching identifier: "${memberIdentifier}"`);
  }

  if (member.membershipStatus !== 'active') {
    throw new ApiError(403, `Member account is ${member.membershipStatus}. Cannot issue books.`);
  }

  if (member.membershipExpiry && new Date(member.membershipExpiry) < new Date()) {
    throw new ApiError(403, 'Member card has expired. Please renew membership before borrowing.');
  }

  // 2. Check Member Borrowing Limits and Overdue Blocks
  const [activeLoansCount, overdueLoansCount] = await Promise.all([
    Loan.countDocuments({ member: member._id, status: 'active' }),
    Loan.countDocuments({ member: member._id, status: 'overdue' })
  ]);

  if (overdueLoansCount > 0) {
    throw new ApiError(403, `Member has ${overdueLoansCount} overdue book(s). All overdue items must be returned before new issues.`);
  }

  const maxLimit = member.maxBorrowLimit || 5;
  if (activeLoansCount >= maxLimit) {
    throw new ApiError(403, `Member has reached maximum borrowing limit (${maxLimit} books).`);
  }

  // 3. Find Physical Book Copy
  let copy;
  if (copyIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
    copy = await BookCopy.findById(copyIdentifier).populate('book');
  }
  if (!copy) {
    copy = await BookCopy.findOne({
      $or: [
        { barcode: copyIdentifier.trim() },
        { accessionNumber: copyIdentifier.trim().toUpperCase() }
      ]
    }).populate('book');
  }

  if (!copy) {
    throw new ApiError(404, `Physical copy not found with code: "${copyIdentifier}"`);
  }

  // 4. Verify copy availability
  if (copy.status === 'issued') {
    throw new ApiError(409, `This copy (${copy.accessionNumber}) is already issued to another reader.`);
  }

  if (['damaged', 'lost', 'maintenance'].includes(copy.status)) {
    throw new ApiError(400, `Copy status is "${copy.status}" and cannot be issued.`);
  }

  // If reserved, check whether it is reserved for this member
  if (copy.status === 'reserved') {
    const activeRes = await Reservation.findOne({
      book: copy.book._id,
      member: member._id,
      status: 'available'
    });
    if (!activeRes) {
      throw new ApiError(409, `This copy is currently held for another member's reservation pickup.`);
    }
  }

  // 5. Calculate due date
  const policy = await Policy.getEffectivePolicy();
  const loanDays = policy.loanDurationDays || DEFAULT_LOAN_DURATION_DAYS;
  const issueDate = new Date();
  let dueDate;
  if (customDueDate) {
    dueDate = new Date(customDueDate);
  } else {
    dueDate = new Date(issueDate.getTime() + loanDays * 24 * 60 * 60 * 1000);
  }

  // 6. Create Loan Record
  const loan = await Loan.create({
    book: copy.book._id,
    copy: copy._id,
    member: member._id,
    issuedBy: issuedBy._id,
    issueDate,
    dueDate,
    status: 'active',
    notes: notes || ''
  });

  // 7. Update Copy
  copy.status = 'issued';
  copy.currentLoan = loan._id;
  await copy.save();

  // 8. Fulfill reservation if member had one
  await Reservation.findOneAndUpdate(
    { book: copy.book._id, member: member._id, status: { $in: ['pending', 'available'] } },
    { status: 'fulfilled', copy: copy._id }
  );

  // 9. Sync book inventory counts
  await syncBookCopyCounts(copy.book._id);

  // 10. Audit Log
  await logAudit({
    actor: issuedBy,
    action: 'LOAN_ISSUE',
    entityType: 'Loan',
    entityId: loan._id,
    details: {
      bookTitle: copy.book.title,
      barcode: copy.barcode,
      accessionNumber: copy.accessionNumber,
      memberEmail: member.email,
      dueDate
    },
    ipAddress
  });

  // 11. Send notification to member
  await createNotification({
    user: member._id,
    type: 'loan_issued',
    title: 'Book Borrowed Successfully',
    message: `You borrowed "${copy.book.title}" (Copy: ${copy.accessionNumber}). Please return by ${dueDate.toLocaleDateString()}.`,
    referenceType: 'Loan',
    referenceId: loan._id,
    actor: issuedBy._id
  });

  return await Loan.findById(loan._id)
    .populate('book', 'title author coverImage isbn shelfLocation')
    .populate('copy', 'barcode accessionNumber shelfLocation condition')
    .populate('member', 'name email membershipId phone')
    .populate('issuedBy', 'name');
};

/**
 * Return an issued book copy. Automatically calculates overdue fines and checks reservation queue.
 */
const returnBookCopy = async ({ copyIdentifier, loanId, returnedTo, notes, ipAddress }) => {
  let loan;

  if (loanId) {
    loan = await Loan.findById(loanId)
      .populate('book')
      .populate('copy')
      .populate('member');
  } else if (copyIdentifier) {
    const trimmed = copyIdentifier.trim();
    const copy = await BookCopy.findOne({
      $or: [
        { barcode: trimmed },
        { accessionNumber: trimmed.toUpperCase() }
      ]
    });
    if (!copy) {
      throw new ApiError(404, `No physical copy found for code: "${copyIdentifier}"`);
    }

    loan = await Loan.findOne({ copy: copy._id, status: { $in: ['active', 'overdue'] } })
      .populate('book')
      .populate('copy')
      .populate('member');
  }

  if (!loan) {
    throw new ApiError(404, 'No active loan found for this item.');
  }

  if (loan.status === 'returned') {
    throw new ApiError(400, 'This loan has already been marked as returned.');
  }

  const returnDate = new Date();
  loan.returnDate = returnDate;
  loan.status = 'returned';
  loan.returnedTo = returnedTo._id;
  if (notes) loan.notes = (loan.notes ? loan.notes + ' | ' : '') + notes;

  // Check if overdue & calculate fine
  let fineRecord = null;
  if (returnDate > loan.dueDate) {
    const policy = await Policy.getEffectivePolicy();
    const fineRate = policy.dailyFineRate !== undefined ? policy.dailyFineRate : DEFAULT_DAILY_FINE_RATE;
    const diffMs = returnDate.getTime() - new Date(loan.dueDate).getTime();
    const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const fineAmount = parseFloat((daysOverdue * fineRate).toFixed(2));

    loan.fineAmount = fineAmount;

    fineRecord = await Fine.create({
      loan: loan._id,
      member: loan.member._id,
      amount: fineAmount,
      daysOverdue,
      dailyRate: fineRate,
      reason: 'overdue',
      status: 'outstanding',
      notes: `Returned ${daysOverdue} days late on ${returnDate.toLocaleDateString()}`
    });

    await createNotification({
      user: loan.member._id,
      type: 'fine_assessed',
      title: 'Overdue Fine Assessed',
      message: `A fine of $${fineAmount.toFixed(2)} was assessed for "${loan.book.title}" (${daysOverdue} days overdue).`,
      referenceType: 'Fine',
      referenceId: fineRecord._id,
      actor: returnedTo._id
    });
  }

  await loan.save();

  // Update physical copy & check reservation queue
  const copy = await BookCopy.findById(loan.copy._id);
  const nextReservation = await Reservation.findOne({
    book: loan.book._id,
    status: 'pending'
  }).sort({ requestDate: 1 });

  if (nextReservation) {
    // Hold copy for the reserving member
    copy.status = 'reserved';
    copy.currentLoan = null;
    await copy.save();

    const policy = await Policy.getEffectivePolicy();
    const pickupHours = policy.reservationPickupHours || 48;
    const pickupDeadline = new Date(Date.now() + pickupHours * 60 * 60 * 1000);
    nextReservation.status = 'available';
    nextReservation.copy = copy._id;
    nextReservation.pickupDeadline = pickupDeadline;
    nextReservation.notifiedAt = new Date();
    await nextReservation.save();

    await createNotification({
      user: nextReservation.member,
      type: 'reservation_available',
      title: 'Reserved Book Ready for Pickup!',
      message: `"${loan.book.title}" is now available at the library desk. Please claim before ${pickupDeadline.toLocaleDateString()} ${pickupDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      referenceType: 'Reservation',
      referenceId: nextReservation._id,
      actor: returnedTo._id
    });
  } else {
    copy.status = 'available';
    copy.currentLoan = null;
    await copy.save();
  }

  await syncBookCopyCounts(loan.book._id);

  await logAudit({
    actor: returnedTo,
    action: 'LOAN_RETURN',
    entityType: 'Loan',
    entityId: loan._id,
    details: {
      bookTitle: loan.book.title,
      barcode: loan.copy.barcode,
      member: loan.member.email,
      fineAmount: loan.fineAmount
    },
    ipAddress
  });

  await createNotification({
    user: loan.member._id,
    type: 'loan_returned',
    title: 'Book Returned Successfully',
    message: `You returned "${loan.book.title}". Thank you!`,
    referenceType: 'Loan',
    referenceId: loan._id,
    actor: returnedTo._id
  });

  return {
    loan,
    fineAssessed: fineRecord,
    heldForReservation: Boolean(nextReservation)
  };
};

/**
 * Renew an active book loan.
 */
const renewBookLoan = async ({ loanId, requestedBy, ipAddress }) => {
  const loan = await Loan.findById(loanId)
    .populate('book')
    .populate('copy')
    .populate('member');

  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  if (loan.status !== 'active') {
    throw new ApiError(400, `Cannot renew loan with status "${loan.status}". Only active loans are eligible.`);
  }

  // If member is renewing own loan, verify ownership
  const isLibrarian = ['admin', 'librarian'].includes(requestedBy.role);
  if (!isLibrarian && String(loan.member._id) !== String(requestedBy._id)) {
    throw new ApiError(403, 'You can only renew your own loans');
  }

  // Check overdue: cannot renew if already overdue
  if (new Date() > new Date(loan.dueDate)) {
    throw new ApiError(400, 'Loan is overdue and cannot be renewed. Please return the book to the library desk.');
  }

  // Check renewal count
  if (loan.renewalCount >= loan.maxRenewals) {
    throw new ApiError(400, `Maximum renewal limit (${loan.maxRenewals}) reached for this loan.`);
  }

  // Check pending reservations from other members
  const pendingReservation = await Reservation.findOne({
    book: loan.book._id,
    member: { $ne: loan.member._id },
    status: 'pending'
  });

  if (pendingReservation) {
    throw new ApiError(409, 'Cannot renew: another reader has an active reservation waiting for this title.');
  }

  // Extend due date by configured loan duration
  const policy = await Policy.getEffectivePolicy();
  const loanDays = policy.loanDurationDays || DEFAULT_LOAN_DURATION_DAYS;
  const currentDue = new Date(loan.dueDate);
  const newDueDate = new Date(currentDue.getTime() + loanDays * 24 * 60 * 60 * 1000);

  loan.dueDate = newDueDate;
  loan.renewalCount += 1;
  await loan.save();

  await logAudit({
    actor: requestedBy,
    action: 'LOAN_RENEW',
    entityType: 'Loan',
    entityId: loan._id,
    details: {
      bookTitle: loan.book.title,
      barcode: loan.copy.barcode,
      renewalCount: loan.renewalCount,
      newDueDate
    },
    ipAddress
  });

  await createNotification({
    user: loan.member._id,
    type: 'loan_renewed',
    title: 'Loan Renewed Successfully',
    message: `Your loan for "${loan.book.title}" has been renewed until ${newDueDate.toLocaleDateString()}.`,
    referenceType: 'Loan',
    referenceId: loan._id,
    actor: requestedBy._id
  });

  return loan;
};

/**
 * Scan all active loans and update any overdue items.
 */
const updateOverdueLoans = async () => {
  const now = new Date();
  const overdueLoans = await Loan.find({
    status: 'active',
    dueDate: { $lt: now }
  }).populate('book copy member');

  for (const loan of overdueLoans) {
    loan.status = 'overdue';
    const diffMs = now.getTime() - new Date(loan.dueDate).getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    loan.fineAmount = parseFloat((days * DAILY_FINE_RATE).toFixed(2));
    await loan.save();

    // Idempotent overdue notification check (max 1 notification per 3 days)
    const existingNotif = await require('../models/Notification.model').findOne({
      user: loan.member._id,
      referenceType: 'Loan',
      referenceId: loan._id,
      type: 'loan_overdue',
      createdAt: { $gt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
    });

    if (!existingNotif) {
      await createNotification({
        user: loan.member._id,
        type: 'loan_overdue',
        title: 'Book Overdue Notice',
        message: `Your loan for "${loan.book.title}" was due on ${loan.dueDate.toLocaleDateString()} and is now overdue. Please return it promptly.`,
        referenceType: 'Loan',
        referenceId: loan._id
      });
    }
  }

  return overdueLoans.length;
};

module.exports = {
  issueBookCopy,
  returnBookCopy,
  renewBookLoan,
  updateOverdueLoans
};
