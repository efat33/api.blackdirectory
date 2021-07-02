const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const nodemailer = require('nodemailer');
const JobModel = require('../models/job-model');
const dotenv = require("dotenv");
dotenv.config();

class JobController {
  sectors = async (req, res, next) => {
    const sectors = await JobModel.getSectors();

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_sectors' }, sectors);
  }

  newJob = async (req, res, next) => {
    const job = await JobModel.createJob(req.body, req.currentUser);

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_job' }, job);
  }

  getJobs = async (req, res, next) => {
    const result = await JobModel.getJobs();

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, result);
  };

  getUserJobs = async (req, res, next) => {
    const result = await JobModel.getJobs({ 'Job.user_id': req.currentUser.id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    result.forEach(job => {
      job.featured = !!job.featured;
      job.filled = !!job.filled;
    });

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job' }, result);
  };
}

module.exports = new JobController();

