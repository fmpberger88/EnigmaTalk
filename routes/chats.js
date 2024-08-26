const express = require('express');
const { createChat, getChats, sendMessageToChat, getMessagesInChat, markMessageAsRead } = require('../controllers/chatController');
const { isAuthenticated } = require('../controllers/authController');

const router = express.Router();

router.post('/create', isAuthenticated, createChat); // Einen neuen Chat erstellen
router.get('/', isAuthenticated, getChats); // Alle Chats des angemeldeten Benutzers abrufen
router.post('/:chatId/message', isAuthenticated, sendMessageToChat); // Nachricht zu einem bestimmten Chat senden
router.get('/:chatId/messages', isAuthenticated, getMessagesInChat); // Nachrichten eines bestimmten Chats abrufen
router.post('/message/:messageId/read', isAuthenticated, markMessageAsRead); // Nachricht als gelesen markieren und nach 30 Sekunden löschen

module.exports = router;
