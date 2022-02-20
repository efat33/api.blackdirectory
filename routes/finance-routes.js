const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news-controller');
const financeController = require('../controllers/finance-controller');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/listingValidator');

router.get('/get-finance', apiKey(), awaitHandlerFactory(financeController.getFinance));
router.post('/get-finance', apiKey(), awaitHandlerFactory(financeController.getFinance));
router.get('/get-finance/:finance_id', apiKey(), awaitHandlerFactory(financeController.getSingleFinance));
router.post('/add-finance', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(financeController.newFinance));
router.put('/update-finance/:finance_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(financeController.updateFinance));
router.delete('/delete-finance/:finance_id', apiKey(), authVerified(), isAdmin(), awaitHandlerFactory(financeController.deleteFinance));


module.exports = router;
