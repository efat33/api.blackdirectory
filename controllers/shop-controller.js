const lodash = require('lodash');
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

  // get single product details
  getRelatedProducts = async (req, res, next) => {
    if (!req.params.slug || req.params.slug == '') {
      throw new AppError(403, "403_unknownError");
    }

    const result = await shopModel.getRelatedProducts(req.params.slug);

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

    const reviews = await shopModel.getProductReviews(req.params.product_id);

    const alreadyReviewed = reviews.some((review) => review.user_id === req.currentUser.id);

    if (alreadyReviewed) {
      throw new AppError(403, "You have already reviewed this product");
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

    items.forEach(item => {
      if (item.product_discounted_price) {
        const now = new Date();

        if (new Date(item.product_discount_start) < now && now < new Date(item.product_discount_end)) {
          item.product_price = item.product_discounted_price;
        }
      }

      delete item.product_discounted_price;
      delete item.product_discount_start;
      delete item.product_discount_end;
    });

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
    const item = await shopModel.findOne({ id: req.params.item_id }, shopModel.tableNameCartItems);

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

  getOrders = async (req, res, next) => {
    const orders = await shopModel.getOrders({ user_id: req.currentUser.id, parent_id: -1 });

    new AppSuccess(res, 200, "200_successful", null, orders);
  };

  getVendorOrders = async (req, res, next) => {
    const orders = await shopModel.getOrders({ vendor_id: req.currentUser.id });

    new AppSuccess(res, 200, "200_successful", null, orders);
  };

  getOrder = async (req, res, next) => {
    if (!req.params.order_id) {
      throw new AppError(403, "403_unknownError");
    }

    const order = await shopModel.getOrder({ 'Orders.id': req.params.order_id, "Orders.user_id": req.currentUser.id });

    if (Object.keys(order).length === 0) {
      throw new AppError(403, "Order not found")
    };

    const subOrders = await shopModel.getOrders({ parent_id: order[0].id });

    if (subOrders.length) {
      order[0].subOrders = subOrders;

      const items = [];
      for (const subOrder of subOrders) {
        const subOrderItems = await shopModel.getOrderItems(subOrder.id);
        items.push(...subOrderItems);
      }

      order[0].items = items;
    }

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_order' }, order);
  };

  newOrder = async (req, res, next) => {
    let promo;
    if (req.body.promo_id) {
      promo = await shopModel.getPromo({ 'Promo.id': req.body.promo_id });

      if (!promo.length) {
        throw new AppError(403, "Invalid promo code")
      }
    }

    let items = req.body.items;

    const productIds = items.map(item => item.product_id);

    const products = await shopModel.getProducts({ params: { ids: productIds } });

    items.forEach((item) => {
      const product = products.find((product) => product.id === item.product_id);
      item.user_id = product.user_id;
    });

    const groups = Object.values(lodash.groupBy(items, (product) => product.user_id));

    let body = [];

    if (groups.length > 1) {
      // make sub orders
      let vendor_id;
      const subOrders = [];

      for (const items of groups) {
        vendor_id = items[0].user_id;

        const subtotal = items.reduce((acc, item) => {
          return acc + (item.price * item.quantity);
        }, 0);

        let total = subtotal;
        if (promo) {
          total = total * (1 - promo[0].discount / 100);
        }

        subOrders.push({
          items,
          subtotal,
          total,
          vendor_id,
          shipping: req.body.shipping,
          promo_id: req.body.promo_id,
          additional_info: req.body.additional_info
        });
      }

      const subOrderSubtotal = subOrders.reduce((acc, item) => {
        return acc + item.subtotal;
      }, 0);
      
      const subOrderTotal = subOrders.reduce((acc, item) => {
        return acc + item.total;
      }, 0);

      const order = {
        items: [],
        subtotal: subOrderSubtotal,
        total: subOrderTotal,
        shipping: req.body.shipping,
        promo_id: req.body.promo_id,
        additional_info: req.body.additional_info
      };

      body = [order, ...subOrders];
    } else {
      items = groups[0];
      const subtotal = items.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
      }, 0);

      let total = subtotal;
      if (promo) {
        total = total * (1 - promo[0].discount / 100);
      }

      body = [{
        items,
        subtotal,
        total,
        vendor_id: items[0].user_id,
        shipping: req.body.shipping,
        promo_id: req.body.promo_id,
        additional_info: req.body.additional_info
      }];
    }

    const order = await shopModel.createOrder(body, req.currentUser);

    if (order.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_order' }, order);
  }

  updateOrderStatus = async (req, res, next) => {
    if (!req.body.status) {
      throw new AppError(403, `status is required.`);
    }

    const order = await shopModel.getOrder({ 'Orders.id': req.params.order_id, "Orders.vendor_id": req.currentUser.id });

    if (Object.keys(order).length === 0) {
      throw new AppError(403, "Order not found")
    };

    const result = await shopModel.updateOrderStatus(req.params.order_id, req.body.status);

    if (result.affectedRows == 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_order' });
  }

  getPromo = async (req, res, next) => {
    if (!req.params.promo_code) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await shopModel.getPromo({ 'Promo.code': req.params.promo_code });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Promo code not found")
    };

    new AppSuccess(res, 200, "200_successful", null, result);
  };

  getCountries = async (req, res, next) => {
    const countries = await shopModel.getCountries();

    new AppSuccess(res, 200, "200_successful", null, countries);
  };

  newWithdrawRequest = async (req, res, next) => {
    const sold_items = await shopModel.getSoldItems(req.currentUser);

    const total_earned = sold_items
      .filter((item) => item.order_status === 'Approved')
      .reduce((acc, item) => {
        return acc + parseFloat(item.earned);
      }, 0);

    const withdraw_requests = await shopModel.getWithdrawRequests(req.currentUser);

    const total_requested_ammount = withdraw_requests
      .filter((request) => request.status !== 'Cancelled')
      .reduce((acc, request) => {
        return acc + parseFloat(request.amount);
      }, 0);

    const current_balance = total_earned - total_requested_ammount;

    if (current_balance < req.body.amount) {
      throw new AppError(403, "Not enough balance")
    }

    const withdraw_request = await shopModel.createWithdrawRequest(req.body, req.currentUser);

    if (withdraw_request.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_successful", null);
  }

  getWithdrawRequests = async (req, res, next) => {
    const sold_items = await shopModel.getSoldItems(req.currentUser);

    const total_earned = sold_items
      .filter((item) => item.order_status === 'Approved')
      .reduce((acc, item) => {
        return acc + parseFloat(item.earned);
      }, 0);

    const withdraw_requests = await shopModel.getWithdrawRequests(req.currentUser);

    const total_requested_ammount = withdraw_requests
      .filter((request) => request.status !== 'Cancelled')
      .reduce((acc, request) => {
        return acc + parseFloat(request.amount);
      }, 0);

    const output = {
      withdraw_requests,
      total_earned: parseFloat(total_earned.toFixed(2)),
      current_balance: parseFloat((total_earned - total_requested_ammount).toFixed(2))
    };

    new AppSuccess(res, 200, "200_successful", null, output);
  };
}

module.exports = new ShopController();