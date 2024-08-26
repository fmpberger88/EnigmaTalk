const express = require('express');
const session = require('express-session');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
const passport = require('./config/passport');
const redisClient = require('./config/redisClient');
const RedisStore = require('connect-redis').default;
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('./utils/encryption'); // Import der Verschlüsselungs-Utility
const prismaMiddleware = require('./middlewares/prismaMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(helmet());

// _________________ CORS Configuration _________________
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// ________________ Express Session ________________
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 60 * 60 * 1000,
        sameSite: 'Strict',
    }
}));

// ________________ Passport Configuration ________________
app.use(passport.session());

app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
    }
    next();
});

// ________________ Prisma Middleware ________________
app.use(prismaMiddleware); // Prisma Middleware hinzufügen

// ________________ Routes ________________
app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

// ________________ Socket.IO ________________
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('sendMessage', async ({ chatId, content }) => {
        const userId = socket.request.user.id; // Angemeldeten Benutzer als Absender nutzen
        const encryptedContent = encrypt(content); // Nachricht verschlüsseln

        try {
            const message = await prisma.message.create({
                data: {
                    senderId: userId,
                    chatId: chatId,
                    content: encryptedContent,
                },
                include: {
                    sender: true,
                    chat: true,
                },
            });

            // Nachricht an alle Benutzer im Chat senden
            io.to(`chat_${chatId}`).emit('message', {
                id: message.id,
                senderId: message.senderId,
                chatId: message.chatId,
                content: decrypt(message.content), // Unverschlüsselte Nachricht zurücksenden
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('joinChat', (chatId) => {
        socket.join(`chat_${chatId}`);
        console.log(`User joined chat ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


// _________________ Error Handler _________________
app.use(errorHandler);

// _________________ Server _________________
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
