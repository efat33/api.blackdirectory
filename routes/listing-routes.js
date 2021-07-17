const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/listingValidator');

// router.get('/', auth(), userController.getAllUsers);
// router.get('/:id', auth(), awaitHandlerFactory(userController.getUserById));

router.post('/search-listing', apiKey(), awaitHandlerFactory(listingController.searchListing));
router.post('/add-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.newListing));
router.post('/update-listing', apiKey(), authVerified(), validation.validateNewListing, awaitHandlerFactory(listingController.updateListing));
router.get('/:slug', apiKey(), awaitHandlerFactory(listingController.getListing));
router.post('/publish-listing', apiKey(), authVerified(), awaitHandlerFactory(listingController.publishListing));


module.exports = router;