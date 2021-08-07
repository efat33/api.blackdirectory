const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/listingValidator');

// router.get('/', auth(), userController.getAllUsers);
// router.get('/:id', auth(), awaitHandlerFactory(userController.getUserById));

router.get('/get-listings/:limit/:offset/:orderby/:all?', apiKey(), awaitHandlerFactory(listingController.getListings));
router.get('/favorites', apiKey(), currentUser(), awaitHandlerFactory(listingController.getFavorites));
router.get('/categories', apiKey(), currentUser(), awaitHandlerFactory(listingController.getCategories));
router.get('/update-favorite/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.updateFavorite));
router.post('/search-listing', apiKey(), awaitHandlerFactory(listingController.searchListing));
router.post('/add-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.newListing));
router.post('/update-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.updateListing));
router.post('/publish-listing', apiKey(), authVerified(), awaitHandlerFactory(listingController.publishListing));
router.get('/update-view/:id', apiKey(), awaitHandlerFactory(listingController.updateView));

router.get('/:slug', apiKey(), awaitHandlerFactory(listingController.getListing));

router.post('/new-review', apiKey(), authVerified(), awaitHandlerFactory(listingController.newReview));
router.post('/edit-review', apiKey(), authVerified(), awaitHandlerFactory(listingController.editReview));
router.delete('/delete-review/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteReview));
router.get('/get-reviews/:id', apiKey(), awaitHandlerFactory(listingController.getReviews));
router.post('/update-review-like', apiKey(), awaitHandlerFactory(listingController.updateReviewLike));
router.post('/submit-comment', apiKey(), authVerified(), awaitHandlerFactory(listingController.addOrEditComment));
router.delete('/delete-comment/:id', apiKey(), authVerified(), awaitHandlerFactory(listingController.deleteComment));

module.exports = router;