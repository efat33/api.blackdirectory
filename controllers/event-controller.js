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

        const result = await  EventModel.newEvent(req.body, req.currentUser);

        if (result.status && result.status == 200) {

            new AppSuccess(res, 200, "200_added", { 'entity': 'entity_event' }, result.data);

        }
        else {
            throw new AppError(403, "403_unknownError");
        }

    };

    // get single event details
    getEvent = async (req, res, next) => {
    
        const result = await EventModel.getEvent(req.params.slug);
      
        new AppSuccess(res, 200, "200_retrieved", '', result);
      
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
        if(!req.currentUser) new AppSuccess(res, 200, "200_retrieved", '', tickets);


        tickets = await EventModel.getUserTickets(req.params.id, req.currentUser.id);
      
        new AppSuccess(res, 200, "200_retrieved", '', tickets);
      
    };

     // get loggedin user rsvp
     getUserRsvp = async (req, res, next) => {
        let rsvp = [];

        // if user not loggedin, return with empty result
        if(!req.currentUser) new AppSuccess(res, 200, "200_retrieved", '', rsvp);

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
        const rsvp = await EventModel.findOne({id:req.body.rsvp_id}, DBTables.event_tickets);

        if (req.body.guest_no > rsvp.available) {
            throw new AppError(403, "Guest number cannot be greater than available RSVP");
        }

        const result = await  EventModel.rsvpApply(req.body, req.currentUser, rsvp);

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

        const result = await  EventModel.newOrganiser(req.body);

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

        const result = await  EventModel.newCategory(req.body);

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

        const result = await  EventModel.newTag(req.body);

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
}

module.exports = new EventController();