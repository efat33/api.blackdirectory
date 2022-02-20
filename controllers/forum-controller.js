const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const { DBTables } = require('../utils/common');
const NewsModel = require('../models/news-model');
const ForumModel = require('../models/forum-model');
const TopicModel = require('../models/topic-model');
const ReplyModel = require('../models/reply-model');
const mailHandler = require('../utils/mailHandler.js');

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

    const forum = await ForumModel.findOne({ 'id': req.params.forum_id });
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

  deleteForum = async (req, res, next) => {
    const forum = await ForumModel.findOne({ 'id': req.params.forum_id });

    if (Object.keys(forum).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster' && req.currentUser.id != forum.user_id) {
      throw new AppError(401, "401_unauthorised")
    }

    await ForumModel.deleteForum(forum);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_forum' });
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

    const topic = await TopicModel.findOne({ 'id': req.params.topic_id });
    if (Object.keys(topic).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster' && req.currentUser.forum_role != 'moderator' && req.currentUser.id != topic.user_id) {
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
  deleteTopic = async (req, res, next) => {
    const topic = await TopicModel.findOne({ 'id': req.params.topic_id });

    if (Object.keys(topic).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster' && req.currentUser.forum_role != 'moderator' &&
      req.currentUser.id != topic.user_id) {
      throw new AppError(401, "401_unauthorised")
    }

    await TopicModel.deleteTopic(topic);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_topic' });
  };


  /**
   * ******************************
   * */

  getReplies = async (req, res, next) => {
    const result = await ReplyModel.getReplies(req.body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_reply' }, result);
  };

  getUserReplies = async (req, res, next) => {
    const result = await ReplyModel.getUserReplies(req.body);

    new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_reply' }, result);
  };

  newReply = async (req, res, next) => {

    if (!req.body.content) {
      throw new AppError(403, "Content is required");
    }
    if (!req.body.topic_id) {
      throw new AppError(403, "Topic ID is required");
    }
    if (!req.body.forum_id) {
      throw new AppError(403, "Forum ID is required");
    }

    const reply = await ReplyModel.createReply(req.body, req.currentUser);

    if (reply.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    const replyNotifications = await ReplyModel.getReplyNotifications(req.body.topic_id);

    let websiteUrl;
    if (process.env.NODE_ENV === 'development') {
      websiteUrl = 'http://localhost:4200';
    } else {
      websiteUrl = 'https://blackdir.mibrahimkhalil.com';
    }

    for (const replyNotification of replyNotifications) {
      if (req.currentUser.id === replyNotification.user_id) {
        continue;
      }

      const emailBody = `Dear ${replyNotification.user_display_name},

A user has replied to a forum topic you are following.

Forum: <a href="${websiteUrl}/forums/forum/${replyNotification.forum_slug}">${replyNotification.forum_title}</a>
Topic: <a href="${websiteUrl}/forums/topic/${replyNotification.topic_slug}">${replyNotification.topic_title}</a>
Content: ${req.body.content}

Best regards,

Black Directory Team`;

      const mailOptions = {
        to: replyNotification.user_email,
        subject: 'Black Directory - Forum Reply',
        body: emailBody,
      }

      mailHandler.sendEmail(mailOptions)
    }

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_reply' }, reply.data);
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

    const reply = await ReplyModel.findOne({ 'id': req.params.reply_id });
    if (Object.keys(reply).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster' && req.currentUser.forum_role != 'moderator' && req.currentUser.id != reply.user_id) {
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

  deleteReply = async (req, res, next) => {
    const reply = await ReplyModel.findOne({ 'id': req.params.reply_id });

    if (Object.keys(reply).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    if (req.currentUser.role != 'admin' && req.currentUser.forum_role != 'keymaster' && req.currentUser.forum_role != 'moderator' &&
      req.currentUser.id != reply.user_id) {
      throw new AppError(401, "401_unauthorised")
    }

    await ReplyModel.deleteReply(reply);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_reply' });
  };


  /**
   * ******************************
   * */

  getCategories = async (req, res, next) => {

    const result = await ForumModel.find('', DBTables.forum_categories, 'ORDER BY title ASC');

    new AppSuccess(res, 200, "200_retrieved", '', result);

  };

  // add new category
  newCategory = async (req, res, next) => {

    // do validation
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await ForumModel.newCategory(req.body);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added_successfully", '', result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  updateCategory = async (req, res, next) => {
    const result = await ForumModel.updateCategory(req.params.category_id, req.body);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_category' });
  };

  deleteCategory = async (req, res, next) => {
    const result = await ForumModel.getCategory(req.params.category_id);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    await ForumModel.deleteCategory(req.params.category_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_category' });
  };

}

module.exports = new ForumController();

