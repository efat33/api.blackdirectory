const express = require('express');
const router = express.Router();
const EventController = require('../controllers/event-controller');
const auth = require('../utils/auth');
const authVerified = require('../utils/authVerified');
const currentUser = require('../utils/currentUser');
const apiKey = require('../utils/api-key');
const awaitHandlerFactory = require('../utils/awaitHandlerFactory');
const { isAdmin } = require('../utils/common');

const validation = require('../utils/validators/eventValidator');

router.post('/new', apiKey(), authVerified(), validation.validateNewEvent, awaitHandlerFactory(EventController.newEvent));
router.get('/get-event/:slug', apiKey(),  awaitHandlerFactory(EventController.getEvent));
router.get('/get-related-events/:id', apiKey(),  awaitHandlerFactory(EventController.getRelatedEvents));


router.post('/rsvp-apply', apiKey(), authVerified(), awaitHandlerFactory(EventController.rsvpApply));

router.get('/get-user-tickets/:id', apiKey(), currentUser(),  awaitHandlerFactory(EventController.getUserTickets));
router.get('/get-user-rsvp/:id', apiKey(), currentUser(),  awaitHandlerFactory(EventController.getUserRsvp));



router.post('/new-organiser', apiKey(), authVerified(), awaitHandlerFactory(EventController.newOrganiser));
router.get('/organisers', apiKey(),  awaitHandlerFactory(EventController.getOrganisers));

router.post('/new-category', apiKey(), authVerified(), awaitHandlerFactory(EventController.newCategory));
router.get('/categories', apiKey(),  awaitHandlerFactory(EventController.getCategories));

router.post('/new-tag', apiKey(), authVerified(), awaitHandlerFactory(EventController.newTag));
router.get('/tags', apiKey(),  awaitHandlerFactory(EventController.getTags));

module.exports = router;