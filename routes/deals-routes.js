const express = require('express');
const router = express.Router();
const dealsController = require('../controllers/deals-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.post('/get-deals', apiKey(), awaitHandlerFactory(dealsController.getDeals));
router.post('/get-deal-count', apiKey(), awaitHandlerFactory(dealsController.getDealCount));
router.get('/get-deal/:deal_id', apiKey(), awaitHandlerFactory(dealsController.getDeal));
router.post('/add-deal', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(dealsController.newDeal));
router.put('/update-deal/:deal_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(dealsController.updateDeal));
router.delete('/delete-deal/:deal_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(dealsController.deleteDeal));

router.get('/get-dealers', apiKey(), awaitHandlerFactory(dealsController.getDealers));
router.post('/add-dealer', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(dealsController.newDealer));
router.put('/update-dealer/:dealer_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(dealsController.updateDealer));
router.delete('/delete-dealer/:dealer_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(dealsController.deleteDealer));


module.exports = router;
