var FacebookStrategy = require('passport-facebook').Strategy;

var configAuth = require('./auth'); // use this one for testing
var User = require('../user');

module.exports = {

    active: false,
    name: 'facebook',
    color: 'primary',
    icon: 'fa-facebook',
    label: 'Facebook',
    authField: 'name',

    init: function (app, passport, path) {

        // send to facebook to do the authentication
        app.get(path.login, passport.authenticate('facebook', {scope: 'email'}));

        // handle the callback after facebook has authenticated the user
        app.get(path.callback,
            passport.authenticate('facebook', {
                successRedirect: path.success,
                failureRedirect: path.login
            }));

        // login
        passport.use(new FacebookStrategy({

                clientID: configAuth.facebookAuth.clientID,
                clientSecret: configAuth.facebookAuth.clientSecret,
                callbackURL: configAuth.facebookAuth.callbackURL,
                passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

            },
            function (req, token, refreshToken, profile, done) {

                // asynchronous
                process.nextTick(function () {

                    // check if the user is already logged in
                    if (!req.user) {

                        User.findOne({'facebook.id': profile.id}, function (err, user) {
                            if (err)
                                return done(err);

                            if (!user) {
                                user = new User();
                            }

                            user.auth.facebook = {};
                            user.auth.facebook.id = profile.id;
                            user.auth.facebook.token = token;
                            user.auth.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            user.auth.facebook.email = (profile.emails[0].value || '').toLowerCase();

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


