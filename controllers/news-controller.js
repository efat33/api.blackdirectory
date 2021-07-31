const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const NewsModel = require('../models/news-model');

class NewsController {
    newNews = async (req, res, next) => {
        const news = await NewsModel.createNews(req.body);
        
        if (news.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_news' }, news);
    }

    updateNews = async (req, res, next) => {
        const getNewsResult = await NewsModel.getSingleNews({ 'News.id': req.params.news_id });

        if (Object.keys(getNewsResult).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        const news = getNewsResult[0];

        if (!news) {
            throw new AppError(403, "403_unknownError");
        }

        const result = await NewsModel.updateNews(req.params.news_id, req.body);

        if (result) {
            new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_news' }, result);
        }
        else {
            throw new AppError(403, "403_unknownError");
        }
    }

    getNews = async (req, res, next) => {
        const result = await NewsModel.getNews(req.body, req.query.page, req.query.limit);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_news' }, result);
    };

    getSingleNews = async (req, res, next) => {
        const result = await NewsModel.getSingleNews({ 'News.id': req.params.news_id });

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_news' }, result);
    };

    deleteNews = async (req, res, next) => {
        const result = await NewsModel.getSingleNews({ 'News.id': req.params.news_id });

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        await NewsModel.deleteNews(req.params.news_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_category' });
    };

    getNewsCategories = async (req, res, next) => {
        const result = await NewsModel.getNewsCategories();

        new AppSuccess(res, 200, "200_successful", { 'entity': 'entity_category' }, result);
    };

    newNewsCategory = async (req, res, next) => {
        const newsCategory = await NewsModel.createNewsCategory(req.body);

        if (newsCategory.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_category' });
    }

    updateNewsCategory = async (req, res, next) => {
        const result = await NewsModel.updateNewsCategory(req.params.category_id, req.body);

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_category' }, result);
    };

    deleteNewsCategory = async (req, res, next) => {
        const result = await NewsModel.getNewsCategory(req.params.category_id);

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        await NewsModel.deleteNewsCategory(req.params.category_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_category' });
    };

    getTopNews = async (req, res, next) => {
        const result = await NewsModel.getTopNews();

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_news' }, result);
    };

    updateTopNews = async (req, res, next) => {
        if (!req.body) {
            throw new AppError(403, "403_unknownError")
        };

        const result = await NewsModel.updateTopNews(req.body);

        new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_news' }, result);
    };
}

module.exports = new NewsController();

