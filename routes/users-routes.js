const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const auth = require('../utils/auth');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');

const validation = require('../utils/userValidator');

// router.get('/', auth(), userController.getAllUsers);
// router.get('/:id', auth(), awaitHandlerFactory(userController.getUserById));

router.post('/register', apiKey(), validation.validateRegister, awaitHandlerFactory(userController.userRegister));
router.post('/login', apiKey(), validation.validateLogin, awaitHandlerFactory(userController.userLogin));
router.post('/login-facebook', apiKey(), validation.validateLoginTypeFacebook, awaitHandlerFactory(userController.userLoginWithFacebook));
router.post('/forgot-password', apiKey(), awaitHandlerFactory(userController.forgotPassword));
router.post('/reset-password', apiKey(), validation.validateResetPassword, awaitHandlerFactory(userController.resetPassword));
router.post('/change-password', apiKey(), validation.validateChangePassword, auth(), awaitHandlerFactory(userController.changePassword));
router.post('/confirm-account', apiKey(), awaitHandlerFactory(userController.confirmAccount));
router.post('/user-update', apiKey(), auth(), awaitHandlerFactory(userController.updateUser));
router.get('/authenticated', apiKey(), auth(), awaitHandlerFactory(userController.checkAuthentication));

router.get('/logout', apiKey(), awaitHandlerFactory(userController.logout));
router.get('/user-profile', apiKey(), auth(), awaitHandlerFactory(userController.userProfile));
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

module.exports = router;