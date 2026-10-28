const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');
const User = require('../models/User.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { getDBStatus } = require('../config/db');
const { initialBooks, initialUsers } = require('../utils/seedData');
const { syncBookCopyCounts } = require('../services/copy.service');
const { logAudit } = require('../services/audit.service');

// Ensure database has initial books and physical copies if empty
const ensureBooksSeeded = async () => {
  const count = await Book.countDocuments();
  if (count === 0) {
    const inserted = await Book.insertMany(initialBooks);
    // Seed 3 physical copies for each initial book
    for (const b of inserted) {
      const copies = [];
      for (let i = 1; i <= 3; i++) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        copies.push({
          book: b._id,
          copyNumber: i,
          accessionNumber: `ACC-${b.title.slice(0, 3).toUpperCase()}-${i}${rand}`,
          barcode: `BC${b.isbn ? b.isbn.slice(-4) : '99'}${i}${rand}`,
          shelfLocation: b.shelfLocation || 'Main Stacks A-1',
          condition: 'good',
          price: 24.99,
          status: 'available'
        });
      }
      await BookCopy.insertMany(copies);
      await syncBookCopyCounts(b._id);
    }
  }

  // Seed default library users (admin, librarian, student member) if empty
  const userCount = await User.countDocuments();
  if (userCount === 0 && initialUsers && initialUsers.length > 0) {
    for (const u of initialUsers) {
      await User.create(u);
    }
  }
};

const getBooks = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  await ensureBooksSeeded();

  const { genre, category, search, sort = 'rating', page = 1, limit = 12 } = req.query;

  const query = {};
  const filterCat = category || genre;
  if (filterCat && filterCat !== 'All') {
    query.$or = [
      { genre: { $regex: new RegExp(`^${filterCat}$`, 'i') } },
      { category: { $regex: new RegExp(`^${filterCat}$`, 'i') } }
    ];
  }

  if (search && search.trim()) {
    const q = search.trim();
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } },
      { isbn: { $regex: q, $options: 'i' } },
      { publisher: { $regex: q, $options: 'i' } },
      { genre: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } }
    ];
  }

  // Sorting strategies
  let sortOption = { rating: -1 };
  if (sort === 'newest') sortOption = { publishedYear: -1, createdAt: -1 };
  if (sort === 'reviews') sortOption = { numReviews: -1 };
  if (sort === 'title') sortOption = { title: 1 };
  if (sort === 'pages') sortOption = { pageCount: -1 };
  if (sort === 'available') sortOption = { availableCopies: -1 };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [total, books] = await Promise.all([
    Book.countDocuments(query),
    Book.find(query).sort(sortOption).skip(skip).limit(limitNum)
  ]);

  return res.json(
    new ApiResponse(200, {
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    }, 'Books retrieved successfully')
  );
});

const getFeaturedBooks = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  await ensureBooksSeeded();

  const featured = await Book.find().sort({ rating: -1, numReviews: -1 }).limit(6);
  return res.json(new ApiResponse(200, featured, 'Featured books retrieved successfully'));
});

const getBookById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const book = await Book.findById(id).populate('addedBy', 'name avatar');
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  return res.json(new ApiResponse(200, book, 'Book retrieved successfully'));
});

const createBook = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const {
    title,
    author,
    genre,
    category,
    description,
    pageCount,
    publishedYear,
    isbn,
    publisher,
    edition,
    shelfLocation,
    coverImage,
    initialCopies = 1
  } = req.body;

  if (!title || !author || (!genre && !category) || !description || !pageCount) {
    throw new ApiError(400, 'Title, author, category, description, and page count are required');
  }

  // Check duplicate ISBN if provided
  if (isbn && isbn.trim()) {
    const existingIsbn = await Book.findOne({ isbn: isbn.trim() });
    if (existingIsbn) {
      throw new ApiError(409, `A book with ISBN ${isbn.trim()} already exists: "${existingIsbn.title}". Consider adding physical copies instead.`);
    }
  }

  const newBook = await Book.create({
    title: title.trim(),
    author: author.trim(),
    genre: (category || genre).trim(),
    category: (category || genre).trim(),
    description: description.trim(),
    pageCount: Number(pageCount),
    publishedYear: Number(publishedYear) || new Date().getFullYear(),
    isbn: isbn ? isbn.trim() : undefined,
    publisher: publisher ? publisher.trim() : 'General',
    edition: edition ? edition.trim() : '1st Edition',
    shelfLocation: shelfLocation ? shelfLocation.trim() : 'Main Stacks',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
    addedBy: req.user?._id
  });

  // Automatically create initial physical copies
  const numCopies = Math.max(1, Math.min(20, Number(initialCopies) || 1));
  const copies = [];
  for (let i = 1; i <= numCopies; i++) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const accessionNumber = `ACC-${Date.now().toString().slice(-6)}-${i}${rand}`;
    const barcode = `BC${Date.now().toString().slice(-6)}${i}${rand}`;
    copies.push({
      book: newBook._id,
      copyNumber: i,
      accessionNumber,
      barcode,
      shelfLocation: newBook.shelfLocation,
      condition: 'new',
      status: 'available',
      price: 24.99
    });
  }
  await BookCopy.insertMany(copies);
  await syncBookCopyCounts(newBook._id);

  const updatedBook = await Book.findById(newBook._id);

  await logAudit({
    actor: req.user,
    action: 'BOOK_CREATE',
    entityType: 'Book',
    entityId: newBook._id,
    details: { title: newBook.title, author: newBook.author, isbn: newBook.isbn, copies: numCopies },
    ipAddress: req.ip
  });

  return res.status(201).json(
    new ApiResponse(201, updatedBook, 'Book created with physical copies successfully')
  );
});

const updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    author,
    genre,
    category,
    description,
    pageCount,
    publishedYear,
    isbn,
    publisher,
    edition,
    shelfLocation,
    coverImage
  } = req.body;

  const book = await Book.findById(id);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  if (isbn && isbn.trim() !== book.isbn) {
    const duplicate = await Book.findOne({ isbn: isbn.trim(), _id: { $ne: id } });
    if (duplicate) {
      throw new ApiError(409, `Another book already has ISBN ${isbn.trim()}`);
    }
    book.isbn = isbn.trim();
  }

  if (title !== undefined) book.title = title.trim();
  if (author !== undefined) book.author = author.trim();
  if (genre !== undefined || category !== undefined) {
    book.genre = (category || genre).trim();
    book.category = (category || genre).trim();
  }
  if (description !== undefined) book.description = description.trim();
  if (pageCount !== undefined) book.pageCount = Number(pageCount);
  if (publishedYear !== undefined) book.publishedYear = Number(publishedYear);
  if (publisher !== undefined) book.publisher = publisher.trim();
  if (edition !== undefined) book.edition = edition.trim();
  if (shelfLocation !== undefined) book.shelfLocation = shelfLocation.trim();
  if (coverImage !== undefined) book.coverImage = coverImage.trim();

  await book.save();

  await logAudit({
    actor: req.user,
    action: 'BOOK_UPDATE',
    entityType: 'Book',
    entityId: book._id,
    details: { title: book.title, author: book.author },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, book, 'Book updated successfully')
  );
});

const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const book = await Book.findById(id);
  if (!book) {
    throw new ApiError(404, 'Book not found');
  }

  // Prevent deleting if physical copies are currently issued
  const activeIssued = await BookCopy.findOne({ book: id, status: 'issued' });
  if (activeIssued) {
    throw new ApiError(400, 'Cannot delete book: physical copies are currently checked out on active loans.');
  }

  await BookCopy.deleteMany({ book: id });
  await Book.findByIdAndDelete(id);

  await logAudit({
    actor: req.user,
    action: 'BOOK_DELETE',
    entityType: 'Book',
    entityId: id,
    details: { title: book.title, author: book.author },
    ipAddress: req.ip
  });

  return res.json(
    new ApiResponse(200, null, 'Book and associated copies deleted successfully')
  );
});

module.exports = {
  getBooks,
  getFeaturedBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};

