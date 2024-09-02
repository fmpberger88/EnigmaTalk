const express = require('express');
const session = require('express-session');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('./config/passport');
const redisClient = require('./config/redisClient');
const RedisStore = require('connect-redis').default;
const { encrypt, decrypt } = require('./utils/encryption');
const prismaMiddleware = require('./middlewares/prismaMiddleware');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');

const app = express();
const server = http.createServer(app);

// Socket.IO Server mit CORS-Optionen
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",  // Erlaube Anfragen von localhost:5173
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["websocket", "polling"],  // WebSocket und Polling Transport erlauben
});


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

// ________________ Prisma Middleware ________________
app.use(prismaMiddleware); // Prisma Middleware hinzufügen

// ________________ Express Session ________________
const sessionMiddleware = session({
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
});
app.use(sessionMiddleware);

// ________________ Passport Configuration ________________
app.use(passport.initialize());
app.use(passport.session());

// ___________ Socket.IO und Express-Session Integration ___________
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.use((socket, next) => {
    passport.initialize()(socket.request, {}, next);
    passport.session()(socket.request, {}, (err) => {
        if (err || !socket.request.user) {
            console.log('Authentication error:', err);
            return next(new Error('Authentication error'));
        }
        console.log('User authenticated:', socket.request.user.username);
        next();
    });
});



// ________________ Authentifizierung prüfen ________________
app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
    }
    next();
});

// ________________ Routes ________________
app.use('/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// ________________ Socket.IO ________________
io.on('connection', (socket) => {
    if (socket.request.user && socket.request.user.logged_in) {
        console.log(`User ${socket.request.user.username} connected`);
    } else {
        console.log('Unauthenticated user connected');
    }

    socket.on('sendMessage', async ({ chatId, content }) => {
        // Sicherstellen, dass der Benutzer authentifiziert ist
        if (!socket.request.user) {
            return console.error('User is not authenticated');
        }

        const userId = socket.request.user.id;
        const encryptedContent = encrypt(content);

        try {
            const message = await socket.request.prisma.message.create({
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

            io.to(`chat_${chatId}`).emit('message', {
                id: message.id,
                senderId: message.senderId,
                chatId: message.chatId,
                content: decrypt(message.content),
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});




// _________________ Error Handler _________________
app.use(errorHandler);

// _________________ Server _________________
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
