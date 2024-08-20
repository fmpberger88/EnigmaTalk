const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

passport.use(new LocalStrategy(
    {
        usernameField: 'username', // Hier den Benutzernamen als Feld definieren
        passwordField: 'password',
    },
    async (username, password, done) => { // Parameter korrekt benennen: username statt email
        try {
            // Benutzer anhand des Benutzernamens finden
            const user = await prisma.user.findUnique({ where: { username } });
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            // Passwortüberprüfung
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            // Authentifizierung erfolgreich
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id); // Nur die Benutzer-ID serialisieren
});

passport.deserializeUser(async (id, done) => {
    try {
        // Benutzer anhand der ID finden
        const user = await prisma.user.findUnique({ where: { id } });
        if (user) {
            done(null, user); // Benutzerobjekt zurückgeben
        } else {
            done(null, false); // Kein Benutzer gefunden
        }
    } catch (err) {
        done(err, null); // Fehlerbehandlung
    }
});

module.exports = passport;
