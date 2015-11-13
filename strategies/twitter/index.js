var TwitterStrategy  = require('passport-twitter').Strategy;

var configAuth = require('./auth'); // use this one for testing
var User = require('../user');

module.exports = function(app, passport) {

    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/auth',
            failureRedirect : '/'
        }));

    // login
    passport.use(new TwitterStrategy({

            consumerKey     : configAuth.twitterAuth.consumerKey,
            consumerSecret  : configAuth.twitterAuth.consumerSecret,
            callbackURL     : configAuth.twitterAuth.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function(req, token, tokenSecret, profile, done) {

            // asynchronous
            process.nextTick(function() {

                // check if the user is already logged in
                if (!req.user) {

                    User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.twitter.token) {
                                user.twitter.token       = token;
                                user.twitter.username    = profile.username;
                                user.twitter.displayName = profile.displayName;

                                user.save(function(err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user);
                                });
                            }

                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser                 = new User();

                            newUser.twitter = {};
                            newUser.twitter.id          = profile.id;
                            newUser.twitter.token       = token;
                            newUser.twitter.username    = profile.username;
                            newUser.twitter.displayName = profile.displayName;

                            newUser.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user                 = req.user; // pull the user out of the session

                    user.twitter = {};
                    user.twitter.id          = profile.id;
                    user.twitter.token       = token;
                    user.twitter.username    = profile.username;
                    user.twitter.displayName = profile.displayName;

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user);
                    });
                }

            });

        }));

};


