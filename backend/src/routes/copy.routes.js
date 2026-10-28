const express = require('express');
const router = express.Router();
const {
  getAllCopies,
  getCopiesByBook,
  lookupCopy,
  createCopy,
  bulkCreateCopies,
  updateCopy,
  deleteCopy
} = require('../controllers/copy.controller');
const { protect, optionalAuth, librarian } = require('../middlewares/auth.middleware');

// Public/Member copy availability listing for a book
router.get('/book/:bookId', optionalAuth, getCopiesByBook);

// Librarian & Admin circulation lookup by barcode or accession
router.get('/lookup/:code', protect, librarian, lookupCopy);

// Librarian & Admin copy management
router.get('/', protect, librarian, getAllCopies);
router.post('/', protect, librarian, createCopy);
router.post('/bulk', protect, librarian, bulkCreateCopies);
router.put('/:id', protect, librarian, updateCopy);
router.delete('/:id', protect, librarian, deleteCopy);

module.exports = router;
