// controllers/messageController.js
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/encryption'); // Importiere die Verschlüsselungs-Utilities
const { body, param, validationResult } = require('express-validator');

const prisma = new PrismaClient();

exports.sendMessage = [
    // Validierung der Eingabedaten
    body('senderId')
        .isInt().withMessage('Sender ID must be an integer'),
    body('receiverId')
        .isInt().withMessage('Receiver ID must be an integer'),
    body('content')
        .isLength({ min: 1 }).withMessage('Content cannot be empty'),

    // Verarbeitung der Nachrichtensendung
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { senderId, receiverId, content } = req.body;

        // Nachricht verschlüsseln
        const encryptedContent = encrypt(content);

        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content: encryptedContent,
            },
        });
        res.status(201).json(message);
    }
];

exports.getMessages = [
    // Validierung der Eingabedaten
    param('userId')
        .isInt().withMessage('User ID must be an integer'),

    // Verarbeitung der Nachrichtenausgabe
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId } = req.params;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: parseInt(userId) },
                    { receiverId: parseInt(userId) },
                ],
            },
            include: {
                sender: true,
                receiver: true,
            },
        });

        // Nachrichten entschlüsseln
        const decryptedMessages = messages.map((message) => ({
            ...message,
            content: decrypt(message.content),
        }));

        res.json(decryptedMessages);
    }
];

exports.markMessageAsRead = [
    // Validierung der Eingabedaten
    param('messageId')
        .isInt().withMessage('Message ID must be an integer'),

    // Verarbeitung der Markierung als gelesen und Timer zur Löschung
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { messageId } = req.params;

        setTimeout(async () => {
            await prisma.message.delete({
                where: { id: parseInt(messageId) },
            });
            console.log(`Message ${messageId} deleted after 30 seconds`);
        }, 30000);

        res.status(200).json({ message: 'Message will be deleted after 30 seconds' });
    }
];
