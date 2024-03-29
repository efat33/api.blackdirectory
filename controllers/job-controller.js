const dotenv = require("dotenv");
dotenv.config();

const stripeSecretKey = process.env.NODE_ENV === 'development' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const nodemailer = require('nodemailer');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
const UserController = require('../controllers/user-controller');
const mailHandler = require('../utils/mailHandler.js');

const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
const jobTypes = {
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
  'full-time': 'Full Time',
  'part-time': 'Part Time',
};

class JobController {
  sectors = async (req, res, next) => {
    const sectors = await JobModel.getSectors();

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_sectors' }, sectors);
  }

  newJobSector = async (req, res, next) => {
    const newsSector = await JobModel.createJobSector(req.body);

    if (newsSector.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_sector' });
  }

  updateJobSector = async (req, res, next) => {
    const result = await JobModel.updateJobSector(req.params.job_sector_id, req.body);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_sector' }, result);
  };

  deleteJobSector = async (req, res, next) => {
    const result = await JobModel.getSector({ id: req.params.job_sector_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    await JobModel.deleteJobSector(req.params.job_sector_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_sector' });
  };

  newJob = async (req, res, next) => {
    const job = await JobModel.createJob(req.body, req.currentUser);

    if (job.status === 200) {
      const followers = await UserModel.getFollowers(req.currentUser);

      for (let follower of followers) {
        const notificationBody = {
          user_id: follower.candidate_id,
          acted_user_id: req.currentUser.id,
          notification_trigger: 'new job',
          notification_type: 'job',
          notification_type_id: job.data.job_id
        };

        await UserController.createNotification(notificationBody);
      }
    }

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_job' }, job);
  }

  updateJob = async (req, res, next) => {
    if (req.currentUser.role === 'candidate') {
      throw new AppError(403, "403_unknownError");
    }

    const getJobResult = await JobModel.getJob({ id: req.params.job_id });

    if (Object.keys(getJobResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const job = getJobResult[0];

    if (!job) {
      throw new AppError(403, "403_unknownError");
    }

    if (req.currentUser.role !== 'admin' && (req.currentUser.role === 'employer' && job.user_id != req.currentUser.id)) {
      throw new AppError(403, "403_unknownError");
    }

    if (req.params.job_id != req.body.id) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await JobModel.updateJob(req.body);

    if (result) {
      const updatedJob = (await JobModel.getJob({ id: req.params.job_id }))[0];

      const websiteUrl = process.env.WEBSITE_URL;
      const user = await UserModel.findOne({ id: updatedJob.user_id });
      const emailBody = `Dear ${user.display_name},

The posted job "<a href='${websiteUrl}/jobs/details/${updatedJob.slug}'>${updatedJob.title}</a>" has been updated.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Job Update</strong>
Job Title&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${updatedJob.title}
Job Type&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${jobTypes[updatedJob.job_type]}
Industry&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${updatedJob.job_industry}
Post Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${new Date(updatedJob.created_at).toLocaleDateString(undefined, dateOptions)}
Expiry Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${new Date(updatedJob.deadline).toLocaleDateString(undefined, dateOptions)}

Best regards,

Black Directory`;

      const mailOptions = {
        to: user.email,
        subject: 'Black Directory - Job Update',
        body: emailBody,
      }

      mailHandler.sendEmail(mailOptions);

      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_job' }, result);
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getJobs = async (req, res, next) => {
    const result = await JobModel.getJobs(req.body, req.query.page, req.query.limit);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, result);
  };

  getJobCount = async (req, res, next) => {
    const result = await JobModel.getJobCount(req.body);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, result[0]);
  };

  updateJobProperty = async (req, res, next) => {
    if (req.currentUser.role === 'candidate') {
      throw new AppError(403, "403_unknownError");
    }

    const getJobResult = await JobModel.getJob({ id: req.params.job_id });

    if (Object.keys(getJobResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const job = getJobResult[0];

    if (!job) {
      throw new AppError(403, "403_unknownError");
    }

    if (req.currentUser.role !== 'admin' && (req.currentUser.role === 'employer' && job.user_id != req.currentUser.id)) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await JobModel.updateJobProperty(req.params.job_id, req.body);

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_job' }, result);
  };

  getUserJobs = async (req, res, next) => {
    let body = {};

    if (req.currentUser.role !== 'admin') {
      body = { 'Job.user_id': req.currentUser.id };
    }

    const result = await JobModel.getUserJobs(body);

    result.forEach(job => {
      job.featured = !!job.featured;
      job.filled = !!job.filled;
    });

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, result);
  };

  getJob = async (req, res, next) => {
    const result = await JobModel.getJob({ slug: req.params.job_slug });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const job = result[0];

    if (!req.currentUser || (req.currentUser && req.currentUser.id != job.user_id)) {
      await JobModel.updateJobProperty(job.id, { views: job.views + 1 });
    }

    job.featured = !!job.featured;
    job.filled = !!job.filled;
    job.urgent = !!job.urgent;

    const user = await UserModel.findOne({ id: job.user_id });
    const { password, ...userDetails } = user;

    const sector = await JobModel.getSector({ id: job.job_sector_id });

    job['user'] = userDetails;
    job['job_sector'] = sector[0].title;

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, job);
  };

  getUserJob = async (req, res, next) => {
    const result = await JobModel.getJob({ id: req.params.job_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const job = result[0];

    if (req.currentUser.role !== 'admin' && job.user_id != req.currentUser.id) {
      throw new AppError(403, "403_unknownError");
    }

    job.featured = !!job.featured;
    job.filled = !!job.filled;
    job.urgent = !!job.urgent;

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, job);
  };

  deleteJob = async (req, res, next) => {
    const getJobResult = await JobModel.getJob({ id: req.params.job_id });

    if (Object.keys(getJobResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const job = getJobResult[0];
    if (req.currentUser.role !== 'admin' && (req.currentUser.role === 'employer' && job.user_id != req.currentUser.id)) {
      throw new AppError(403, "403_unknownError");
    }

    await JobModel.deleteJob(req.params.job_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_job' });
  };

  newJobApplication = async (req, res, next) => {
    const jobApplication = await JobModel.createJobApplication(req.body, req.currentUser);

    if (jobApplication.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    const notificationBody = {
      user_id: req.body.employer_id,
      acted_user_id: req.currentUser.id,
      notification_trigger: 'new job application',
      notification_type: 'job',
      notification_type_id: req.body.job_id
    };

    await UserController.createNotification(notificationBody);

    // send email to candidate
    const candidate = (await UserModel.getUserDetailsByID({ id: req.currentUser.id })).data;
    const employer = (await UserModel.getUserDetailsByID({ id: req.body.employer_id })).data;
    const job = (await JobModel.getJobsByIds([req.body.job_id]))[0];

    const websiteUrl = process.env.WEBSITE_URL;

    const mailOptions = {
      to: req.currentUser.email,
      subject: 'Black Directory - Job Application',
      body: `Hi ${candidate.display_name},

This is to confirm your job application for '<a href="${websiteUrl}/jobs/details/${job.slug}">${job.title}</a>' has been submitted to '<a href="${websiteUrl}/user-details/${employer.username}">${employer.display_name}</a>'.

Best wishes,

Black Directory`,
    }

    mailHandler.sendEmail(mailOptions);

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_jobApplication' });
  }

  getJobApplications = async (req, res, next) => {
    let params = {};
    if (req.currentUser.role !== 'admin') {
      params = { employer_id: req.currentUser.id };
    }

    if (req.params.job_id) {
      params['job_id'] = req.params.job_id;
    }

    let result = await JobModel.getJobApplications(params);

    if (result && result.length > 0) {
      result = result.map((application) => {
        const processedApplication = {};

        for (const key in application) {
          if (key.startsWith('user_')) {
            const userKey = key.substring(5);

            if (!processedApplication['user']) {
              processedApplication['user'] = {};
            }

            processedApplication['user'][userKey] = application[key];
          } else if (key.startsWith('job_')) {
            const jobKey = key.substring(4);

            if (!processedApplication['job']) {
              processedApplication['job'] = {};
            }

            processedApplication['job'][jobKey] = application[key];
          } else {
            processedApplication[key] = application[key];
          }
        }

        processedApplication.rejected = !!processedApplication.rejected;
        processedApplication.shortlisted = !!processedApplication.shortlisted;
        processedApplication.viewed = !!processedApplication.viewed;

        return processedApplication;
      });
    }

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job_application' }, result);
  };

  getUserJobApplication = async (req, res, next) => {
    let body = { job_id: req.params.job_id };

    if (req.currentUser.role !== 'admin') {
      body['user_id'] = req.currentUser.id;
    }

    const result = await JobModel.getUserJobApplication(body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job_application' }, result);
  };

  updateJobApplication = async (req, res, next) => {
    if (req.currentUser.role === 'candidate') {
      throw new AppError(403, "403_unknownError");
    }

    if (!req.body || Object.keys(req.body).length == 0) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await JobModel.updateJobApplication(req.params.application_id, req.body);

    if (result) {
      if (req.body.shortlisted || req.body.rejected) {
        const application = await JobModel.getJobApplication(req.params.application_id);

        const notificationBody = {
          user_id: application[0].user_id,
          acted_user_id: application[0].employer_id,
          notification_trigger: req.body.shortlisted ? 'shortlisted' : 'rejected',
          notification_type: 'job',
          notification_type_id: application[0].job_id
        };

        await UserController.createNotification(notificationBody);
      }

      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_job_application' });
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getAppliedJobs = async (req, res, next) => {
    const resultInternal = await JobModel.getAppliedJobs({ 'Applications.user_id': req.currentUser.id, 'Jobs.job_apply_type': 'internal' });
    const resultEmail = await JobModel.getAppliedJobs({ 'Applications.user_id': req.currentUser.id, 'Jobs.job_apply_type': 'with_email' });

    const result = {
      internal: resultInternal,
      email: resultEmail,
    };

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job_application' }, result);
  };

  saveCandidate = async (req, res, next) => {
    await JobModel.saveCandidate(req.body, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  }

  getSavedCandidates = async (req, res, next) => {
    const result = await JobModel.getSavedCandidates(req.currentUser);

    new AppSuccess(res, 200, "200_successful", null, result);
  };

  deleteSavedCandidate = async (req, res, next) => {
    await JobModel.deleteSavedCandidate(req.params.candidate_id, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  };

  saveFavoriteJob = async (req, res, next) => {
    await JobModel.saveFavoriteJob(req.body, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  }

  getFavoriteJobs = async (req, res, next) => {
    const result = await JobModel.getFavoriteJobs(req.currentUser);

    new AppSuccess(res, 200, "200_successful", null, result);
  };

  deleteFavoriteJob = async (req, res, next) => {
    await JobModel.deleteFavoriteJob(req.params.job_id, req.currentUser);

    new AppSuccess(res, 200, "200_successful");
  };

  getJobPackages = async (req, res, next) => {
    const packages = await JobModel.getJobPackages();
    const packagePrices = await JobModel.getJobPackagePrices();

    for (const jobPackage of packages) {
      jobPackage['prices'] = packagePrices
        .filter((price) => price.package_id == jobPackage.id)
        .sort((price1, price2) => price2.validity - price1.validity);
    }

    new AppSuccess(res, 200, "200_successful", null, packages);
  };

  getCurrentPackage = async (req, res, next) => {
    const currentPackage = await JobModel.getCurrentPackage(req.currentUser);

    new AppSuccess(res, 200, "200_successful", null, currentPackage);
  };

  createStripeCheckoutSession = async (req, res, next) => {
    const jobPackage = await JobModel.getJobPackage(req.body.packageId);
    const packagePrice = await JobModel.getJobPackagePrice(req.body.priceId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: parseFloat(packagePrice.price) * 100,
            product_data: {
              name: `${jobPackage.title} - ${packagePrice.validity} Month`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.body.returnUrl}?success=true`,
      cancel_url: `${req.body.returnUrl}?success=false`,
      metadata: {
        'type': 'job',
        'packageId': jobPackage.id,
        'priceId': packagePrice.id,
        'validity': packagePrice.validity,
        'userId': req.currentUser.id
      }
    });

    new AppSuccess(res, 200, "200_successful", null, session);
  };

  newJobAlert = async (req, res, next) => {

    // check if alert with same criteria already exists
    const params = Object.fromEntries(Object.entries(req.body).filter(([key, val]) => val != null));  // remove salary if it's null
    const alert = await JobModel.findOne(params, commonfn.DBTables.job_alerts);

    if (alert && Object.keys(alert).length > 0) {
      throw new AppError(403, "Alert with the same criteria already exists");
    }

    const result = await JobModel.createJobAlert(req.body);

    if (result.affectedRows && result.affectedRows > 0) {
      new AppSuccess(res, 200, "Alert created successfully");
    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  }

  unsubscribeJobAlert = async (req, res, next) => {

    const result = await JobModel.unsubscribeJobAlert(req.body);

    if (!result) {
      throw new AppError(403, "403_unknownError");
    }

    new AppSuccess(res, 200, "200_successful");

  }

  sendJobAlert = async (req, res, next) => {

    const allAlerts = await JobModel.find({}, commonfn.DBTables.job_alerts);

    const current_time = commonfn.dateTimeNow();

    const periods = {
      1: '24hours',
      7: '7days',
      14: '14days',
      30: '30days'
    }

    for (let index = 0; index < allAlerts.length; index++) {
      const element = allAlerts[index];
      const last_sent_at = commonfn.dateTime(element.last_sent_at)

      const date1 = new Date(last_sent_at);
      const date2 = new Date(current_time);

      const Difference_In_Time = date2.getTime() - date1.getTime();
      const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

      if (Difference_In_Days > element.period) {
        // fetch the jobs 
        const params = {
          datePosted: periods[element.period],
          jobType: element.type,
          keyword: element.keyword,
          sector: element.sector
        }
        if (element.salary) {
          params.salaryMin = (parseInt(element.salary) - 200) > 0 ? (parseInt(element.salary) - 200) : 0;
          params.salaryMax = parseInt(element.salary) + 200;
        }

        const jobs = await JobModel.getAlertJobs(params);
        allAlerts[index]['jobs'] = jobs;

        // send email only when jobs are available
        if (jobs.length > 0) {

        }
      }

    }

    new AppSuccess(res, 200, "200_successful", '', allAlerts);
  }

  jobExpiryMail = async (req, res, next) => {
    const jobsExpiredToday = await JobModel.getJobsExpiredToday();
    const websiteUrl = process.env.WEBSITE_URL;

    for (const job of jobsExpiredToday) {
      const emailBody = `Dear ${job.user_display_name},

The posted job "<a href='${websiteUrl}/jobs/details/${job.slug}'>${job.title}</a>" has expired. Please kindly review the details on your <a href='${websiteUrl}/dashboard/profile'>Account</a>.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Job Expiry</strong>
Job Title&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${job.title}
Job Type&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${jobTypes[job.job_type]}
Industry&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${job.job_industry}
Post Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${new Date(job.created_at).toLocaleDateString(undefined, dateOptions)}
Expiry Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${new Date(job.deadline).toLocaleDateString(undefined, dateOptions)}

Best regards,

Black Directory`;
  
      const mailOptions = {
        to: job.user_email,
        subject: 'Black Directory - Job Expiry',
        body: emailBody,
      }

      mailHandler.sendEmail(mailOptions);
    }
    
    new AppSuccess(res, 200, "200_successful", '', jobsExpiredToday);
  }
}

module.exports = new JobController();

