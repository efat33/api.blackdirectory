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
router.get('/product/:slug/related-products', apiKey(), awaitHandlerFactory(ShopController.getRelatedProducts));
router.get('/product-categories', apiKey(), awaitHandlerFactory(ShopController.getProductCategories));
router.get('/product-tags', apiKey(), awaitHandlerFactory(ShopController.getProductTags));
router.post('/products', apiKey(), awaitHandlerFactory(ShopController.getProducts));

router.get('/product/:product_id/reviews', apiKey(), awaitHandlerFactory(ShopController.getProductReviews));
router.post('/product/:product_id/review', apiKey(), authVerified(), awaitHandlerFactory(ShopController.createProductReview));

router.get('/details/:user_id', apiKey(), awaitHandlerFactory(ShopController.getShopDetails));
router.post('/details', apiKey(), authVerified(), awaitHandlerFactory(ShopController.updateShopDetails));

router.get('/cart', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getCartItems));
router.post('/cart', apiKey(), authVerified(), awaitHandlerFactory(ShopController.updateCartItems));
router.delete('/cart/:item_id', apiKey(), authVerified(), awaitHandlerFactory(ShopController.deleteCartItem));
router.delete('/cart-clear', apiKey(), authVerified(), awaitHandlerFactory(ShopController.clearCartItems));

router.get('/orders', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getOrders));
router.get('/order/:order_id', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getOrder));
router.post('/order', apiKey(), authVerified(), awaitHandlerFactory(ShopController.newOrder));
router.get('/promo-code/:promo_code', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getPromo));

router.get('/countries', apiKey(), awaitHandlerFactory(ShopController.getCountries));

module.exports = router;