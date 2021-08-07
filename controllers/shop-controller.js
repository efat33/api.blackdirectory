const ShopModel = require("../models/shop-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const shopModel = require("../models/shop-model");
const userModel = require("../models/user-model");
dotenv.config();

class ShopController {

  checkValidation = (req) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new AppError(400, "400_paramMissingGeneral", null, errors);
    }
  };

  newProduct = async (req, res, next) => {
    // check primary validation set in shopValidator.js
    this.checkValidation(req);

    if (!req.body.title || req.body.title == '') {
      throw new AppError(403, "Title is required");
    }
    if (!req.body.price || req.body.price == '') {
      throw new AppError(403, "Price is required");
    }
    if (req.body.discounted_price != '' && (req.body.discount_start == '' || req.body.discount_end == '')) {
      throw new AppError(403, "Discount schedule is required");
    }
    if (!req.body.category_id || req.body.category_id == '') {
      throw new AppError(403, "Category is required");
    }
    if (!req.body.description || req.body.description == '') {
      throw new AppError(403, "Description is required");
    }
    if (!req.body.stock_status || req.body.stock_status == '') {
      throw new AppError(403, "Stock status is required");
    }
    if (req.body.is_downloadable) {
      if (!req.body.download_files) {
        throw new AppError(403, "Download file is required");
      }
      if (!req.body.download_files.files || req.body.download_files.files.length < 1) {
        throw new AppError(403, "Please provide product download file");
      }
    }

    const result = await shopModel.newProduct(req.body, req.currentUser);

    if (result) {
      new AppSuccess(res, 200, "200_added_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  }

  editProduct = async (req, res, next) => {
    // check primary validation set in shopValidator.js
    this.checkValidation(req);

    if (!req.body.id || req.body.id == '') {
      throw new AppError(403, "ID is required");
    }

    // check if product belongs to the loggedin user
    const product = await shopModel.findOne({ 'id': req.body.id });

    if (Object.keys(product).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (product.user_id != req.currentUser.id) {
      throw new AppError(401, "401_unauthorised");
    }

    // do other validation
    if (!req.body.title || req.body.title == '') {
      throw new AppError(403, "Title is required");
    }
    if (!req.body.price || req.body.price == '') {
      throw new AppError(403, "Price is required");
    }
    if (req.body.discounted_price != '' && (req.body.discount_start == '' || req.body.discount_end == '')) {
      throw new AppError(403, "Discount schedule is required");
    }
    if (!req.body.category_id || req.body.category_id == '') {
      throw new AppError(403, "Category is required");
    }
    if (!req.body.description || req.body.description == '') {
      throw new AppError(403, "Description is required");
    }
    if (!req.body.stock_status || req.body.stock_status == '') {
      throw new AppError(403, "Stock status is required");
    }
    if (req.body.is_downloadable) {
      if (!req.body.download_files) {
        throw new AppError(403, "Download file is required");
      }
      if (!req.body.download_files.files || req.body.download_files.files.length < 1) {
        throw new AppError(403, "Please provide product download file");
      }
    }

    // call model funciton
    const result = await shopModel.editProduct(req.body, req.currentUser);

    if (result) {
      new AppSuccess(res, 200, "200_updated_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  }

  // get single product details
  getProduct = async (req, res, next) => {

    if (!req.params.slug || req.params.slug == '') {
      throw new AppError(403, "403_unknownError");
    }

    const result = await shopModel.getProduct(req.params.slug);

    if (Object.keys(result).length === 0) throw new AppError(403, "403_unknownError");

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_product' }, result);


  };

  // get all products and product filter
  getProducts = async (req, res, next) => {

    const result = await shopModel.getProducts(req.body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_product' }, result);


  };

  // get product categories
  getProductCategories = async (req, res, next) => {

    const result = await shopModel.find({}, DBTables.product_categories);

    new AppSuccess(res, 200, "200_successful", '', result);

  };

  // get product tags
  getProductTags = async (req, res, next) => {

    const result = await shopModel.find({}, DBTables.product_tags);

    new AppSuccess(res, 200, "200_successful", '', result);

  };

  getProductReviews = async (req, res, next) => {
    const product = await shopModel.findOne({ id: req.params.product_id });

    if (Object.keys(product).length === 0) { 
      throw new AppError(403, "Product not found"); 
    }

    const reviews = await shopModel.getProductReviews(req.params.product_id);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_reviews' }, reviews);
  };

  createProductReview = async (req, res, next) => {
    const product = await shopModel.findOne({ id: req.params.product_id });

    if (Object.keys(product).length === 0) { 
      throw new AppError(403, "Product not found"); 
    }

    if (!req.body.rating || req.body.rating == '') {
      throw new AppError(403, "Rating is required");
    }

    if (!req.body.review || req.body.review == '') {
      throw new AppError(403, "Review is required");
    }

    const review = await shopModel.createProductReview(req.params.product_id, req.body, req.currentUser);

    if (review.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_userReview' });
  }

  getShopDetails = async (req, res, next) => {
    const details = await shopModel.getShopDetails(req.params.user_id);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_details' }, details);
  };

  updateShopDetails = async (req, res, next) => {
    const requiredFields = ['store_name'];

    for (let field of requiredFields) {
      if (req.body[field] == null) {
        throw new AppError(403, `${field} is required.`); 
      }
    }

    const result = await shopModel.updateShopDetails(req.body, req.currentUser);

    if (result.affectedRows == 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_details' });
  }

  getCartItems = async (req, res, next) => {
    const items = await shopModel.getCartItems(req.currentUser.id);

    new AppSuccess(res, 200, "200_successful", null, items);
  };

  updateCartItems = async (req, res, next) => {
    if (!req.body.items) {
      throw new AppError(403, "'items' is required");
    }

    await shopModel.updateCartItems(req.body.items, req.currentUser);

    return this.getCartItems(req, res, next);
  }

  deleteCartItem = async (req, res, next) => {
    const item = await shopModel.findOne({id: req.params.item_id}, shopModel.tableNameCartItems);

    if (Object.keys(item).length === 0) {
      throw new AppError(403, "Item not found");
    }

    await shopModel.deleteCartItem(req.params.item_id);

    new AppSuccess(res, 200, "200_successful");
  };

  clearCartItems = async (req, res, next) => {
    await shopModel.clearCartItems(req.currentUser.id);

    new AppSuccess(res, 200, "200_successful");
  };
}

module.exports = new ShopController();