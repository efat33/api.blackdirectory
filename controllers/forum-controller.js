const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const NewsModel = require('../models/news-model');
const ForumModel = require('../models/forum-model');
const TopicModel = require('../models/topic-model');
const ReplyModel = require('../models/reply-model');

class ForumController {
    newForum = async (req, res, next) => {

        if (!req.body.title) {
            throw new AppError(403, "Title is required");
        }
        if (!req.body.status) {
            throw new AppError(403, "Status is required");
        }
        if (!req.body.description) {
            throw new AppError(403, "Description is required");
        }

        const forum = await ForumModel.createForum(req.body, req.currentUser);
        
        if (forum.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_forum' }, forum);
    }

    updateForum = async (req, res, next) => {

        const forum = await ForumModel.findOne({'id': req.params.forum_id});
        if (Object.keys(forum).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster' && req.currentUser.id != forum.user_id) {
            throw new AppError(401, "401_notUpdateForum")
        }

        const result = await ForumModel.updateForum(req.params.forum_id, req.body);

        if (result.affectedRows == 1) {
            new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_forum' }, result);
        }
        else {
            throw new AppError(403, "403_unknownError");
        }
    }

    getForums = async (req, res, next) => {
        const result = await ForumModel.getForums(req.body);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_forum' }, result);
    };

    getSingleForum = async (req, res, next) => {
        let params = {};

        if (isNaN(req.params.forum_id)) {
            params = { 'slug': req.params.forum_id }
        } else {
            params = { 'id': req.params.forum_id }
        }

        const result = await ForumModel.findOne(params);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_forum' }, result);
    };

    deleteNews = async (req, res, next) => {
        const result = await NewsModel.getSingleNews({ 'News.id': req.params.news_id });

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        await NewsModel.deleteNews(req.params.news_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_category' });
    };


    /**
     * ******************************
     * */ 

    newTopic = async (req, res, next) => {

        if (!req.body.title) {
            throw new AppError(403, "Title is required");
        }
        if (!req.body.status) {
            throw new AppError(403, "Status is required");
        }
        if (!req.body.forum_id) {
            throw new AppError(403, "Forum ID is required");
        }

        const forum = await TopicModel.createTopic(req.body, req.currentUser);
        
        if (forum.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_topic' }, forum);
    }

    getTopics = async (req, res, next) => {
        const result = await TopicModel.getTopics(req.body);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_topic' }, result);
    };

    getSingleTopic = async (req, res, next) => {
        let params = {};

        if (isNaN(req.params.topic_id)) {
            params = { 'slug': req.params.topic_id }
        } else {
            params = { 'id': req.params.topic_id }
        }

        const result = await TopicModel.findOne(params);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_topic' }, result);
    };

    updateTopic = async (req, res, next) => {

        const topic = await TopicModel.findOne({'id': req.params.topic_id});
        if (Object.keys(topic).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster'  && req.currentUser.forum_role != 'moderator' && req.currentUser.id != topic.user_id) {
            throw new AppError(401, "401_notUpdateTopic")
        }

        const result = await TopicModel.updateTopic(req.params.topic_id, req.body);

        if (result.affectedRows == 1) {
            new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_topic' }, result);
        }
        else {
            throw new AppError(403, "403_unknownError");
        }
    }


    /**
     * ******************************
     * */ 

    getReplies = async (req, res, next) => {
        const result = await ReplyModel.getReplies(req.body);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_reply' }, result);
    };

    newReply = async (req, res, next) => {

        if (!req.body.content) {
            throw new AppError(403, "Content is required");
        }
        if (!req.body.topic_id) {
            throw new AppError(403, "Topic ID is required");
        }
        
        const forum = await ReplyModel.createReply(req.body, req.currentUser);
        
        if (forum.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_reply' }, forum);
    }

    getSingleReply = async (req, res, next) => {
        let params = {};

        if (isNaN(req.params.reply_id)) {
            params = { 'slug': req.params.reply_id }
        } else {
            params = { 'id': req.params.reply_id }
        }

        const result = await ReplyModel.findOne(params);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_reply' }, result);
    };

    updateReply = async (req, res, next) => {

        const reply = await ReplyModel.findOne({'id': req.params.reply_id});
        if (Object.keys(reply).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster'  && req.currentUser.forum_role != 'moderator' && req.currentUser.id != reply.user_id) {
            throw new AppError(401, "401_notUpdateReply")
        }

        const result = await ReplyModel.updateReply(req.params.reply_id, req.body);

        if (result.affectedRows == 1) {
            new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_reply' }, result);
        }
        else {
            throw new AppError(403, "403_unknownError");
        }
    }

}

module.exports = new ForumController();

