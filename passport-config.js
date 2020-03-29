const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// User model
const User = require('./models/user.model');

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email);
        if (user==null) {
            // if can't find user at email, return done with err message
            return done(null, false, {message: 'No user with that email'});
        }
        console.log(user.select('password'));
        try {
            if (await bcrypt.compare(
                password, user.password
            )) {
                // password matches encrypted password, return user
                return done(null, user);
            } else {
                // incorrect password, return error message to user
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (e) {
            // any errors, return done with error message
            return done(e);
        }
    }
    
    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id));
    });
}

module.exports = initialize