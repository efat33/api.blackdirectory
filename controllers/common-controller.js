const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');
const CommonModel = require('../models/common-model');

class CommonController {
    getHeroSlides = async (req, res, next) => {
        const result = await CommonModel.getHeroSlides();

        new AppSuccess(res, 200, "200_successful", '', result);
    };

    newHeroSlide = async (req, res, next) => {
        const heroSlides = await CommonModel.createHeroSlide(req.body);
    
        if (heroSlides.status !== 200) {
          throw new AppError(403, "403_unknownError")
        };
    
        new AppSuccess(res, 200, "200_added");
    }

    updateHeroSlide = async (req, res, next) => {
        const result = await CommonModel.updateHeroSlide(req.params.slide_id, req.body);
    
        if (Object.keys(result).length === 0) {
          throw new AppError(403, "403_unknownError")
        };
    
        new AppSuccess(res, 200, "200_updated", '', result);
    };

    deleteHeroSlide = async (req, res, next) => {
        const result = await CommonModel.findOne({id: req.params.slide_id}, DBTables.hero_slider);
        if (Object.keys(result).length === 0) {
          throw new AppError(403, "403_unknownError")
        };
    
        await CommonModel.deleteHeroSlide(req.params.slide_id);
    
        new AppSuccess(res, 200, "200_deleted");
    };

}

module.exports = new CommonController();

