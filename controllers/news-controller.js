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
        const getNewsResult = await NewsModel.getSingleNews({ 'id': req.params.news_id });

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
        let body = {};

        if (isNaN(req.params.news_id)) {
            body = { 'slug': req.params.news_id }
        } else {
            body = { 'id': req.params.news_id }
        }

        const result = await NewsModel.getSingleNews(body);

        if (result.length) {
            // process comments and replies

            const comments = result[0].comments;
            for (let comment of comments) {
                comment.replies = comments.filter(com => com.parent_id === comment.id);
            }

            result[0].comments = comments.filter(com => com.parent_id == null);
        }

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_news' }, result);
    };

    deleteNews = async (req, res, next) => {
        const result = await NewsModel.getSingleNews({ 'id': req.params.news_id });

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

    getNewsCategoriesList = async (req, res, next) => {
        const result = await NewsModel.find({}, commonfn.DBTables.news_categories, 'ORDER BY name ASC')

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

    newNewsComment = async (req, res, next) => {
        const newsComment = await NewsModel.createNewsComment(req.body, req.currentUser);

        if (newsComment.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_comment' }, newsComment.data);
    }

    deleteNewsComment = async (req, res, next) => {
        const result = await NewsModel.getNewsComment(req.params.comment_id);

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        if (result[0].user_id !== req.currentUser.id) {
            throw new AppError(403, "403_unknownError")
        }

        await NewsModel.deleteNewsComment(req.params.comment_id, result[0].news_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_comment' });
    };

    updateNewsComment = async (req, res, next) => {
        if (!req.body) {
            throw new AppError(403, "403_unknownError")
        };

        const result = await NewsModel.updateNewsComment(req.params.comment_id, req.body.comment);

        new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_comment' }, result);
    };

    getUserCommentLikes = async (req, res, next) => {
        const result = await NewsModel.getUserCommentLikes(req.params.user_id);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_comment' }, result);
    };

    updateNewsCommentLike = async (req, res, next) => {
        if (!req.body) {
            throw new AppError(403, "403_unknownError")
        };

        await NewsModel.updateNewsCommentLike(req.body);

        new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_comment' });
    };
}

module.exports = new NewsController();

