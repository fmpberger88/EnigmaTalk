const express = require('express');
const session = require('express-session');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const passport = require('./config/passport');
const redisClient = require('./config/redisClient');
const RedisStore = require('connect-redis').default;
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('./utils/encryption'); // Import der Verschlüsselungs-Utility

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(logger('dev'));
app.use(helmet());

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

// ________________ Routes ________________
app.use('/auth', authRoutes);
app.use('/api', messageRoutes);

// ________________ Socket.IO ________________
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
        const encryptedContent = encrypt(content); // Nachricht verschlüsseln
        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content: encryptedContent,
            },
        });

        io.emit('message', {
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: decrypt(message.content), // Unverschlüsselte Nachricht zurücksenden
            createdAt: message.createdAt,
        });
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
