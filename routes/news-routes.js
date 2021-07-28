const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const auth = require('../utils/auth');
const currentUser = require('../utils/currentUser');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isEmployer, isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');


router.get('/get-categories', apiKey(), awaitHandlerFactory(newsController.getNewsCategories));
router.post('/add-category', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.newNewsCategory));
router.put('/update-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.updateNewsCategory));
router.delete('/delete-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.deleteNewsCategory));

module.exports = router;
