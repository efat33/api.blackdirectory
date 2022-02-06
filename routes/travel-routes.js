const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const travelController = require('../controllers/travel-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.get('/get-travels', apiKey(), awaitHandlerFactory(travelController.getTravels));
router.post('/get-travels', apiKey(), awaitHandlerFactory(travelController.getTravels));
router.get('/get-travel/:travel_id', apiKey(), awaitHandlerFactory(travelController.getSingleTravel));
router.post('/add-travel', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(travelController.newTravel));
router.put('/update-travel/:travel_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(travelController.updateTravel));
router.delete('/delete-travel/:travel_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(travelController.deleteTravel));


module.exports = router;
