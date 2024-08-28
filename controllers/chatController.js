const { encrypt, decrypt } = require('../utils/encryption'); // Importiere die Verschlüsselungs-Utilities
const { body, param, validationResult } = require('express-validator');

exports.createChat = async (req, res) => {
    const { username } = req.body;
    const { id: userId } = req.user;

    try {
        // Benutzer suchen, mit dem ein Chat erstellt werden soll
        const userToChatWith = await req.prisma.user.findUnique({
            where: { username },
        });

        if (!userToChatWith) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prüfen, ob bereits ein Chat existiert
        const existingChat = await req.prisma.chat.findFirst({
            where: {
                users: {
                    every: {
                        id: {
                            in: [userId, userToChatWith.id],
                        },
                    },
                },
            },
        });

        if (existingChat) {
            return res.json(existingChat);
        }

        // Neuen Chat erstellen
        const chat = await req.prisma.chat.create({
            data: {
                users: {
                    connect: [{ id: userId }, { id: userToChatWith.id }],
                },
            },
            include: {
                users: true,
            },
        });

        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error creating chat', error });
    }
};

exports.getChats = async (req, res) => {
    const { id: userId } = req.user;

    try {
        const chats = await req.prisma.chat.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
            include: {
                users: true,
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chats', error });
    }
};

exports.sendMessageToChat = [
    // Validierung der Eingabedaten
    body('content')
        .isLength({ min: 1 }).withMessage('Content cannot be empty'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { chatId } = req.params;
        const { content } = req.body;
        const { id: senderId } = req.user;

        // Nachricht verschlüsseln
        const encryptedContent = encrypt(content);

        const message = await req.prisma.message.create({
            data: {
                senderId,
                chatId: parseInt(chatId),
                content: encryptedContent,
            },
        });
        res.status(201).json(message);
    }
];

exports.getMessagesInChat = [
    // Validierung der Eingabedaten
    param('chatId')
        .isInt().withMessage('Chat ID must be an integer'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { chatId } = req.params;

        const messages = await req.prisma.message.findMany({
            where: { chatId: parseInt(chatId) },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: true,
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

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { messageId } = req.params;

        setTimeout(async () => {
            await req.prisma.message.delete({
                where: { id: parseInt(messageId) },
            });
            console.log(`Message ${messageId} deleted after 30 seconds`);
        }, 30000);

        res.status(200).json({ message: 'Message will be deleted after 30 seconds' });
    }
];
