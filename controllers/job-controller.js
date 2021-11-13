const dotenv = require("dotenv");
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_TEST_SECRET_KEY);
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const nodemailer = require('nodemailer');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
const UserController = require('../controllers/user-controller');

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
    let body = {job_id: req.params.job_id};
    
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
}

module.exports = new JobController();

