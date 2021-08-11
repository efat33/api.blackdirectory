const MobilesModel = require("../models/mobiles-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const dotenv = require("dotenv");
dotenv.config();

class MobilesController {
  newMobile = async (req, res, next) => {
    const mobile = await MobilesModel.createMobile(req.body);

    if (mobile.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_mobile' }, mobile);
  }

  updateMobile = async (req, res, next) => {
    const getMobileResult = await MobilesModel.getMobile({ 'Mobile.id': req.params.mobile_id });

    if (Object.keys(getMobileResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const mobile = getMobileResult[0];

    if (!mobile) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await MobilesModel.updateMobile(req.params.mobile_id, req.body);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_mobile' }, result);
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getMobiles = async (req, res, next) => {
    const result = await MobilesModel.getMobiles(req.query, req.query.page, req.query.limit);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_mobile' }, result);
  };

  getMobile = async (req, res, next) => {
    const result = await MobilesModel.getMobile({ 'Mobile.id': req.params.mobile_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Mobile not found");
    };

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_mobile' }, result);
  };

  deleteMobile = async (req, res, next) => {
    const result = await MobilesModel.getMobile({ 'Mobile.id': req.params.mobile_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Mobile not found")
    };

    await MobilesModel.deleteMobile(req.params.mobile_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_mobile' });
  };

  getTopMobiles = async (req, res, next) => {
    const result = await MobilesModel.getTopMobiles();

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_mobile' }, result);
  };

  getMobilesProviders = async (req, res, next) => {
    const result = await MobilesModel.getMobilesProviders();

    new AppSuccess(res, 200, "200_successful", { 'entity': 'entity_provider' }, result);
  };

  newMobilesProvider = async (req, res, next) => {
    const mobilesProvider = await MobilesModel.createMobilesProvider(req.body);

    if (mobilesProvider.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_provider' });
  }

  updateMobilesProvider = async (req, res, next) => {
    const result = await MobilesModel.updateMobilesProvider(req.params.provider_id, req.body);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_provider' }, result);
  };

  deleteMobilesProvider = async (req, res, next) => {
    const result = await MobilesModel.getMobilesProvider(req.params.provider_id);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    await MobilesModel.deleteMobilesProvider(req.params.provider_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_provider' });
  };

}

module.exports = new MobilesController();
