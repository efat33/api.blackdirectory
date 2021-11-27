const { check } = require('express-validator');

exports.validateNewListing = [
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
  check('address')
      .exists()
      .withMessage('Address is required')
      .notEmpty()
      .withMessage('Address is required'),
  check('lat')
      .exists()
      .withMessage('Latitude is required')
      .notEmpty()
      .withMessage('Latitude is required'),
  check('lng')
      .exists()
      .withMessage('Longitude is required')
      .notEmpty()
      .withMessage('Longitude is required'),
  check('categories')
      .exists()
      .withMessage('Category is required')
      .notEmpty()
      .withMessage('Category is required')
];
