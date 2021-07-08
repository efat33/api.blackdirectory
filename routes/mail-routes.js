const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mail-controller');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

router.post('/send', apiKey(), awaitHandlerFactory(mailController.sendMail));


module.exports = router;
