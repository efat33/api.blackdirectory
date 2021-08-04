const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');

// router.get('/', auth(), userController.getAllUsers);
// router.get('/:id', auth(), awaitHandlerFactory(userController.getUserById));

router.get('/get-listings/:limit/:offset/:orderby/:all?', apiKey(), awaitHandlerFactory(listingController.getListings));
router.post('/search-listing', apiKey(), awaitHandlerFactory(listingController.searchListing));
router.post('/add-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.newListing));
router.post('/update-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.updateListing));
router.post('/publish-listing', apiKey(), authVerified(), awaitHandlerFactory(listingController.publishListing));
router.post('/new-review', apiKey(), authVerified(), awaitHandlerFactory(listingController.newReview));
router.post('/edit-review', apiKey(), authVerified(), awaitHandlerFactory(listingController.editReview));
router.delete('/delete-review/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteReview));
router.get('/get-reviews/:id', apiKey(), awaitHandlerFactory(listingController.getReviews));
router.post('/update-review-like', apiKey(), awaitHandlerFactory(listingController.updateReviewLike));
router.post('/submit-comment', apiKey(), authVerified(), awaitHandlerFactory(listingController.addOrEditComment));
router.delete('/delete-comment/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteComment));

router.get('/get-categories', apiKey(), awaitHandlerFactory(listingController.getListingCategories));
router.post('/add-category', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.newListingCategory));
router.put('/update-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.updateListingCategory));
router.delete('/delete-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.deleteListingCategory));

// moved to bottom, otherwise other urls matches this path
router.get('/:slug', apiKey(), awaitHandlerFactory(listingController.getListing));

module.exports = router;