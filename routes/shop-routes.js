const express = require('express');
const router = express.Router();
const ShopController = require('../controllers/shop-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/validators/shopValidator');


// router.post('/products/:limit?/:offset?/:orderby?/:all?', apiKey(), awaitHandlerFactory(listingController.searchListing));
router.post('/product/new', apiKey(), authVerified(), validation.validateNewProduct, awaitHandlerFactory(ShopController.newProduct));
router.post('/product/edit', apiKey(), authVerified(), validation.validateNewProduct, awaitHandlerFactory(ShopController.editProduct));
router.get('/product/:slug', apiKey(), awaitHandlerFactory(ShopController.getProduct));
router.get('/product-categories', apiKey(), awaitHandlerFactory(ShopController.getProductCategories));
router.get('/product-tags', apiKey(), awaitHandlerFactory(ShopController.getProductTags));
router.post('/products', apiKey(), awaitHandlerFactory(ShopController.getProducts));

router.get('/product/:product_id/reviews', apiKey(), awaitHandlerFactory(ShopController.getProductReviews));
router.post('/product/:product_id/review', apiKey(), authVerified(), awaitHandlerFactory(ShopController.createProductReview));

module.exports = router;