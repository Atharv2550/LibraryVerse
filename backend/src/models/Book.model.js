const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [120, 'Author name cannot exceed 120 characters']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [4000, 'Description cannot exceed 4000 characters']
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  pageCount: {
    type: Number,
    required: [true, 'Page count is required'],
    min: [1, 'Page count must be at least 1']
  },
  publishedYear: {
    type: Number,
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear() + 2, 'Publication year cannot be in far future'],
    default: () => new Date().getFullYear()
  },
  isbn: {
    type: String,
    trim: true,
    index: true
  },
  publisher: {
    type: String,
    trim: true,
    default: 'General'
  },
  category: {
    type: String,
    trim: true,
    index: true
  },
  edition: {
    type: String,
    trim: true,
    default: '1st Edition'
  },
  shelfLocation: {
    type: String,
    trim: true,
    default: 'Main Stacks'
  },
  totalCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  issuedCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  reservedCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

bookSchema.pre('save', function (next) {
  if (!this.category && this.genre) {
    this.category = this.genre;
  }
  if (!this.genre && this.category) {
    this.genre = this.category;
  }
  next();
});

// Search & filter indexes
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1, rating: -1 });
bookSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Book', bookSchema);
