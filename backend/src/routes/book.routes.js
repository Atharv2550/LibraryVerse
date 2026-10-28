const express = require('express');
const router = express.Router();
const {
  getBooks,
  getFeaturedBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/book.controller');
const { bookValidation } = require('../validators/book.validator');
const validate = require('../middlewares/validate.middleware');
const { protect, librarian } = require('../middlewares/auth.middleware');

router.get('/', getBooks);
router.get('/featured', getFeaturedBooks);
router.get('/:id', getBookById);
router.post('/', protect, bookValidation, validate, createBook);
router.put('/:id', protect, librarian, updateBook);
router.delete('/:id', protect, librarian, deleteBook);

module.exports = router;

