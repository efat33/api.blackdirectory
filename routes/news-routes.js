const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.get('/get-news', apiKey(), awaitHandlerFactory(newsController.getNews));
router.post('/get-news', apiKey(), awaitHandlerFactory(newsController.getNews));
router.get('/get-news/:news_id', apiKey(), awaitHandlerFactory(newsController.getSingleNews));
router.post('/add-news', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.newNews));
router.put('/update-news/:news_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.updateNews));
router.delete('/delete-news/:news_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.deleteNews));

router.get('/get-categories', apiKey(), awaitHandlerFactory(newsController.getNewsCategories));
router.post('/add-category', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.newNewsCategory));
router.put('/update-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.updateNewsCategory));
router.delete('/delete-category/:category_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.deleteNewsCategory));

router.get('/get-top-news', apiKey(), awaitHandlerFactory(newsController.getTopNews));
router.put('/update-top-news', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.updateTopNews));

module.exports = router;
