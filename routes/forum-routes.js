const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const forumController = require('../controllers/forum-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin, canCreateForum } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.post('/add-forum', apiKey(), authVerified(), canCreateForum(), awaitHandlerFactory(forumController.newForum));
router.post('/get-forums', apiKey(), awaitHandlerFactory(forumController.getForums));
router.get('/get-forum/:forum_id', apiKey(), awaitHandlerFactory(forumController.getSingleForum));
router.put('/update-forum/:forum_id', apiKey(), authVerified(), awaitHandlerFactory(forumController.updateForum));
router.delete('/delete-news/:news_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(newsController.deleteNews));


/**
 * Topic
 * */ 
router.post('/add-forum', apiKey(), authVerified(), canCreateForum(), awaitHandlerFactory(forumController.newForum));


router.post('/add-comment', apiKey(), authVerified(), awaitHandlerFactory(newsController.newNewsComment));
router.delete('/delete-comment/:comment_id', apiKey(), authVerified(), awaitHandlerFactory(newsController.deleteNewsComment));
router.put('/update-comment/:comment_id', apiKey(), authVerified(), awaitHandlerFactory(newsController.updateNewsComment));


module.exports = router;
