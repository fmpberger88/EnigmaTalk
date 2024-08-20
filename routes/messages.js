// routes/messages.js
const express = require('express');
const { sendMessage, getMessages, markMessageAsRead } = require('../controllers/messageController');
const { isAuthenticated } = require('../controllers/authController');

const router = express.Router();

router.post('/message', isAuthenticated, sendMessage);
router.get('/messages/:userId', isAuthenticated, getMessages);
router.post('/message/:messageId/read', isAuthenticated, markMessageAsRead);

module.exports = router;

