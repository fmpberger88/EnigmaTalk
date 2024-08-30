const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,  // Damit req in der Strategie verfügbar ist
    },
    async (req, username, password, done) => {
        try {
            // Benutzer anhand des Benutzernamens finden
            const user = await req.prisma.user.findUnique({ where: { username } });
            if (!user) {
                console.log('Incorrect username.');
                return done(null, false, { message: 'Incorrect username.' });
            }

            // Passwortüberprüfung
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log('Incorrect password.');
                return done(null, false, { message: 'Incorrect password.' });
            }

            // Authentifizierung erfolgreich
            console.log('Authentication successful for user:', user.username);
            return done(null, user);
        } catch (err) {
            console.error('Error during authentication:', err);
            return done(null, false, { message: 'An error occurred during authentication' });
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id); // Nur die Benutzer-ID serialisieren
});

passport.deserializeUser(async (req, id, done) => {
    try {
        // Benutzer anhand der ID finden
        const user = await req.prisma.user.findUnique({ where: { id } });
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
