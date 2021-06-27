const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/listingValidator');


router.get('/sectors', apiKey(), awaitHandlerFactory(jobController.sectors));



module.exports = router;