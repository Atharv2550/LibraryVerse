const Fine = require('../models/Fine.model');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');

// Staff: Get all fines with filters
const getFines = asyncHandler(async (req, res) => {
  const { status, memberId, reason, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (memberId) query.member = memberId;
  if (reason) query.reason = reason;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Fine.countDocuments(query);
  const fines = await Fine.find(query)
    .populate('member', 'name email membershipId phone')
    .populate({
      path: 'loan',
      populate: [
        { path: 'book', select: 'title author isbn coverImage' },
        { path: 'copy', select: 'barcode accessionNumber' }
      ]
    })
    .populate('collectedBy', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Summary aggregation
  const summary = await Fine.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summaryStats = {
    outstanding: summary.find((s) => s._id === 'outstanding')?.totalAmount || 0,
    paid: summary.find((s) => s._id === 'paid')?.totalAmount || 0,
    waived: summary.find((s) => s._id === 'waived')?.totalAmount || 0
  };

  return res.json(
    new ApiResponse(200, {
      items: fines,
      summary: summaryStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Fines retrieved successfully')
  );
});

// Member: Get personal fines
const getMyFines = asyncHandler(async (req, res) => {
  const fines = await Fine.find({ member: req.user._id })
    .populate({
      path: 'loan',
      populate: { path: 'book', select: 'title author coverImage isbn' }
    })
    .sort({ createdAt: -1 });

  const outstandingTotal = fines
    .filter((f) => f.status === 'outstanding')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  return res.json(
    new ApiResponse(200, {
      fines,
      outstandingTotal
    }, 'Personal fines retrieved successfully')
  );
});

// Staff: Record manual payment for fine
const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentMethod = 'cash', transactionReference, notes } = req.body;

  const fine = await Fine.findById(id).populate('member');
  if (!fine) {
    throw new ApiError(404, 'Fine record not found');
  }

  if (fine.status === 'paid') {
    throw new ApiError(400, 'This fine has already been marked as paid');
  }
  if (fine.status === 'waived') {
    throw new ApiError(400, 'This fine was waived and cannot accept payment');
  }

  fine.status = 'paid';
  fine.paidAmount = fine.amount;
  fine.paymentDate = new Date();
  fine.paymentMethod = paymentMethod;
  if (transactionReference) fine.transactionReference = transactionReference.trim();
  if (notes) fine.notes = (fine.notes ? fine.notes + ' | ' : '') + notes.trim();
  fine.collectedBy = req.user._id;

  await fine.save();

  // If associated with a loan, mark finePaid on loan
  if (fine.loan) {
    const Loan = require('../models/Loan.model');
    await Loan.findByIdAndUpdate(fine.loan, { finePaid: true });
  }

  await logAudit({
    actor: req.user,
    action: 'FINE_PAYMENT_COLLECTED',
    entityType: 'Fine',
    entityId: fine._id,
    details: {
      amount: fine.amount,
      member: fine.member.email,
      paymentMethod,
      transactionReference
    },
    ipAddress: req.ip
  });

  await createNotification({
    user: fine.member._id,
    type: 'fine_paid',
    title: 'Payment Receipt: Library Fine',
    message: `Payment of $${fine.amount.toFixed(2)} received via ${paymentMethod.toUpperCase()}. Thank you!`,
    referenceType: 'Fine',
    referenceId: fine._id,
    actor: req.user._id
  });

  return res.json(
    new ApiResponse(200, fine, 'Payment recorded successfully')
  );
});

// Staff: Waive fine with mandatory reason
const waiveFine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { waiverReason } = req.body;

  if (!waiverReason || !waiverReason.trim()) {
    throw new ApiError(400, 'A valid waiver reason is mandatory');
  }

  const fine = await Fine.findById(id).populate('member');
  if (!fine) {
    throw new ApiError(404, 'Fine record not found');
  }

  if (fine.status !== 'outstanding') {
    throw new ApiError(400, `Cannot waive fine with status "${fine.status}"`);
  }

  fine.status = 'waived';
  fine.waiverReason = waiverReason.trim();
  fine.paymentMethod = 'waiver';
  fine.paymentDate = new Date();
  fine.collectedBy = req.user._id;

  await fine.save();

  if (fine.loan) {
    const Loan = require('../models/Loan.model');
    await Loan.findByIdAndUpdate(fine.loan, { finePaid: true });
  }

  await logAudit({
    actor: req.user,
    action: 'FINE_WAIVED',
    entityType: 'Fine',
    entityId: fine._id,
    details: {
      amount: fine.amount,
      member: fine.member.email,
      waiverReason: fine.waiverReason
    },
    ipAddress: req.ip
  });

  await createNotification({
    user: fine.member._id,
    type: 'fine_waived',
    title: 'Fine Waived',
    message: `Your fine of $${fine.amount.toFixed(2)} was waived. Reason: ${fine.waiverReason}`,
    referenceType: 'Fine',
    referenceId: fine._id,
    actor: req.user._id
  });

  return res.json(
    new ApiResponse(200, fine, 'Fine waived successfully')
  );
});

// Staff: Assess manual fine (damaged/lost item penalty)
const assessManualFine = asyncHandler(async (req, res) => {
  const { memberId, amount, reason = 'damaged', notes } = req.body;

  if (!memberId || !amount || Number(amount) <= 0) {
    throw new ApiError(400, 'Member ID and a positive fine amount are required');
  }

  const member = await User.findById(memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  const fine = await Fine.create({
    member: member._id,
    amount: Number(amount),
    reason,
    status: 'outstanding',
    notes: notes ? notes.trim() : `Manual penalty assessed for: ${reason}`,
    collectedBy: req.user._id
  });

  await logAudit({
    actor: req.user,
    action: 'FINE_ASSESSED',
    entityType: 'Fine',
    entityId: fine._id,
    details: { amount: fine.amount, reason: fine.reason, member: member.email },
    ipAddress: req.ip
  });

  await createNotification({
    user: member._id,
    type: 'fine_assessed',
    title: 'Library Fine Assessed',
    message: `A penalty of $${Number(amount).toFixed(2)} was assessed to your account for: ${reason}.`,
    referenceType: 'Fine',
    referenceId: fine._id,
    actor: req.user._id
  });

  return res.status(201).json(
    new ApiResponse(201, fine, 'Fine assessed successfully')
  );
});

module.exports = {
  getFines,
  getMyFines,
  recordPayment,
  waiveFine,
  assessManualFine
};
