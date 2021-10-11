const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const DealsModel = require('../models/deals-model');

class DealController {
  newDeal = async (req, res, next) => {
    const deal = await DealsModel.createDeal(req.body);

    if (deal.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_deal' }, deal);
  }

  updateDeal = async (req, res, next) => {
    const getDealResult = await DealsModel.getDeal({ 'Deal.id': req.params.deal_id });

    if (Object.keys(getDealResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const deal = getDealResult[0];

    if (!deal) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await DealsModel.updateDeal(req.params.deal_id, req.body);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_deal' });
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getDeals = async (req, res, next) => {
    const result = await DealsModel.getDeals(req.body, req.query.page, req.query.limit);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_deals' }, result);
  };

  getDealCount = async (req, res, next) => {
    const result = await DealsModel.getDeals(req.body, null, null, true);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_deals' }, result);
  };

  getDeal = async (req, res, next) => {
    let body = {};

    if (isNaN(req.params.deal_id)) {
      body = { 'Deal.slug': req.params.deal_id }
    } else {
      body = { 'Deal.id': req.params.deal_id }
    }

    const result = await DealsModel.getDeal(body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_deal' }, result);
  };

  deleteDeal = async (req, res, next) => {
    const result = await DealsModel.getDeal({ 'Deal.id': req.params.deal_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    await DealsModel.deleteDeal(req.params.deal_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_deal' });
  };

  getDealers = async (req, res, next) => {
    const result = await DealsModel.getDealers();

    new AppSuccess(res, 200, "200_successful", { 'entity': 'entity_dealers' }, result);
  };

  newDealer = async (req, res, next) => {
    const newsCategory = await DealsModel.createDealer(req.body);

    if (newsCategory.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_dealer' });
  }

  updateDealer = async (req, res, next) => {
    const result = await DealsModel.updateDealer(req.params.dealer_id, req.body);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_dealer' }, result);
  };

  deleteDealer = async (req, res, next) => {
    const result = await DealsModel.getDealer(req.params.dealer_id);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    await DealsModel.deleteDealer(req.params.dealer_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_dealer' });
  };
}

module.exports = new DealController();

