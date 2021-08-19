const express = require('express');
const router = express.Router();
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const StripeController = require('../controllers/stripe-controller');

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), awaitHandlerFactory(StripeController.stripeWebhook));

module.exports = router;