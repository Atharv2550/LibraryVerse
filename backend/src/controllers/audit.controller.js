const AuditLog = require('../models/AuditLog.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Admin ONLY: Get audit logs with filters and pagination
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, entityType, actorId, page = 1, limit = 50 } = req.query;
  const query = {};

  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (actorId) query.actor = actorId;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('actor', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(
    new ApiResponse(200, {
      items: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Audit logs retrieved successfully')
  );
});

module.exports = { getAuditLogs };
