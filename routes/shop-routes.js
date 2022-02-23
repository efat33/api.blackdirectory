const express = require('express');
const router = express.Router();
const ShopController = require('../controllers/shop-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/validators/shopValidator');
const { isAdmin } = require('../utils/common');
const shopController = require('../controllers/shop-controller');


// router.post('/products/:limit?/:offset?/:orderby?/:all?', apiKey(), awaitHandlerFactory(listingController.searchListing));
router.post('/product/new', apiKey(), authVerified(), validation.validateNewProduct, awaitHandlerFactory(ShopController.newProduct));
router.post('/product/edit', apiKey(), authVerified(), validation.validateNewProduct, awaitHandlerFactory(ShopController.editProduct));
router.get('/product/:slug', apiKey(), awaitHandlerFactory(ShopController.getProduct));
router.get('/product/:slug/related-products', apiKey(), awaitHandlerFactory(ShopController.getRelatedProducts));
router.get('/product-categories', apiKey(), awaitHandlerFactory(ShopController.getProductCategories));
router.get('/product-tags', apiKey(), awaitHandlerFactory(ShopController.getProductTags));
router.post('/products', apiKey(), currentUser(), awaitHandlerFactory(ShopController.getProducts));
router.delete('/delete-product/:product_id', apiKey(), authVerified(), awaitHandlerFactory(shopController.deleteProduct));

router.get('/product/:product_id/reviews', apiKey(), awaitHandlerFactory(ShopController.getProductReviews));
router.post('/product/:product_id/review', apiKey(), authVerified(), awaitHandlerFactory(ShopController.createProductReview));

router.get('/details/:user_id', apiKey(), awaitHandlerFactory(ShopController.getShopDetails));
router.post('/details', apiKey(), authVerified(), awaitHandlerFactory(ShopController.updateShopDetails));

router.get('/payment', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getShopPayment));
router.post('/payment', apiKey(), authVerified(), awaitHandlerFactory(ShopController.updateShopPayment));

router.get('/cart', apiKey(), auth(), awaitHandlerFactory(ShopController.getCartItems));
router.post('/cart', apiKey(), auth(), awaitHandlerFactory(ShopController.updateCartItems));
router.delete('/cart/:item_id', apiKey(), auth(), awaitHandlerFactory(ShopController.deleteCartItem));
router.delete('/cart-clear', apiKey(), auth(), awaitHandlerFactory(ShopController.clearCartItems));

router.get('/vendor-orders', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getVendorOrders));
router.get('/all-orders', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.getAllOrders));
router.get('/orders', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getOrders));
router.get('/order/:order_id', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getOrder));
router.put('/order/:order_id/status', apiKey(), authVerified(), awaitHandlerFactory(ShopController.updateOrderStatus));
router.post('/order', apiKey(), authVerified(), awaitHandlerFactory(ShopController.newOrder));
router.get('/promo-code/:promo_code', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getPromo));

router.get('/countries', apiKey(), awaitHandlerFactory(ShopController.getCountries));

router.get('/withdraw-requests-all', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.getWithdrawRequestsAll));
router.get('/withdraw-requests', apiKey(), authVerified(), awaitHandlerFactory(ShopController.getWithdrawRequests));
router.post('/withdraw-request', apiKey(), authVerified(), awaitHandlerFactory(ShopController.newWithdrawRequest));
router.put('/withdraw-request/complete/:request_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.completeRequest));

router.get('/wishlist', apiKey(), auth(), awaitHandlerFactory(ShopController.getWishlistProducts));
router.post('/wishlist/:product_id', apiKey(), auth(), awaitHandlerFactory(ShopController.addWishlistProduct));
router.delete('/wishlist/:product_id', apiKey(), auth(), awaitHandlerFactory(ShopController.deleteWishlistProduct));

router.get('/filter-options', apiKey(), awaitHandlerFactory(ShopController.getFilterOptions));

router.get('/shippings', apiKey(), currentUser(), awaitHandlerFactory(ShopController.getShippingMethods));
router.post('/shipping', apiKey(), authVerified(), awaitHandlerFactory(ShopController.addShippingMethod));
router.put('/shipping/:shipping_id', apiKey(), authVerified(), awaitHandlerFactory(ShopController.editShippingMethod));
router.delete('/shipping/:shipping_id', apiKey(), authVerified(), awaitHandlerFactory(ShopController.deleteShippingMethod));

router.post('/category', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.addCategory));
router.put('/category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.editCategory));
router.delete('/category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.deleteCategory));

router.get('/category-options', apiKey(), awaitHandlerFactory(ShopController.getCategoryOptions));
router.post('/category-option', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.addCategoryOption));
router.put('/category-option/:option_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.editCategoryOption));
router.delete('/category-option/:option_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.deleteCategoryOption));

router.post('/option-choice', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.addOptionChoice));
router.put('/option-choice/:choice_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.editOptionChoice));
router.delete('/option-choice/:choice_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.deleteOptionChoice));

router.put('/assign-category-options', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(ShopController.assignCategoryOptions));

router.post('/create-checkout-session', apiKey(), auth(), awaitHandlerFactory(ShopController.createStripeCheckoutSession));

module.exports = router;
