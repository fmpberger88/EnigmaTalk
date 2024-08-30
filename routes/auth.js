// routes/auth.js
const express = require('express');
const passport = require('passport');
const { register, logout, getCurrentUser } = require('../controllers/authController');
const { isAuthenticated } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Login successful', user: req.user });
});

router.post('/logout', logout);
router.get('/me', isAuthenticated, getCurrentUser);  // Endpunkt für aktuellen Benutzer


module.exports = router;
