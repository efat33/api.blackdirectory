const express = require('express');
const router = express.Router();
const mobilesController = require('../controllers/mobiles-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

router.get('/get-mobiles', apiKey(), awaitHandlerFactory(mobilesController.getMobiles));
router.get('/get-mobile/:mobile_id', apiKey(), awaitHandlerFactory(mobilesController.getMobile));
router.post('/add-mobile', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(mobilesController.newMobile));
router.put('/update-mobile/:mobile_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(mobilesController.updateMobile));
router.delete('/delete-mobile/:mobile_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(mobilesController.deleteMobile));
router.get('/get-top-mobiles', apiKey(), awaitHandlerFactory(mobilesController.getTopMobiles));

router.get('/get-providers', apiKey(), awaitHandlerFactory(mobilesController.getMobilesProviders));
router.post('/add-provider', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(mobilesController.newMobilesProvider));
router.put('/update-provider/:provider_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(mobilesController.updateMobilesProvider));
router.delete('/delete-provider/:provider_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(mobilesController.deleteMobilesProvider));

module.exports = router;