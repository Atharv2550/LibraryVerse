const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  loanDurationDays: {
    type: Number,
    default: 14,
    min: 1,
    max: 90
  },
  maxBorrowLimit: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  renewalLimit: {
    type: Number,
    default: 2,
    min: 0,
    max: 10
  },
  dailyFineRate: {
    type: Number,
    default: 1.0,
    min: 0
  },
  reservationPickupHours: {
    type: Number,
    default: 48,
    min: 1
  },
  announcements: [{
    title: { type: String, required: true },
    message: { type: String, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

policySchema.statics.getEffectivePolicy = async function () {
  let policy = await this.findOne();
  if (!policy) {
    policy = await this.create({
      loanDurationDays: 14,
      maxBorrowLimit: 5,
      renewalLimit: 2,
      dailyFineRate: 1.0,
      reservationPickupHours: 48,
      announcements: [
        {
          title: 'Welcome to the Library Management System',
          message: 'Explore our catalog, reserve physical copies, and track your loans online.',
          active: true
        }
      ]
    });
  }
  return policy;
};

module.exports = mongoose.model('Policy', policySchema);
