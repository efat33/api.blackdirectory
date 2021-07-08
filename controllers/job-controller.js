const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const nodemailer = require('nodemailer');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
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

        if (req.currentUser.role === 'employer' && job.user_id != req.currentUser.id) {
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

    getUserJobs = async (req, res, next) => {
        const result = await JobModel.getUserJobs({ 'Job.user_id': req.currentUser.id });

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

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

        job.featured = !!job.featured;
        job.filled = !!job.filled;
        job.urgent = !!job.urgent;

        const user = await UserModel.findOne({id: job.user_id});
        const { password, ...userDetails } = user;

        const sector = await JobModel.getSector({id: job.job_sector_id});

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

        if (job.user_id != req.currentUser.id) {
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

        await JobModel.deleteJob(req.params.job_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_job' });
    };

    newJobApplication = async (req, res, next) => {
        const jobApplication = await JobModel.createJobApplication(req.body, req.currentUser);

        if (jobApplication.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_jobApplication' });
    }

    getUserJobApplication = async (req, res, next) => {
        const result = await JobModel.getUserJobApplication({ job_id: req.params.job_id, user_id: req.currentUser.id });

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_job_application' }, result);
    };
}

module.exports = new JobController();

