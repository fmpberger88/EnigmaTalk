// routes/auth.js
const express = require('express');
const passport = require('passport');
const { register, login, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login, passport.authenticate('local')); // Füge Passport-Authentifizierung hinzu
router.post('/logout', logout);

module.exports = router;
