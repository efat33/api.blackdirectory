const ListingModel = require("../models/listing-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();

class ListingController {

  checkValidation = (req) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      throw new AppError(400, "400_paramMissingGeneral", null, errors);
    }
  };

  newListing = async (req, res, next) => {
    // check primary validation set in listingValidator.js
    this.checkValidation(req);
    // console.log(req.body.restaurants[0]);
    // return;
    const result = await ListingModel.createListing(req.body, req.currentUser);
  
    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added", {'entity': 'entity_listing'}, result.data);

    }
    else{
      throw new AppError(403, "403_unknownError");
    }
 
  };

  searchListing = async (req, res, next) => {

    
    const result = await ListingModel.searchListing(req.body);
  
    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_detailFound", {'entity': 'entity_listing'}, result.data);

    }
    else{
      throw new AppError(403, "403_unknownError");
    }
 
  };

  getListing = async (req, res, next) => {
    
    const result = await ListingModel.getListing(req.params);

    if(Object.keys(result).length === 0) throw new AppError(403, "403_unknownError");
  
    new AppSuccess(res, 200, "200_detailFound", {'entity': 'entity_listing'}, result);

 
  };

  publishListing = async (req, res, next) => {

    
    const result = await ListingModel.publishListing(req.body);
  
    if (result) {

      new AppSuccess(res, 200, "Published Successfully");

    }
    else{
      throw new AppError(403, "403_unknownError");
    }
 
  };

  

}

module.exports = new ListingController();
