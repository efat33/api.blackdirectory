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

    new AppSuccess(res, 200, "200_detailFound", {'entity': 'entity_sectors'}, sectors );
 
  }



  


}

module.exports = new JobController();
