const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.register = [
    // Validierung der Eingabedaten
    body('username')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .trim()
        .escape(),

    // Verarbeitung der Registrierung
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                },
            });
            res.status(201).json(user);
        } catch (err) {
            res.status(400).json({ error: 'User already exists or other error occurred' });
        }
    }
];

exports.login = [
    // Validierung der Eingabedaten
    body('username')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .trim()
        .escape(),

    // Verarbeitung des Logins
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        next(); // Fortsetzen des Authentifizierungsprozesses mit Passport
    },
    (req, res) => {
        res.json({ message: 'Login successful', user: req.user });
    }
];

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.json({ message: 'Logout successful' });
    });
};

exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
};
