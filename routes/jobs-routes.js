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
router.put('/update-job/:job_id', apiKey(), auth(), awaitHandlerFactory(jobController.updateJob));
router.delete('/delete-job/:job_id', apiKey(), auth(), awaitHandlerFactory(jobController.deleteJob));

router.get('/get-user-jobs', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.getUserJobs));
router.get('/get-user-job/:job_id', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.getUserJob));

module.exports = router;
