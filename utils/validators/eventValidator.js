const { check } = require('express-validator');

exports.validateNewEvent = [
  check('title')
      .exists()
      .withMessage('Title is required')
      .notEmpty()
      .withMessage('Title is required'),
  check('description')
      .exists()
      .withMessage('Description is required')
      .notEmpty()
      .withMessage('Description is required'),
  check('featured_img')
      .exists()
      .withMessage('Featured image is required')
      .notEmpty()
      .withMessage('Featured image is required')
];
