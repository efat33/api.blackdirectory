const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pages-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

router.get('/get-pages', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.getPages));
router.get('/get-page/:page_slug', apiKey(), awaitHandlerFactory(pagesController.getPage));
router.post('/add-page', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.newPage));
router.put('/update-page/:page_slug', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.updatePage));
router.delete('/delete-page/:page_slug', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.deletePage));

router.get('/get-faqs', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.getFaqs));
router.get('/get-faq/:faq_id', apiKey(), awaitHandlerFactory(pagesController.getFaq));
router.post('/add-faq', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.newFaq));
router.put('/update-faq/:faq_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.updateFaq));
router.delete('/delete-faq/:faq_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(pagesController.deleteFaq));

module.exports = router;