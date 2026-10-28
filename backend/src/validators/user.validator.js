const { body } = require('express-validator');

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('favoriteGenres')
    .optional()
    .isArray().withMessage('Favorite genres must be an array of strings'),
  body('readingGoal')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Reading goal must be between 1 and 365 books'),
  body('avatar')
    .optional()
    .trim()
    .isURL().withMessage('Avatar must be a valid URL')
];

module.exports = { updateProfileValidation };
