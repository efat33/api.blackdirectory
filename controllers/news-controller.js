const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const NewsModel = require('../models/news-model');

class NewsController {
    newNews = async (req, res, next) => {
        const news = await NewsModel.createNews(req.body, req.currentUser);

        if (news.status === 200) {
            const followers = await UserModel.getFollowers(req.currentUser);

            for (let follower of followers) {
                const notificationBody = {
                    user_id: follower.candidate_id,
                    acted_user_id: req.currentUser.id,
                    notification_trigger: 'new news',
                    notification_type: 'news',
                    notification_type_id: news.data.news_id
                };

                await UserController.createNotification(notificationBody);
            }
        }

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_news' }, news);
    }

    updateNews = async (req, res, next) => {
        if (req.currentUser.role === 'candidate') {
            throw new AppError(403, "403_unknownError");
        }

        const getNewsResult = await NewsModel.getNews({ id: req.params.news_id });

        if (Object.keys(getNewsResult).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        const news = getNewsResult[0];

        if (!news) {
            throw new AppError(403, "403_unknownError");
        }

        if (req.currentUser.role === 'employer' && news.user_id != req.currentUser.id) {
            throw new AppError(403, "403_unknownError");
        }

        if (req.params.news_id != req.body.id) {
            throw new AppError(403, "403_unknownError");
        }

        const result = await NewsModel.updateNews(req.body);

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
}

module.exports = new NewsController();

