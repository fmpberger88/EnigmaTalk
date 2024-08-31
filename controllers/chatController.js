const { encrypt, decrypt } = require('../utils/encryption'); // Importiere die Verschlüsselungs-Utilities
const { body, param, validationResult } = require('express-validator');

exports.createChat = [
    // Validierung der Eingabedaten
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
        .trim()
        .escape(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username } = req.body;
        const { id: userId } = req.user;

        try {
            // Benutzer suchen, mit dem ein Chat erstellt werden soll
            const userToChatWith = await req.prisma.user.findUnique({
                where: { username },
            });

            if (!userToChatWith) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prüfen, ob bereits ein Chat existiert
            const existingChat = await req.prisma.chat.findFirst({
                where: {
                    users: {
                        every: {
                            userId: { in: [userId, userToChatWith.id] },
                        },
                    },
                    AND: [
                        {
                            users: {
                                some: { userId: userId },
                            },
                        },
                        {
                            users: {
                                some: { userId: userToChatWith.id },
                            },
                        },
                    ],
                },
                include: {
                    users: {
                        include: {
                            user: true,
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            });

            if (existingChat) {
                return res.status(200).json(existingChat);
            }

            // Neuen Chat erstellen
            const chat = await req.prisma.chat.create({
                data: {
                    users: {
                        create: [
                            { user: { connect: { id: userId } } },
                            { user: { connect: { id: userToChatWith.id } } },
                        ],
                    },
                },
                include: {
                    users: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            console.log(chat)
            return res.status(201).json(chat);
        } catch (error) {
            console.error('Error creating chat:', error);
            return res.status(500).json({ error: 'Error creating chat' });
        }
    }
];




exports.getChats = async (req, res) => {
    const { id: userId } = req.user;

    try {
        const chats = await req.prisma.chat.findMany({
            where: {
                users: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Optional: Formatierung der Chats, um unnötige Informationen zu entfernen
        const formattedChats = chats.map(chat => ({
            id: chat.id,
            users: chat.users.map(uc => ({
                id: uc.user.id,
                username: uc.user.username,
            })),
            lastMessage: chat.messages[0] || null,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
        }));
        console.log(formattedChats)
        return res.status(200).json(formattedChats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return res.status(500).json({ error: 'Error fetching chats' });
    }
};


exports.sendMessageToChat = [
    // Validierung der Eingabedaten
    param('chatId')
        .isInt().withMessage('Chat ID must be an integer'),
    body('content')
        .notEmpty().withMessage('Content cannot be empty')
        .isLength({ min: 1 }).withMessage('Content must be at least 1 character long')
        .trim(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { chatId } = req.params;
        const { content } = req.body;
        const { id: senderId } = req.user;

        try {
            // Prüfen, ob der Chat existiert und der Benutzer Teil davon ist
            const chat = await req.prisma.chat.findUnique({
                where: { id: parseInt(chatId) },
                include: {
                    users: true,
                },
            });

            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const isUserInChat = chat.users.some(uc => uc.userId === senderId);
            if (!isUserInChat) {
                return res.status(403).json({ error: 'You are not a participant of this chat' });
            }

            // Nachricht verschlüsseln
            const encryptedContent = encrypt(content);

            // Nachricht erstellen
            const message = await req.prisma.message.create({
                data: {
                    content: encryptedContent,
                    senderId: senderId,
                    chatId: parseInt(chatId),
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });

            // Aktualisiere updatedAt des Chats
            await req.prisma.chat.update({
                where: { id: parseInt(chatId) },
                data: {
                    updatedAt: new Date(),
                },
            });

            return res.status(201).json({
                id: message.id,
                content: content, // Unverschlüsselt zurückgeben
                sender: message.sender,
                chatId: message.chatId,
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error('Error sending message:', error);
            return res.status(500).json({ error: 'Error sending message' });
        }
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
        const { id: userId } = req.user;

        try {
            // Prüfen, ob der Chat existiert und der Benutzer Teil davon ist
            const chat = await req.prisma.chat.findUnique({
                where: { id: parseInt(chatId) },
                include: {
                    users: true,
                },
            });

            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const isUserInChat = chat.users.some(uc => uc.userId === userId);
            if (!isUserInChat) {
                return res.status(403).json({ error: 'You are not a participant of this chat' });
            }

            // Nachrichten abrufen
            const messages = await req.prisma.message.findMany({
                where: { chatId: parseInt(chatId) },
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });

            // Nachrichten entschlüsseln und formatieren
            const decryptedMessages = messages.map(message => ({
                id: message.id,
                content: decrypt(message.content),
                sender: message.sender,
                chatId: message.chatId,
                createdAt: message.createdAt,
            }));

            return res.status(200).json(decryptedMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({ error: 'Error fetching messages' });
        }
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
        const { id: userId } = req.user;

        try {
            // Nachricht abrufen
            const message = await req.prisma.message.findUnique({
                where: { id: parseInt(messageId) },
                include: {
                    chat: {
                        include: {
                            users: true,
                        },
                    },
                },
            });

            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            // Überprüfen, ob der Benutzer Teil des Chats ist
            const isUserInChat = message.chat.users.some(uc => uc.userId === userId);
            if (!isUserInChat) {
                return res.status(403).json({ error: 'You are not authorized to perform this action' });
            }

            // Nachricht nach 30 Sekunden löschen
            setTimeout(async () => {
                try {
                    await req.prisma.message.delete({
                        where: { id: parseInt(messageId) },
                    });
                    console.log(`Message ${messageId} deleted after 30 seconds`);
                } catch (err) {
                    console.error(`Error deleting message ${messageId}:`, err);
                }
            }, 30000);

            return res.status(200).json({ message: 'Message will be deleted after 30 seconds' });
        } catch (error) {
            console.error('Error marking message as read:', error);
            return res.status(500).json({ error: 'Error marking message as read' });
        }
    }
];
