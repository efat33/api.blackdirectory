const PagesModel = require("../models/pages-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const dotenv = require("dotenv");
dotenv.config();

class PagesController {
  newPage = async (req, res, next) => {
    const page = await PagesModel.createPage(req.body);

    if (page.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_page' }, page);
  }

  updatePage = async (req, res, next) => {
    const getPageResult = await PagesModel.getPage({ 'slug': req.params.page_slug });

    if (Object.keys(getPageResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const page = getPageResult[0];

    if (!page) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await PagesModel.updatePage(req.params.page_slug, req.body);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_page' }, result);
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getPages = async (req, res, next) => {
    const result = await PagesModel.getPages(req.query);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_page' }, result);
  };

  getPage = async (req, res, next) => {
    const result = await PagesModel.getPage({ 'slug': req.params.page_slug });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Page not found");
    };

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_page' }, result);
  };

  deletePage = async (req, res, next) => {
    const result = await PagesModel.getPage({ 'slug': req.params.page_slug });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Page not found")
    };

    await PagesModel.deletePage(req.params.page_slug);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_page' });
  };

  newFaq = async (req, res, next) => {
    const page = await PagesModel.createFaq(req.body);

    if (page.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_page' }, page);
  }

  updateFaq = async (req, res, next) => {
    const getFaqResult = await PagesModel.getFaq({ 'id': req.params.faq_id });

    if (Object.keys(getFaqResult).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    const page = getFaqResult[0];

    if (!page) {
      throw new AppError(403, "403_unknownError");
    }

    const result = await PagesModel.updateFaq(req.params.faq_id, req.body);

    if (result) {
      new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_page' }, result);
    }
    else {
      throw new AppError(403, "403_unknownError");
    }
  }

  getFaqs = async (req, res, next) => {
    const result = await PagesModel.getFaqs(req.query);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_page' }, result);
  };

  getFaq = async (req, res, next) => {
    const result = await PagesModel.getFaq({ 'id': req.params.faq_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Faq not found");
    };

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_page' }, result);
  };

  deleteFaq = async (req, res, next) => {
    const result = await PagesModel.getFaq({ 'id': req.params.faq_id });

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "Faq not found")
    };

    await PagesModel.deleteFaq(req.params.faq_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_page' });
  };
}

module.exports = new PagesController();
