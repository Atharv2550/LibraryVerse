const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [60, 'Name cannot exceed 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'librarian', 'member', 'user'],
    default: 'user'
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'suspended', 'expired'],
    default: 'active'
  },
  approvalDate: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  membershipId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'suspended', 'expired'],
    default: 'active'
  },
  membershipExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  maxBorrowLimit: {
    type: Number,
    min: [1, 'Borrow limit must be at least 1'],
    max: [20, 'Borrow limit cannot exceed 20'],
    default: 5
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: 'Avid reader & book enthusiast.'
  },
  favoriteGenres: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

userSchema.pre('save', async function (next) {
  if (!this.membershipId) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.membershipId = `LIB-${year}-${randomSuffix}`;
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
