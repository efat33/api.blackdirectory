const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isEmployer } = require('../utils/common');

const validation = require('../utils/listingValidator');


router.get('/sectors', apiKey(), awaitHandlerFactory(jobController.sectors));
router.post('/new-job', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.newJob));
router.get('/get-user-jobs', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.getUserJobs));

module.exports = router;
