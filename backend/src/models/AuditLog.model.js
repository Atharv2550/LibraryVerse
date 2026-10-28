const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actorName: {
    type: String,
    required: true
  },
  actorRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    index: true
  },
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['Book', 'BookCopy', 'Loan', 'Reservation', 'Fine', 'User', 'System', 'Policy'],
    index: true
  },
  entityId: {
    type: String,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
