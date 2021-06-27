const { check } = require('express-validator');

exports.validateLoginTypeFacebook = [
  check('email')
      .exists()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email')
      .normalizeEmail()
];  

exports.validateLogin = [
  check('email')
      .exists()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email')
      .normalizeEmail(),
  check('password')
      .exists()
      .withMessage('Password is required')
      .notEmpty()
      .withMessage('Password must be filled')
];

exports.validateRegister = [
  check('email')
      .exists()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email')
      .normalizeEmail(),
  check('username')
      .exists()
      .withMessage('Username is required')
      .notEmpty()
      .withMessage('Username must be filled'),
  check('password')
      .exists()
      .withMessage('Password is required')
      .notEmpty()
      .withMessage('Password must be filled')
      .matches('((?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,})')
      .withMessage('Password must be at least 8 characters, must contain one lowercase, one uppercase and one number')
]; 

exports.validateUsername = [
  check('username')
      .exists()
      .withMessage('Username is required')
      .notEmpty()
      .withMessage('Username must be filled')
];

exports.validateChangePassword = [
  check('old_password')
      .exists()
      .withMessage('Old password is required')
      .notEmpty()
      .withMessage('Old password must be filled'),
  check('new_password')
      .exists()
      .withMessage('New password is required')
      .notEmpty()
      .withMessage('New password must be filled'),
  check('con_new_password')
      .exists()
      .withMessage('Confirm new password is required')
      .notEmpty()
      .withMessage('Confirm new password must be filled')
];

exports.validateResetPassword = [
    check('password')
        .exists()
        .withMessage('Password is required')
        .notEmpty()
        .withMessage('Password must be filled'),
    check('con_password')
        .exists()
        .withMessage('Confirm password is required')
        .notEmpty()
        .withMessage('Confirm password must be filled')
];

