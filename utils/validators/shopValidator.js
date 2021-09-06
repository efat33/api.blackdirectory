const { check } = require('express-validator');

exports.validateNewProduct = [
  check('price')
      .exists()
      .withMessage('Price is required')
      .notEmpty()
      .withMessage('Price is required'),
  check('categories')
      .exists()
      .withMessage('Category is required')
      .notEmpty()
      .withMessage('Category is required'),
  check('description')
      .exists()
      .withMessage('Description is required')
      .notEmpty()
      .withMessage('Description is required')
];
