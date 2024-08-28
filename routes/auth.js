// routes/auth.js
const express = require('express');
const passport = require('passport');
const { register, login, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Login successful', user: req.user });
});

router.post('/logout', logout);

module.exports = router;
