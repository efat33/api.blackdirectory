const fs = require('fs')
const UserModel = require("../models/user-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const hasher = require('wordpress-hash-node');
const jobModel = require("../models/job-model");
const mailHandler = require('../utils/mailHandler.js');
dotenv.config();

class UserController {

  tableUsersMeta = 'users_meta';


  checkValidation = (req) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new AppError(400, "400_paramMissingGeneral", null, errors);
    }
  };

  userRegister = async (req, res, next) => {

    // check primary validation set in userValidator.js
    this.checkValidation(req);

    const reg_time = commonfn.dateTimeNow();
    const current_time = commonfn.currentTimestamp();
    const random_string = commonfn.randomString(30);
    const verification_key = `${current_time}:${random_string}`;

    const registerInfo = {
      "email": req.body.email,
      "username": req.body.username,
      "password": hasher.HashPassword(req.body.password),
      "auth_type": "general",
      "role": req.body.job_employer ? 'employer' : 'candidate',
      "created_at": reg_time,
      "updated_at": reg_time,
      "verification_key": verification_key
    }

    // validate email and password

    // check if the user already exists
    const user = await UserModel.findOneMatchAny({ "email": req.body.email, "username": req.body.username });

    if (user.length > 0) {
      throw new AppError(403, "403_emailUsernameAlreadyExists");
    }

    const registerResult = await UserModel.register(registerInfo);

    if (registerResult.status == 200) {

      const secretKey = process.env.SECRET_JWT || "";
      const token = jwt.sign({ user_id: registerResult.data.user_id.toString(), role: registerInfo.role.toString() }, secretKey, {
        expiresIn: "24h",
      });
      const { password, ...userWithoutPassword } = registerInfo;

      res.cookie("BDY-authorization", `Bearer ${token}`, { httpOnly: true, sameSite: 'none', secure: true });

      this.sendWelcomeMail(req.body.username, req.body.email);
      this.sendActivationMail(req.body.username, req.body.email, registerInfo.verification_key);

      new AppSuccess(res, 200, "200_registerSuccess", {}, { ...userWithoutPassword, id: registerResult.data.user_id });

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  resendVerificationEmail = async (req, res, next) => {
    const user = await UserModel.getUserProfile({ "id": req.currentUser.id });

    const username = user.data.username;
    const email = user.data.email;
    const key = user.meta_data.find((data) => data.meta_key === 'verification_key');

    if (email && key) {
      this.sendActivationMail(username, email, key.meta_value);
    }

    new AppSuccess(res, 200, "Sent");
  }

  sendWelcomeMail = (username, email) => {
    const mailOptions = {
      to: email,
      subject: 'Welcome to Black Directory!',
      body: `Hi ${username},
      
Thank you for registering with Black Directory. We look forward to you using our platform and enjoying all the features we have to offer.

Kind regards,

Black Directory`,
    }

    mailHandler.sendEmail(mailOptions);
  }

  sendActivationMail = (username, email, key) => {
    const websiteUrl = process.env.WEBSITE_URL;

    const mailOptions = {
      to: email,
      subject: 'Black Directory - Email Confirmation',
      body: `Hello ${username},
      
Please confirm your email address to complete your account registration. Please <a href="${websiteUrl}/verify/${key}">click here</a>.

Kind regards,

Black Directory`,
    }

    mailHandler.sendEmail(mailOptions);
  }

  userLogin = async (req, res, next) => {

    this.checkValidation(req);

    const user = await UserModel.findOne({ email: req.body.email });

    if (!user || user.auth_type != 'general') {
      throw new AppError(403, "403_signInInvalidEmail");
    }
    else if (user.is_deactivated == 1) {
      throw new AppError(403, "Account Deactivated: Contact Customer Service");
    } else {

      const dbPassword = user.password;
      const isPassMatched = hasher.CheckPassword(req.body.password, dbPassword);

      if (isPassMatched) {

        const secretKey = process.env.SECRET_JWT || "";
        const token = jwt.sign({ user_id: user.id.toString(), role: user.role.toString() }, secretKey, {
          expiresIn: "24h",
        });
        const { password, ...userWithoutPassword } = user;


        res.cookie("BDY-authorization", `Bearer ${token}`, { httpOnly: true, sameSite: 'none', secure: true });
        new AppSuccess(res, 200, "200_loginSuccessful", '', { ...userWithoutPassword });

      } else {
        throw new AppError(403, "403_signInInvalidPassword");
      }

    }

  };

  logout = async (req, res, next) => {

    res.clearCookie("BDY-authorization");
    new AppSuccess(res, 200);

  };

  userLoginWithFacebook = async (req, res, next) => {

    this.checkValidation(req);

    const user = await UserModel.findOne({ email: req.body.email });

    if (user) {
      if (user.auth_type == 'general') {  // show error message if auth type is general
        throw new AppError(403, "403_emailAlreadyUsed");
      }

      // sign the user in
      const secretKey = process.env.SECRET_JWT || "";
      const token = jwt.sign({ user_id: user.id.toString() }, secretKey, {
        expiresIn: "24h",
      });
      const { password, ...userWithoutPassword } = user;

      new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_account' }, { ...userWithoutPassword, token });

    }
    else {
      const reg_time = commonfn.dateTimeNow();

      const registerInfo = {
        "email": req.body.email,
        "username": req.body.username,
        "password": hasher.HashPassword('Password123@'),
        "auth_type": "facebook",
        "role": 'candidate',
        "created_at": reg_time,
        "updated_at": reg_time
      }

      const registerResult = await UserModel.register(registerInfo);

      if (registerResult.status == 200) {

        const secretKey = process.env.SECRET_JWT || "";
        const token = jwt.sign({ user_id: registerResult.data.user_id.toString() }, secretKey, {
          expiresIn: "24h",
        });
        const { password, ...userWithoutPassword } = registerInfo;

        new AppSuccess(res, 200, "200_registerSuccess", {}, { ...userWithoutPassword, token });

      }
      else {
        throw new AppError(403, "403_unknownError");
      }
    }

  };

  forgotPassword = async (req, res, next) => {
    this.checkValidation(req);

    const current_time = commonfn.currentTimestamp();
    const random_string = commonfn.randomString(30);
    const reset_key = `${current_time}:${random_string}`;

    if (req.body.email.trim() == '') {
      throw new AppError(401, "400_paramMissing", { 'entity': 'entity_email' });
    }

    const updateInfo = {
      "email": req.body.email,
      "reset_key": reset_key
    }

    const result = await UserModel.userForgotPassword(updateInfo);

    if (result == false) {
      throw new AppError(403, "403_invalidEmail");
    }

    if (result.affectedRows == 1) {
      const user = await UserModel.findOne({ email: req.body.email });
      const emailBody = `Hello,

Someone has requested a password reset for the following account:

https://www.blackdirectory.co.uk/
Username: ${user.username}

If this was a mistake, just ignore this email and nothing will happen.

To reset your password, use the following reset key:
${reset_key}`;

      const mailOptions = {
        to: req.body.email,
        subject: 'Black Directory - Password Reset',
        body: emailBody,
      }

      mailHandler.sendEmail(mailOptions);

      new AppSuccess(res, 200, "200_successful");
    }
  }

  changePassword = async (req, res, next) => {
    this.checkValidation(req);

    const currentUserID = req.currentUser.id;
    const user = await UserModel.findOne({ id: currentUserID });

    const dbPassword = user.password;
    const isPassMatched = hasher.CheckPassword(req.body.password, dbPassword);

    if (!isPassMatched) {
      throw new AppError(403, "403_passwordsCurrentDontMatch");
    }

    if (req.body.new_password != req.body.confirm_password) {
      throw new AppError(403, "403_passwordsDontMatch");
    }

    const updateInfo = {
      "id": user.id,
      "password": hasher.HashPassword(req.body.new_password),
      "updated_at": commonfn.dateTimeNow()
    }

    const result = await UserModel.changePassword(updateInfo);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_password' });
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  resetPassword = async (req, res, next) => {
    this.checkValidation(req);

    const user = await UserModel.findOne({ meta_value: req.body.reset_key, meta_key: 'reset_passwork_key' }, 'users_meta');
    if (!user) {
      throw new AppError(403, "403_invalidResetKey");
    }

    if (req.body.password != req.body.con_password) {
      throw new AppError(403, "403_passwordsDontMatch");
    }

    const updateInfo = {
      "id": user.user_id,
      "password": hasher.HashPassword(req.body.password),
      "updated_at": commonfn.dateTimeNow()
    }

    const result = await UserModel.updatePassword(updateInfo);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_password' });
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  updateUser = async (req, res, next) => {
    let currentUser = req.currentUser;
    if (req.params.id) {
      const user = await UserModel.getUserDetailsByID({ id: req.params.id });
      currentUser = { id: user.data.id, role: user.data.role };
    }

    const current_date = commonfn.dateTimeNow();

    const basic_info = {
      'first_name': req.body.first_name,
      'last_name': req.body.last_name,
      'display_name': req.body.display_name,
      'dob': req.body.dob,
      'phone': req.body.phone,
      'is_business': req.body.is_business,
      'description': req.body.description,
      'profile_photo': req.body.profile_photo_name,
      'cover_photo': req.body.cover_photo_name,
      'forum_role': req.body.forum_role,
      'address': req.body.address,
      'latitude': req.body.latitude,
      'longitude': req.body.longitude,
      'job_sectors_id': req.body.job_sectors_id || null,
      'pubic_view': req.body.pubic_view,
      'updated_at': current_date
    }

    const employer_info = {};
    const candidate_info = {};
    const candidate_others = {};

    // do password validation
    // if(req.body.new_password != ''){
    //   // first check if the current passwords match
    //   if(db_hash_pass != current_hash_pass){
    //     throw new AppError(403, "403_passwordsCurrentDontMatch");
    //   }

    //   // check if the new passwords match
    //   if(req.body.new_password != req.body.confirm_password){
    //     throw new AppError(403, "403_newPasswordsDontMatch");
    //   }

    //   basic_info.password = hasher.HashPassword(req.body.new_password);
    // }

    // prepare employer and candidate data
    if (currentUser.role == 'employer' || currentUser.role == 'admin') {
      employer_info.facebook_link = req.body.facebook_link;
      employer_info.twitter_link = req.body.twitter_link;
      employer_info.linkedin_link = req.body.linkedin_link;
      employer_info.instagram_link = req.body.instagram_link;
      employer_info.pinterest_link = req.body.pinterest_link;
      employer_info.spotify_link = req.body.spotify_link;
      employer_info.tiktok_link = req.body.tiktok_link;
      employer_info.youtube_link = req.body.youtube_link;
      employer_info.apple_music_link = req.body.apple_music_link;
      employer_info.tidal_link = req.body.tidal_link;
      employer_info.soundcloud_link = req.body.soundcloud_link;

      employer_info.website = req.body.website;
      employer_info.founded_date = req.body.founded_date;
    }
    else if (currentUser.role == 'candidate') {
      candidate_info.facebook_link = req.body.facebook_link;
      candidate_info.twitter_link = req.body.twitter_link;
      candidate_info.linkedin_link = req.body.linkedin_link;
      candidate_info.instagram_link = req.body.instagram_link;
      candidate_info.pinterest_link = req.body.pinterest_link;
      candidate_info.spotify_link = req.body.spotify_link;
      candidate_info.tiktok_link = req.body.tiktok_link;
      candidate_info.youtube_link = req.body.youtube_link;
      candidate_info.apple_music_link = req.body.apple_music_link;
      candidate_info.tidal_link = req.body.tidal_link;
      candidate_info.soundcloud_link = req.body.soundcloud_link;

      candidate_info.job_title = req.body.job_title;
      candidate_info.job_industry = req.body.job_industry;
      candidate_info.salary_type = req.body.salary_type;
      candidate_info.salary_amount = req.body.salary_amount;
      candidate_info.age = req.body.age;
      candidate_info.academics = JSON.stringify(req.body.academics);
      candidate_info.gender = req.body.gender;
      candidate_info.availble_now = req.body.availble_now;
      candidate_info.cover_letter = req.body.cover_letter;
      candidate_info.candidate_cv = req.body.candidate_cv_name;
    }
    if (req.body.candidateEducations && req.body.candidateEducations.length > 0) {
      candidate_others.educations = req.body.candidateEducations;
    }
    if (req.body.removedEducations && JSON.parse(req.body.removedEducations) && JSON.parse(req.body.removedEducations).length > 0) {
      candidate_others.educationsTobeRemoved = JSON.parse(req.body.removedEducations);
    }

    if (req.body.candidateExperiences && req.body.candidateExperiences.length > 0) {
      candidate_others.experiences = req.body.candidateExperiences;
    }
    if (req.body.removedExperiences && JSON.parse(req.body.removedExperiences) && JSON.parse(req.body.removedExperiences).length > 0) {
      candidate_others.experiencesTobeRemoved = JSON.parse(req.body.removedExperiences);
    }

    if (req.body.candidatePortfolios && req.body.candidatePortfolios.length > 0) {
      candidate_others.portfolios = req.body.candidatePortfolios;
    }
    if (req.body.removedPortfolios && JSON.parse(req.body.removedPortfolios) && JSON.parse(req.body.removedPortfolios).length > 0) {
      candidate_others.portfoliosTobeRemoved = JSON.parse(req.body.removedPortfolios);
    }

    // it can be partial edit
    const result = await UserModel.updateProfile(basic_info, employer_info, candidate_info, currentUser, candidate_others);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_user' });
    }
    else {
      throw new AppError(403, "403_unknownError");
    }


  };


  userProfile = async (req, res, next) => {
    let body;

    if (req.params.id) {
      body = { "id": req.params.id }
    } else {
      body = { "id": req.currentUser.id, "role": req.currentUser.role };
    }

    const user = await UserModel.getUserProfile(body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_user' }, user);

  }

  userDetails = async (req, res, next) => {

    const user = await UserModel.getUserDetails({ username: req.params.username });

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_user' }, user);

  }

  userDetailsByID = async (req, res, next) => {

    const user = await UserModel.getUserDetailsByID({ id: req.params.id });

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_user' }, user);

  }

  confirmAccount = async (req, res, next) => {

    const userMeta = await UserModel.findOne({ "meta_value": req.body.verification_key, "meta_key": 'verification_key' }, this.tableUsersMeta);

    if (userMeta) {
      // make the user verified
      const user_id = userMeta.user_id;
      const result = await UserModel.verifyAccount({ 'id': user_id });

      if (result.affectedRows == 1) {
        new AppSuccess(res, 200, "200_verifiedSuccess");
      }
      else {
        throw new AppError(403, "403_unknownError");
      }
    }
    else {
      throw new AppError(403, "403_invalidVerificationKey");
    }

  }

  userRequest = async (req, res, next) => {

    // check if the user has already made the request 
    const request = await UserModel.findOne({ user_id: req.currentUser.id }, commonfn.DBTables.user_requests);
    if (request && Object.keys(request).length > 0) {
      throw new AppError(403, "Request has already been made");
    }

    const result = await UserModel.userRequest(req.body, req.currentUser);

    if (result.affectedRows == 1) {
      const emailBody = `Dear Black Directory,

A user has requested to ${req.body.request} his/her account.

User Email: ${req.body.user_email}
Request: ${req.body.request}

Description: ${req.body.description}`;

      const mailOptions = {
        subject: 'Black Directory - Account Deactivate or Delete',
        body: emailBody,
      }

      mailHandler.sendEmail(mailOptions);

      // send mail to customer
      const customerEmailBody = `Dear ${req.currentUser.name},

You have requested to ${req.body.request} your account for the following account.

User Email: ${req.body.user_email}
Your requested is now being processed.

Thank you for your patience.

Kind regards,

Black Directory`;

      const customerMailOptions = {
        subject: 'Black Directory - Account Deactivate or Delete',
        body: customerEmailBody,
      }

      mailHandler.sendEmail(customerMailOptions);

      new AppSuccess(res, 200, "200_successful");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getUserRequests = async (req, res, next) => {

    const result = await UserModel.find({}, commonfn.DBTables.user_requests, 'ORDER BY created_at ASC');
    new AppSuccess(res, 200, "200_successful", {}, result);
  }

  userRequestDeactivate = async (req, res, next) => {

    const result = await UserModel.userRequestDeactivate(req.body);

    if (result.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "Deactivated Successfully",);
  }

  userRequestReactivate = async (req, res, next) => {

    const result = await UserModel.userRequestReactivate(req.body);

    if (result.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "Activated Successfully",);
  }

  userImports = async (req, res, next) => {

    const result = await UserModel.importUsers();

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_user' }, result);

  }

  getAllUsers = async (req, res, next) => {
    let userList = await UserModel.find();
    if (!userList.length) {
      throw new AppError(404, "Users not found");
    }

    userList = userList.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.send(userList);
  };

  getDeactivatedUsers = async (req, res, next) => {
    let userList = await UserModel.find({ is_deactivated: 1 });

    userList = userList.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.send(userList);
  };

  getUserById = async (req, res, next) => {
    const user = await UserModel.findOne({ _id: req.params.id });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const { password, ...userWithoutPassword } = user;

    res.send(userWithoutPassword);
  };

  getUsersByIds = async (req, res, next) => {
    const result = await UserModel.getUsersByIds(req.body.userIds);

    const users = [];

    for (const user of result) {
      const { password, ...userWithoutPassword } = user;

      users.push(userWithoutPassword);
    }

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_users' }, users);
  };

  checkAuthentication = async (req, res, next) => {

    let user = '';
    if (req.currentUser) user = await UserModel.findOne({ 'id': req.currentUser.id });

    new AppSuccess(res, 200, "200_successful", "", user);

  }


  getUserReviews = async (req, res, next) => {
    const reviews = await UserModel.getUserReviews(req.params.user_id);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_userReview' }, reviews);
  };

  createUserReview = async (req, res, next) => {
    const review = await UserModel.createUserReview(req.params.user_id, req.body, req.currentUser);

    if (review.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_userReview' });
  }


  getFollowers = async (req, res, next) => {
    const followers = await UserModel.getFollowers(req.currentUser);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_userReview' }, followers);
  };


  getFollowings = async (req, res, next) => {
    const followings = await UserModel.getFollowings(req.currentUser);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_userFollower' }, followings);
  };

  createUserFollower = async (req, res, next) => {
    const review = await UserModel.createUserFollower(req.params.user_id, req.currentUser);

    if (review.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_userFollower' });
  }

  deleteFollowing = async (req, res, next) => {
    await UserModel.deleteFollowing(req.params.user_id, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  };

  createNotification = async (notificationBody) => {
    const result = await UserModel.createNotification(notificationBody);

    if (result.status !== 200) {
      return;
    }

    // send email
    const notification = (await UserModel.getNotification(result.id))[0];
    const job = (await jobModel.getJobsByIds([notification.notification_type_id]))[0];

    if (job.job_apply_type === 'with_email') {
      return;
    }

    const emailSubject = await this.getJobNotificationEmailSubject(notification);
    const emailBody = await this.getJobNotificationEmailBody(notification, job);

    const mailOptions = {
      to: notification.user_email,
      subject: emailSubject,
      body: emailBody,
    }

    mailHandler.sendEmail(mailOptions);
  }

  getJobNotificationEmailSubject = async (notification) => {
    if (notification.notification_trigger === 'shortlisted') {
      return `Black Directory - Candidate Shortlisted for Interview`;
    }

    if (notification.notification_trigger === 'rejected') {
      return `Black Directory - Application Rejected for Interview`;
    }

    if (notification.notification_trigger === 'new job application') {
      return `Black Directory - Job Application`;
    }

    if (notification.notification_trigger === 'new job') {
      return `Black Directory - New Job Alert`;
    }
  }

  getJobNotificationEmailBody = async (notification, job) => {
    const websiteUrl = process.env.WEBSITE_URL;

    if (notification.notification_trigger === 'shortlisted') {
      return `Dear ${notification.user_display_name},
      
Thank you for your application for the job "<a href='${websiteUrl}/jobs/details/${job.slug}'>${job.title}</a>". We are pleased to inform you that you have been shortlisted for an interview. The employer "<a href='${websiteUrl}/user-details/${notification.acted_user_username}'>${notification.acted_user_display_name}</a>" will conatct you to inform you of details of the interview.

Best regards,

Black Directory`;
    }

    if (notification.notification_trigger === 'rejected') {
      return `Dear ${notification.user_display_name},
      
Thank you for your application for the job "<a href='${websiteUrl}/jobs/details/${job.slug}'>${job.title}</a>". We regret to inform you that your application was rejected.

Best regards,

Black Directory`;
    }

    if (notification.notification_trigger === 'new job application') {
      return `Hi ${notification.user_display_name},
      
You have recieved a new application from "<a href='${websiteUrl}/user-details/${notification.acted_user_username}'>${notification.acted_user_display_name}</a>" for your job "<a href='${websiteUrl}/jobs/details/${job.slug}'>${job.title}</a>". "<a href='${websiteUrl}/user-details/${notification.acted_user_username}'>${notification.acted_user_display_name}</a>"'s profile, application and CV can be found in your <a href="${websiteUrl}/dashboard/all-applicants">Account</a> or you can find the CV attached within.

Best wishes,

Black Directory`;
    }

    if (notification.notification_trigger === 'new job') {
      return `Dear ${notification.user_display_name},
      
A new job "<a href='${websiteUrl}/jobs/details/${job.slug}'>${job.title}</a>" has been posted by "<a href='${websiteUrl}/user-details/${notification.acted_user_username}'>${notification.acted_user_display_name}</a>" who you are following.

Best regards,

Black Directory`;
    }
  }

  getNotifications = async (req, res, next) => {
    const notifications = await UserModel.getNotifications(req.currentUser);

    const jobIds = notifications
      .filter((notification) => notification.notification_type === 'job')
      .map(notification => notification.notification_type_id);

    const jobs = await jobModel.getJobsByIds(jobIds);

    for (let notification of notifications) {
      if (notification.notification_type === 'job') {
        const job = jobs.find(job => job.id == notification.notification_type_id);
        notification.job = job;
      }
    }

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_notification' }, notifications);
  };

  updateNotification = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await UserModel.updateNotification(req.params.notification_id, req.body);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_notification' });
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  deleteNotification = async (req, res, next) => {
    await UserModel.deleteNotification(req.params.notification_id);

    new AppSuccess(res, 200, "200_successful");
  };

  verifiyEmail = async (req, res, next) => {
    const result = await UserModel.verifiyEmail(req.params.verification_key);

    if (!result) {
      throw new AppError(403, "403_unknownError");
    }

    new AppSuccess(res, 200, "200_successful");
  };

  getCandidateCV = async (req, res, next) => {
    const application = await jobModel.getJobApplication(req.params.application_id);

    if (Object.keys(application).length === 0) {
      throw new AppError(403, "Application not found");
    };

    if (application[0].employer_id != req.currentUser.id) {
      throw new AppError(403, "Application not found");
    }

    const userInfo = await UserModel.getUserDetailsByID({ id: application[0].user_id });

    if (Object.keys(userInfo).length === 0) {
      throw new AppError(403, "Application not found");
    };

    const currentPackage = await jobModel.getCurrentPackage(req.currentUser);

    const cvDownload = currentPackage.meta_values.find(meta => meta.meta_key === 'cv_download');
    const cvDownloadCount = cvDownload ? cvDownload.meta_value : 0;

    if (currentPackage.currentPackage.cv_download > -1 &&
      cvDownloadCount.meta_value >= currentPackage.currentPackage.cv_download
    ) {
      throw new AppError(403, "Please upgrade your package");
    }

    const cv = userInfo.meta_data.find(meta => meta.meta_key === 'candidate_cv');

    if (!cv || !cv.meta_value) {
      throw new AppError(403, "CV does not exists");
    }

    const cv_url = `${__basedir}/uploads/users/${cv.meta_value}`;

    if (fs.existsSync(cv_url)) {
      // increase cv download count
      await UserModel.increaseCVDownloadCount(req.currentUser);

      res.download(cv_url);
    } else {
      throw new AppError(403, "CV does not exists");
    }
  };
}

module.exports = new UserController();
