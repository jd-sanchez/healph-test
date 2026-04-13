const express = require('express');
const router = express.Router();
const EventController = require('../controllers/event_controller.js');
const Auth = require('../auth/auth_token_handler.js');

// Public — both users and admins need to read events
router.get('/getall', EventController.getAllEvents);
router.post('/join/:id', Auth.userAuth, EventController.joinEvent);
router.post('/leave/:id', Auth.userAuth, EventController.leaveEvent);

// Only admins can create / edit / delete events
router.post('/new', Auth.adminAuth, EventController.createEvent);
router.patch('/update/:id', Auth.adminAuth, EventController.updateEvent);
router.delete('/delete/:id', Auth.adminAuth, EventController.deleteEvent);

module.exports = router;
