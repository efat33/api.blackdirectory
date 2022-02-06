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

const stripeSecretKey = process.env.NODE_ENV === 'development' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

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
    if (!req.body.categories || req.body.categories.length == 0) {
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

    if (req.currentUser.role !== 'admin' && product.user_id != req.currentUser.id) {
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
    if (!req.body.categories || req.body.categories == '') {
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

    if (req.currentUser && req.currentUser.role === 'admin' && req.body.params && req.body.params.user_id) {
      delete req.body.params.user_id;
    }

    const result = await shopModel.getProducts(req.body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_product' }, result);


  };

  deleteProduct = async (req, res, next) => {
    const product = await shopModel.findOne({ id: req.params.product_id });

    if (Object.keys(product).length === 0) {
      throw new AppError(403, "403_unknownError");
    }

    await shopModel.deleteProduct(req.params.product_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_product' });
  };

  // get product categories
  getProductCategories = async (req, res, next) => {
    const categories_result = await shopModel.find({}, DBTables.product_categories, 'ORDER BY parent_id');
    const options_result = await shopModel.getProductOptions();
    const category_options_result = await shopModel.getProductCategoryOptions();

    let options = options_result.reduce((acc, option) => {
      if (!acc[option.option_id]) {
        acc[option.option_id] = [];
      }

      acc[option.option_id].push(option);

      return acc;
    }, {});

    for (let option_id in options) {
      options[option_id].sort((a, b) => a.choice_order - b.choice_order);
    }

    options = Object.values(options);

    const categories = categories_result
      .filter(cat => cat.parent_id == null)
      .map((cat) => {
        const cat_options = category_options_result.filter(option => option.category_id === cat.id).map(option => option.option_id);
        cat.options = options.filter(option => cat_options.includes(option[0].option_id));

        return cat;
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    for (const category of categories) {
      category.subCategories = categories_result
        .filter(cat => cat.parent_id === category.id)
        .map((cat) => {
          const cat_options = category_options_result.filter(option => option.category_id === cat.id).map(option => option.option_id);
          cat.options = options.filter(option => cat_options.includes(option[0].option_id));

          return cat;
        })
        .sort((a, b) => a.title.localeCompare(b.title));

      for (const subCategory of category.subCategories) {
        subCategory.subCategories = categories_result
          .filter(cat => cat.parent_id === subCategory.id)
          .map((cat) => {
            const cat_options = category_options_result.filter(option => option.category_id === cat.id).map(option => option.option_id);
            cat.options = options.filter(option => cat_options.includes(option[0].option_id));

            return cat;
          })
          .sort((a, b) => a.title.localeCompare(b.title));
      }
    }

    new AppSuccess(res, 200, "200_successful", '', categories);
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

        if (item.product_discount_start && item.product_discount_end) {
          if (new Date(item.product_discount_start) < now && now < new Date(item.product_discount_end)) {
            item.product_price = item.product_discounted_price;
          }
        } else {
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

  getAllOrders = async (req, res, next) => {
    const orders = await shopModel.getOrders();

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

    const body = { 'Orders.id': req.params.order_id };

    if (req.currentUser.role !== 'admin') {
      body['Orders.user_id'] = req.currentUser.id;
      body['Orders.vendor_id'] = req.currentUser.id;
    }

    const order = await shopModel.getOrder(body);

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

  processNewOrderData = async (orderBody) => {
    let promo;
    if (orderBody.promo_id) {
      promo = await shopModel.getPromo({ 'Promo.id': orderBody.promo_id });

      if (!promo.length) {
        throw new AppError(403, "Invalid promo code")
      }
    }

    let shipping_methods = [];
    if (orderBody.shipping_methods && orderBody.shipping_methods.length) {
      const shipping_ids = orderBody.shipping_methods.map(method => method.shipping_id);

      shipping_methods = await shopModel.getShippingMethodsById(shipping_ids);
    }

    let items = orderBody.items;

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

        let shipping_method = {};
        if (shipping_methods.length) {
          shipping_method = shipping_methods.find(shipping => shipping.vendor_id === vendor_id) || {};

          if (shipping_method.fee) {
            total += parseFloat(shipping_method.fee);
          }
        }

        subOrders.push({
          items,
          subtotal,
          total,
          vendor_id,
          shipping: orderBody.shipping,
          shipping_method: shipping_method.id,
          promo_id: orderBody.promo_id,
          additional_info: orderBody.additional_info
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
        shipping: orderBody.shipping,
        shipping_method: null,
        promo_id: orderBody.promo_id,
        additional_info: orderBody.additional_info
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

      let shipping_method = {};
      if (shipping_methods.length) {
        shipping_method = shipping_methods.find(shipping => shipping.vendor_id === items[0].user_id) || {};

        if (shipping_method.fee) {
          total += parseFloat(shipping_method.fee);
        }
      }

      body = [{
        items,
        subtotal,
        total,
        vendor_id: items[0].user_id,
        shipping: orderBody.shipping,
        shipping_method: shipping_method.id,
        promo_id: orderBody.promo_id,
        additional_info: orderBody.additional_info
      }];
    }

    return body;
  }

  newOrder = async (req, res, next) => {
    const body = await this.processNewOrderData(req.body);
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

  getWithdrawRequestsAll = async (req, res, next) => {
    const withdraw_requests = await shopModel.getWithdrawRequests(req.currentUser);
    
    new AppSuccess(res, 200, "200_successful", null, withdraw_requests);
  };

  getWishlistProducts = async (req, res, next) => {
    const result = await shopModel.getWishlistProducts(req.currentUser);

    new AppSuccess(res, 200, "200_successful", null, result);
  };

  addWishlistProduct = async (req, res, next) => {
    if (!req.params.product_id) {
      throw new AppError(403, "Product ID is required");
    }

    await shopModel.addWishlistProduct(req.params.product_id, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  }

  deleteWishlistProduct = async (req, res, next) => {
    await shopModel.deleteWishlistProduct(req.params.product_id, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  };

  getFilterOptions = async (req, res, next) => {
    const priceResult = await shopModel.getPriceRange();
    const brandResult = await shopModel.getBrands();

    const options = {};

    options.price = {
      max: Math.max(priceResult[0].max_price, priceResult[0].max_discounted_price),
      min: Math.min(priceResult[0].min_price, priceResult[0].min_discounted_price)
    };

    options.brands = brandResult;

    new AppSuccess(res, 200, "200_successful", null, options);
  };

  getShippingMethods = async (req, res, next) => {
    let user_id;

    if (req.query.user_id) {
      user_id = req.query.user_id;
    } else if (req.currentUser) {
      user_id = req.currentUser.id;
    } else {
      throw new AppError(403, "403_unknownError");
    }

    const shippings = await shopModel.getShippingMethods(user_id);

    new AppSuccess(res, 200, "200_successful", null, shippings);
  };

  addShippingMethod = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await shopModel.addShippingMethod(req.body, req.currentUser);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    new AppSuccess(res, 200, "200_successful", null, result);
  }

  editShippingMethod = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }
    const shipping = await shopModel.findOne({ id: req.params.shipping_id, vendor_id: req.currentUser.id }, DBTables.product_shippings);

    if (Object.keys(shipping).length == 0) {
      throw new AppError(403, "Shipping method not found");
    }

    const result = await shopModel.editShippingMethod(req.params.shipping_id, req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (result) {
      new AppSuccess(res, 200, "200_updated_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  deleteShippingMethod = async (req, res, next) => {
    const shipping = await shopModel.findOne({ id: req.params.shipping_id, vendor_id: req.currentUser.id }, DBTables.product_shippings);

    if (Object.keys(shipping).length == 0) {
      throw new AppError(403, "Shipping method not found");
    }

    await shopModel.deleteShippingMethod(req.params.shipping_id, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  };

  addCategory = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await shopModel.addCategory(req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    new AppSuccess(res, 200, "200_successful", null, result);
  }

  editCategory = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const category = await shopModel.findOne({ id: req.params.category_id }, DBTables.product_categories);

    if (Object.keys(category).length == 0) {
      throw new AppError(403, "Category not found");
    }

    const result = await shopModel.editCategory(req.params.category_id, req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (result) {
      new AppSuccess(res, 200, "200_updated_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  deleteCategory = async (req, res, next) => {
    const category = await shopModel.findOne({ id: req.params.category_id }, DBTables.product_categories);

    if (Object.keys(category).length == 0) {
      throw new AppError(403, "Category not found");
    }

    await shopModel.deleteCategory(req.params.category_id);

    new AppSuccess(res, 200, "200_successful");
  };

  getCategoryOptions = async (req, res, next) => {
    const options = await shopModel.getCategoryOptions();

    let groups = options.reduce((acc, val) => {
      if (!acc[val.id]) {
        acc[val.id] = {
          id: val.id,
          title: val.title,
          choices: []
        };
      }

      if (val.choice_id) {
        acc[val.id].choices.push({
          id: val.choice_id,
          title: val.choice,
          choice_order: val.choice_order
        });
      }

      return acc;
    }, {});

    groups = Object.values(groups).sort((a, b) => a.title.localeCompare(b.title));

    for (const group of groups) {
      group.choices.sort((a, b) => a.choice_order - b.choice_order);
    }

    new AppSuccess(res, 200, "200_successful", null, groups);
  };

  addCategoryOption = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await shopModel.addCategoryOption(req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    new AppSuccess(res, 200, "200_successful", null, result);
  }

  editCategoryOption = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const option = await shopModel.findOne({ id: req.params.option_id }, DBTables.product_options);

    if (Object.keys(option).length == 0) {
      throw new AppError(403, "Option not found");
    }

    const result = await shopModel.editCategoryOption(req.params.option_id, req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (result) {
      new AppSuccess(res, 200, "200_updated_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  deleteCategoryOption = async (req, res, next) => {
    const option = await shopModel.findOne({ id: req.params.option_id }, DBTables.product_options);

    if (Object.keys(option).length == 0) {
      throw new AppError(403, "Option not found");
    }

    await shopModel.deleteCategoryOption(req.params.option_id);

    new AppSuccess(res, 200, "200_successful");
  };

  addOptionChoice = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await shopModel.addOptionChoice(req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    new AppSuccess(res, 200, "200_successful", null, result);
  }

  editOptionChoice = async (req, res, next) => {
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const option = await shopModel.findOne({ id: req.params.choice_id }, DBTables.product_option_choices);

    if (Object.keys(option).length == 0) {
      throw new AppError(403, "Choice not found");
    }

    const result = await shopModel.editOptionChoice(req.params.choice_id, req.body);

    if (Object.keys(result).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    if (result) {
      new AppSuccess(res, 200, "200_updated_successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  deleteOptionChoice = async (req, res, next) => {
    const option = await shopModel.findOne({ id: req.params.choice_id }, DBTables.product_option_choices);

    if (Object.keys(option).length == 0) {
      throw new AppError(403, "Choice not found");
    }

    await shopModel.deleteOptionChoice(req.params.choice_id);

    new AppSuccess(res, 200, "200_successful");
  };

  assignCategoryOptions = async (req, res, next) => {
    await shopModel.assignCategoryOptions(req.body);

    new AppSuccess(res, 200, "200_updated_successfully");
  }

  createStripeCheckoutSession = async (req, res, next) => {
    if (!req.body.order) {
      throw new AppError(403, "403_unknownError")
    };

    const order = await this.processNewOrderData(req.body.order);
    const line_items = [{
      price_data: {
        currency: 'gbp',
        unit_amount: parseFloat(order[0].total) * 100,
        product_data: {
          name: 'Checkout'
        },
      },
      quantity: 1,
    }];

    const orderMeta = {
      type: 'shop',
      order1: '',
      orderParamCount: 1,
      user: JSON.stringify(req.currentUser)
    };

    const orderString = JSON.stringify(order);

    if (orderString.length > 500) {
      let count = 1;
      for (let i=0; i < orderString.length; i += 500, count++) {
        orderMeta[`order${count}`] = orderString.substr(i, 500);
      }

      orderMeta.orderParamCount = count - 1;
    } else {
      orderMeta.order1 = orderString;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${req.body.returnUrl}?success=true`,
      cancel_url: `${req.body.returnUrl}?success=false`,
      metadata: orderMeta
    });

    new AppSuccess(res, 200, "200_successful", null, session);
  };
}

module.exports = new ShopController();