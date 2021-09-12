const ListingModel = require("../models/listing-model");
const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const { DBTables } = require('../utils/common');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const EventModel = require("../models/event-model");
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class EventController {
  checkValidation = (req) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new AppError(400, "400_paramMissingGeneral", null, errors);
    }
  };

  // create new event
  newEvent = async (req, res, next) => {
    // check primary validation set in eventValidator.js
    this.checkValidation(req);

    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }
    if (!req.body.description) {
      throw new AppError(403, "Description is required");
    }
    if (!req.body.start_time || !req.body.end_time) {
      throw new AppError(403, "Event Time is required");
    }
    if (req.body.is_virtual && req.body.youtube_url == '') {
      throw new AppError(403, "Youtube URL is required");
    }
    if (!req.body.is_virtual && (req.body.address == '' || req.body.latitude == '' || req.body.longitude == '')) {
      throw new AppError(403, "Event Address is required");
    }
    if (!req.body.category_id) {
      throw new AppError(403, "Category is required");
    }
    if (!req.body.organizers) {
      throw new AppError(403, "Organiser is required");
    }

    const result = await EventModel.newEvent(req.body, req.currentUser);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added", { 'entity': 'entity_event' }, result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // edit event
  editEvent = async (req, res, next) => {
    // check primary validation set in eventValidator.js
    this.checkValidation(req);

    if (!req.body.id) {
      throw new AppError(403, "ID is required");
    }
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }
    if (!req.body.description) {
      throw new AppError(403, "Description is required");
    }
    if (!req.body.start_time || !req.body.end_time) {
      throw new AppError(403, "Event Time is required");
    }
    if (req.body.is_virtual && req.body.youtube_url == '') {
      throw new AppError(403, "Youtube URL is required");
    }
    if (!req.body.is_virtual && (req.body.address == '' || req.body.latitude == '' || req.body.longitude == '')) {
      throw new AppError(403, "Event Address is required");
    }
    if (!req.body.category_id) {
      throw new AppError(403, "Category is required");
    }
    if (!req.body.organizers) {
      throw new AppError(403, "Organiser is required");
    }

    const existingEvent = await EventModel.findOne({ id: req.body.id }, DBTables.events);

    // check if the user is authorised to edit this event
    if (req.currentUser.role !== 'admin' && existingEvent.user_id && existingEvent.user_id != req.currentUser.id) {
      throw new AppError(401, "401_unauthorised");
    }

    const result = await EventModel.editEvent(req.body, req.currentUser);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_updated_successfully", '', result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get single event details
  getEvent = async (req, res, next) => {

    const result = await EventModel.getEvent(req.params);

    if (result) {
      // process comments and replies

      const comments = result.comments;
      for (let comment of comments) {
        comment.replies = comments.filter(com => com.parent_id === comment.id);
      }

      result.comments = comments.filter(com => com.parent_id == null);
    }

    new AppSuccess(res, 200, "200_retrieved", '', result);

  };

  searchEvents = async (req, res, next) => {

    const result = await EventModel.searchEvents(req.body);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_event' }, result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get related events
  getRelatedEvents = async (req, res, next) => {

    const result = await EventModel.getRelatedEvents(req.params.id);

    new AppSuccess(res, 200, "200_retrieved", '', result);

  };

  // get loggedin user tickets
  getUserTickets = async (req, res, next) => {
    let tickets = [];

    // if user not loggedin, return with empty result
    if (!req.currentUser) {
      new AppSuccess(res, 200, "200_retrieved", '', tickets);
      return;
    };


    tickets = await EventModel.getUserTickets(req.params.id, req.currentUser.id);

    new AppSuccess(res, 200, "200_retrieved", '', tickets);

  };

  // get loggedin user rsvp
  getUserRsvp = async (req, res, next) => {
    let rsvp = [];

    // if user not loggedin, return with empty result
    if (!req.currentUser) {
      new AppSuccess(res, 200, "200_retrieved", '', rsvp);
      return;
    };

    rsvp = await EventModel.getUserRsvp(req.params.id, req.currentUser.id);

    new AppSuccess(res, 200, "200_retrieved", '', rsvp);

  };

  // submit rsvp application form
  rsvpApply = async (req, res, next) => {

    // do validation
    if (!req.body.rsvp_id) {
      throw new AppError(403, "RSVP ID is required");
    }
    if (!req.body.name) {
      throw new AppError(403, "Name is required");
    }
    if (!req.body.email) {
      throw new AppError(403, "Email is required");
    }
    if (!req.body.guest_no) {
      throw new AppError(403, "Number of guest is required");
    }

    // validate if the guest no is greater than available Number
    const rsvp = await EventModel.findOne({ id: req.body.rsvp_id }, DBTables.event_tickets);

    if (req.body.guest_no > rsvp.available) {
      throw new AppError(403, "Guest number cannot be greater than available RSVP");
    }

    const result = await EventModel.rsvpApply(req.body, req.currentUser, rsvp);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_successful");

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };


  // add new organiser
  newOrganiser = async (req, res, next) => {

    // do validation
    if (!req.body.name) {
      throw new AppError(403, "Name is required");
    }
    if (!req.body.phone) {
      throw new AppError(403, "Phone is required");
    }

    const result = await EventModel.newOrganiser(req.body);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added_successfully", '', result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get all the organisers
  getOrganisers = async (req, res, next) => {

    const result = await EventModel.find('', DBTables.event_organisers);

    new AppSuccess(res, 200, "200_retrieved", '', result);

  };

  // add new category
  newCategory = async (req, res, next) => {

    // do validation
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await EventModel.newCategory(req.body);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added_successfully", '', result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get all the categories
  getCategories = async (req, res, next) => {

    const result = await EventModel.find('', DBTables.event_categories);

    new AppSuccess(res, 200, "200_retrieved", '', result);

  };

  // add new tag
  newTag = async (req, res, next) => {

    // do validation
    if (!req.body.title) {
      throw new AppError(403, "Title is required");
    }

    const result = await EventModel.newTag(req.body);

    if (result.status && result.status == 200) {

      new AppSuccess(res, 200, "200_added_successfully", '', result.data);

    }
    else {
      throw new AppError(403, "403_unknownError");
    }

  };

  // get all the organisers
  getTags = async (req, res, next) => {

    const result = await EventModel.find('', DBTables.event_tags);

    new AppSuccess(res, 200, "200_retrieved", '', result);

  };

  newEventComment = async (req, res, next) => {
    const eventComment = await EventModel.createEventComment(req.body, req.currentUser);

    if (eventComment.status !== 200) {
      throw new AppError(403, "403_unknownError")
    };

    new AppSuccess(res, 200, "200_added", { 'entity': 'entity_comment' }, eventComment.data);
  }

  deleteEventComment = async (req, res, next) => {
    const result = await EventModel.getEventComment(req.params.comment_id);

    if (Object.keys(result).length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    if (result[0].user_id !== req.currentUser.id) {
      throw new AppError(403, "403_unknownError")
    }

    await EventModel.deleteEventComment(req.params.comment_id, result[0].event_id);

    new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_comment' });
  };

  updateEventComment = async (req, res, next) => {
    if (!req.body) {
      throw new AppError(403, "403_unknownError")
    };

    const result = await EventModel.updateEventComment(req.params.comment_id, req.body.comment);

    new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_comment' }, result);
  };

  createStripeCheckoutSession = async (req, res, next) => {
    if (!req.body.tickets || req.body.tickets.length === 0) {
      throw new AppError(403, "403_unknownError")
    };

    
    const ids = req.body.tickets.map(ticket => ticket.id);
    const tickets = await EventModel.getTickets(ids);
    
    const event_id = tickets[0].event_id;
    const line_items = [];
    const meta_items = [];

    for (const ticket of tickets) {
      const quantity = req.body.tickets.find(t => t.id === ticket.id).quantity;

      if (ticket.available != null && ticket.available < quantity) {
        throw new AppError(403, "Please provide a valid quantity")
      };

      line_items.push(
        {
          price_data: {
            currency: 'gbp',
            unit_amount: parseFloat(ticket.price) * 100,
            product_data: {
              name: ticket.title
            },
          },
          quantity: quantity,
        },
      );

      meta_items.push({
        ticketId: ticket.id,
        price: ticket.price,
        quantity: quantity
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${req.body.returnUrl}?success=true`,
      cancel_url: `${req.body.returnUrl}?success=false`,
      metadata: {
        type: 'event',
        eventId: event_id,
        items: JSON.stringify(meta_items),
        userId: req.currentUser.id
      }
    });

    new AppSuccess(res, 200, "200_successful", null, session);
  };
}

module.exports = new EventController();