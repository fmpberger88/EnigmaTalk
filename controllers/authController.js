const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const passport = require('../config/passport');

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
        // console.log(errors.array())
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await req.prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                },
            });
            res.status(201).json(user);
        } catch (err) {
            res.status(400).json({ error: 'User already exists or other error occurred' });
            // console.log(err);
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
    (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return res.status(500).json({ error: 'An error occurred during authentication' });
            }
            if (!user) {
                // Fehlermeldung von Passport an das Frontend weitergeben
                return res.status(400).json({ error: info.message });
            }
            // Bei erfolgreicher Authentifizierung
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Login failed' });
                }
                return res.json({ message: 'Login successful', user });
            });
        })(req, res, next);
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

// authController.js (in deinem Backend)
exports.getCurrentUser = (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
};


