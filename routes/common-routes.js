const express = require('express');
const router = express.Router();
const commonController = require('../controllers/common-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

router.get('/get-hero-slides', apiKey(), awaitHandlerFactory(commonController.getHeroSlides));

router.post('/add-hero-slide', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(commonController.newHeroSlide));
router.put('/update-hero-slide/:slide_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(commonController.updateHeroSlide));
router.delete('/delete-hero-slide/:slide_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(commonController.deleteHeroSlide));



module.exports = router;