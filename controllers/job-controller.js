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
}

module.exports = new JobController();

