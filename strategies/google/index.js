var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

var configAuth = require('./auth'); // use this one for testing
var User = require('../user');

module.exports = {

    active: false,
    name: 'google',
    color: 'danger',
    icon: 'fa-google-plus',
    label: 'Google+',
    authField: 'name',

    init: function (app, passport, path) {

        // send to google to do the authentication
        app.get(path.login, passport.authenticate('google', {scope: ['profile', 'email']}));

        // the callback after google has authenticated the user
        app.get(path.callback,
            passport.authenticate('google', {
                successRedirect: path.success,
                failureRedirect: path.login
            }));

        // login
        passport.use(new GoogleStrategy({

                clientID: configAuth.googleAuth.clientID,
                clientSecret: configAuth.googleAuth.clientSecret,
                callbackURL: configAuth.googleAuth.callbackURL,
                passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

            },
            function (req, token, refreshToken, profile, done) {

                // asynchronous
                process.nextTick(function () {

                    // check if the user is already logged in
                    if (!req.user) {

                        User.findOne({'google.id': profile.id}, function (err, user) {
                            if (err)
                                return done(err);

                            if (!user) {
                                user = new User();
                            }

                            user.auth.google = {};
                            user.auth.google.id = profile.id;
                            user.auth.google.token = token;
                            user.auth.google.name = profile.displayName;
                            user.auth.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                            user.save(function (err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });

                        });

                    } else {
                        done('Should not happen!');
                    }
                });
            }
        ));
    }
}

