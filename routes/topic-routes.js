const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const forumController = require('../controllers/forum-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin, canCreateForum, canCreateTopic } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.post('/add-topic', apiKey(), authVerified(), canCreateTopic(), awaitHandlerFactory(forumController.newTopic));
router.post('/get-topics', apiKey(), awaitHandlerFactory(forumController.getTopics));
router.put('/update-topic/:topic_id', apiKey(), authVerified(), awaitHandlerFactory(forumController.updateTopic));

router.get('/get-topic/:topic_id', apiKey(), awaitHandlerFactory(forumController.getSingleTopic));

module.exports = router;
