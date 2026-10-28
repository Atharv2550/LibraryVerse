const AuditLog = require('../models/AuditLog.model');

const logAudit = async ({
  actor,
  action,
  entityType,
  entityId,
  details = {},
  ipAddress = '127.0.0.1'
}) => {
  try {
    if (!actor) return null;
    return await AuditLog.create({
      actor: actor._id || actor,
      actorName: actor.name || 'System User',
      actorRole: actor.role || 'system',
      action,
      entityType,
      entityId: String(entityId || ''),
      details,
      ipAddress
    });
  } catch (error) {
    console.error('AuditLog Error:', error.message);
    return null;
  }
};

module.exports = { logAudit };
