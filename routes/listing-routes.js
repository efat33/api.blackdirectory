const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');

// router.get('/', auth(), userController.getAllUsers);
// router.get('/:id', auth(), awaitHandlerFactory(userController.getUserById));

router.get('/get-listings/:limit/:offset/:orderby/:all?', apiKey(), awaitHandlerFactory(listingController.getListings));
router.get('/favorites', apiKey(), currentUser(), awaitHandlerFactory(listingController.getFavorites));
router.post('/favorite-listings', apiKey(), authVerified(), awaitHandlerFactory(listingController.getFavoriteListings));
router.get('/categories', apiKey(), currentUser(), awaitHandlerFactory(listingController.getCategories));
router.get('/update-favorite/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.updateFavorite));
router.post('/search-listing', apiKey(), currentUser(), awaitHandlerFactory(listingController.searchListing));
router.post('/add-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.newListing));
router.post('/update-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.updateListing));
router.post('/publish-listing', apiKey(), authVerified(), awaitHandlerFactory(listingController.publishListing));
router.get('/update-view/:id', apiKey(), awaitHandlerFactory(listingController.updateView));
router.delete('/delete-listing/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteListing));

router.post('/new-claim', apiKey(), authVerified(), awaitHandlerFactory(listingController.newClaim));
router.post('/get-claims', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.getClaims));
router.get('/approve-claim/:id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.approveClaim));
router.get('/delete-claim/:id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.deleteClaim));

router.post('/new-review', apiKey(), authVerified(), awaitHandlerFactory(listingController.newReview));
router.post('/edit-review', apiKey(), authVerified(), awaitHandlerFactory(listingController.editReview));
router.delete('/delete-review/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteReview));
router.get('/get-reviews/:id', apiKey(), awaitHandlerFactory(listingController.getReviews));
router.post('/update-review-like', apiKey(), awaitHandlerFactory(listingController.updateReviewLike));
router.post('/submit-comment', apiKey(), authVerified(), awaitHandlerFactory(listingController.addOrEditComment));
router.delete('/delete-comment/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteComment));

router.get('/get-categories', apiKey(), awaitHandlerFactory(listingController.getListingCategories));
router.get('/trending-categories', apiKey(), awaitHandlerFactory(listingController.getTrendingCategories));
router.post('/add-category', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.newListingCategory));
router.put('/update-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.updateListingCategory));
router.delete('/delete-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(listingController.deleteListingCategory));

// moved to bottom, otherwise other urls matches this path
router.get('/:slug', apiKey(), awaitHandlerFactory(listingController.getListing));

module.exports = router;