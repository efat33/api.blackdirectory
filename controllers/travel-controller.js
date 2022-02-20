const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const NewsModel = require('../models/news-model');
const TravelModel = require('../models/travel-model');

class TravelController {
    newTravel = async (req, res, next) => {
        const travel = await TravelModel.createTravel(req.body);
        
        if (travel.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_travel' }, travel);
    }

    updateTravel = async (req, res, next) => {
        const getTravelResult = await TravelModel.getSingleTravel({ 'id': req.params.travel_id });

        if (Object.keys(getTravelResult).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        const travel = getTravelResult[0];

        if (!travel) {
            throw new AppError(403, "403_unknownError");
        }

        const result = await TravelModel.updateTravel(req.params.travel_id, req.body);

        if (result) {
            new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_travel' }, result);
        }
        else {
            throw new AppError(403, "403_unknownError");
        }
    }

    getTravels = async (req, res, next) => {
        const result = await TravelModel.getTravels(req.body, req.body.page, req.body.limit);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_travel' }, result);
    };

    getSingleTravel = async (req, res, next) => {
        let body = {};

        if (isNaN(req.params.travel_id)) {
            body = { 'slug': req.params.travel_id }
        } else {
            body = { 'id': req.params.travel_id }
        }

        const result = await TravelModel.getSingleTravel(body);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_travel' }, result);
    };

    deleteTravel = async (req, res, next) => {
        const result = await TravelModel.getSingleTravel({ 'id': req.params.travel_id });

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        await TravelModel.deleteTravel(req.params.travel_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_travel' });
    };

    
}

module.exports = new TravelController();

