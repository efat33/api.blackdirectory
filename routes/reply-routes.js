const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const forumController = require('../controllers/forum-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin, canCreateForum, canCreateTopic } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.post('/add-reply', apiKey(), authVerified(), canCreateTopic(), awaitHandlerFactory(forumController.newReply));
router.post('/get-replies', apiKey(), awaitHandlerFactory(forumController.getReplies));
router.post('/get-user-replies', apiKey(), awaitHandlerFactory(forumController.getUserReplies));
router.get('/get-reply/:reply_id', apiKey(), awaitHandlerFactory(forumController.getSingleReply));
router.put('/update-reply/:reply_id', apiKey(), authVerified(), awaitHandlerFactory(forumController.updateReply));
router.delete('/delete-reply/:reply_id', apiKey(), authVerified(), awaitHandlerFactory(forumController.deleteReply));


module.exports = router;
