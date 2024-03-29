const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const auth = require('../utils/auth');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/userValidator');
const authVerified = require('../utils/authVerified');
const { isAdmin } = require('../utils/common');

// router.get('/', auth(), userController.getAllUsers);
// router.get('/:id', auth(), awaitHandlerFactory(userController.getUserById));

router.post('/register', apiKey(), validation.validateRegister, awaitHandlerFactory(userController.userRegister));
router.get('/resend-email', apiKey(), auth(), awaitHandlerFactory(userController.resendVerificationEmail));
router.post('/login', apiKey(), validation.validateLogin, awaitHandlerFactory(userController.userLogin));
router.post('/login-facebook', apiKey(), validation.validateLoginTypeFacebook, awaitHandlerFactory(userController.userLoginWithFacebook));
router.post('/forgot-password', apiKey(), awaitHandlerFactory(userController.forgotPassword));
router.post('/reset-password', apiKey(), validation.validateResetPassword, awaitHandlerFactory(userController.resetPassword));
router.post('/change-password', apiKey(), validation.validateChangePassword, auth(), awaitHandlerFactory(userController.changePassword));
router.post('/confirm-account', apiKey(), awaitHandlerFactory(userController.confirmAccount));
router.post('/user-update', apiKey(), auth(), awaitHandlerFactory(userController.updateUser));
router.post('/user-update/:id', apiKey(), auth(), isAdmin(), awaitHandlerFactory(userController.updateUser));
router.get('/authenticated', apiKey(), currentUser(), awaitHandlerFactory(userController.checkAuthentication));

router.post('/user-request', apiKey(), auth(), awaitHandlerFactory(userController.userRequest));
router.get('/user-request', apiKey(), auth(), awaitHandlerFactory(userController.getUserRequests));
router.post('/user-request-deactivate', apiKey(), auth(), isAdmin(), awaitHandlerFactory(userController.userRequestDeactivate));
router.post('/user-request-reactivate', apiKey(), auth(), isAdmin(), awaitHandlerFactory(userController.userRequestReactivate));

router.get('/logout', apiKey(), awaitHandlerFactory(userController.logout));

router.get('/user-profile', apiKey(), auth(), awaitHandlerFactory(userController.userProfile));
router.get('/user-profile/:id', apiKey(), auth(), isAdmin(), awaitHandlerFactory(userController.userProfile));

router.get('/user-details/:username', apiKey(), awaitHandlerFactory(userController.userDetails));
router.get('/user-details-by-id/:id', apiKey(), awaitHandlerFactory(userController.userDetailsByID));

router.get('/user-imports', apiKey(), awaitHandlerFactory(userController.userImports));

router.route('/user-review/:user_id')
    .get(apiKey(), awaitHandlerFactory(userController.getUserReviews))
    .post(apiKey(), auth(), awaitHandlerFactory(userController.createUserReview));

router.post('/follow/:user_id', apiKey(), auth(), awaitHandlerFactory(userController.createUserFollower));
router.get('/get-followers', apiKey(), auth(), awaitHandlerFactory(userController.getFollowers));
router.get('/get-followings', apiKey(), auth(), awaitHandlerFactory(userController.getFollowings));
router.delete('/unfollow/:user_id', apiKey(), auth(), awaitHandlerFactory(userController.deleteFollowing));

router.post('/notification/:notification_id', apiKey(), auth(), awaitHandlerFactory(userController.createNotification));
router.get('/get-notifications', apiKey(), auth(), awaitHandlerFactory(userController.getNotifications));
router.put('/update-notification/:notification_id', apiKey(), auth(), awaitHandlerFactory(userController.updateNotification));
router.delete('/notification/:notification_id', apiKey(), auth(), awaitHandlerFactory(userController.deleteNotification));

router.post('/get-users', apiKey(), auth(), awaitHandlerFactory(userController.getUsersByIds));
router.get('/get-all-users', apiKey(), auth(), awaitHandlerFactory(userController.getAllUsers));
router.get('/get-deactivated-users', apiKey(), auth(), awaitHandlerFactory(userController.getDeactivatedUsers));

router.get('/get-candidate-cv/:application_id', apiKey(), authVerified(), awaitHandlerFactory(userController.getCandidateCV));

router.get('/verify-email/:verification_key', awaitHandlerFactory(userController.verifiyEmail));

router.get('/get-all-users', apiKey(), auth(), isAdmin(), awaitHandlerFactory(userController.getAllUsers));

module.exports = router;