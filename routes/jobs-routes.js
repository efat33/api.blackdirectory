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

router.get('/get-job/:job_slug', apiKey(), awaitHandlerFactory(jobController.getJob));
router.post('/get-jobs', apiKey(), awaitHandlerFactory(jobController.getJobs));
router.post('/get-job-count', apiKey(), awaitHandlerFactory(jobController.getJobCount));
router.put('/update-job-property/:job_id', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.updateJobProperty));

router.post('/new-application', apiKey(), auth(), awaitHandlerFactory(jobController.newJobApplication));
router.get('/get-applications', apiKey(), auth(), awaitHandlerFactory(jobController.getJobApplications));
router.get('/get-applications/:job_id', apiKey(), auth(), awaitHandlerFactory(jobController.getJobApplications));
router.get('/get-application-status/:job_id', apiKey(), auth(), awaitHandlerFactory(jobController.getUserJobApplication));
router.put('/update-job-appliation/:application_id', apiKey(), auth(), awaitHandlerFactory(jobController.updateJobApplication));

router.get('/get-applied-jobs', apiKey(), auth(), awaitHandlerFactory(jobController.getAppliedJobs));

router.post('/save-candidate', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.saveCandidate));
router.get('/get-saved-candidates', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.getSavedCandidates));
router.delete('/delete-saved-candidate/:candidate_id', apiKey(), auth(), isEmployer(), awaitHandlerFactory(jobController.deleteSavedCandidate));

router.post('/save-favorite-job', apiKey(), auth(), awaitHandlerFactory(jobController.saveFavoriteJob));
router.get('/get-favorite-jobs', apiKey(), auth(), awaitHandlerFactory(jobController.getFavoriteJobs));
router.delete('/delete-favorite-job/:job_id', apiKey(), auth(), awaitHandlerFactory(jobController.deleteFavoriteJob));


module.exports = router;
