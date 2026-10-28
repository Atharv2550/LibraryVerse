const { body, param } = require('express-validator');

const bookValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('author')
    .trim()
    .notEmpty().withMessage('Author is required')
    .isLength({ max: 120 }).withMessage('Author name cannot exceed 120 characters'),
  body('genre')
    .trim()
    .notEmpty().withMessage('Genre is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 4000 }).withMessage('Description cannot exceed 4000 characters'),
  body('pageCount')
    .notEmpty().withMessage('Page count is required')
    .isInt({ min: 1 }).withMessage('Page count must be a positive integer greater than 0'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 2 })
    .withMessage('Published year must be a valid year'),
  body('isbn')
    .optional()
    .trim()
];

module.exports = { bookValidation };
