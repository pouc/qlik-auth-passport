var TwitterStrategy  = require('passport-twitter').Strategy;

var configAuth = require('./auth'); // use this one for testing
var User = require('../user');

module.exports = {

    active: true,
    name: 'twitter',
    color: 'info',
    icon: 'fa-twitter',
    label: 'Twitter',
    authField: 'username',

    init: function (app, passport, path) {

        // send to twitter to do the authentication
        app.get(path.login, passport.authenticate('twitter', {scope: 'email'}));

        // handle the callback after twitter has authenticated the user
        app.get(path.callback,
            passport.authenticate('twitter', {
                successRedirect: path.success,
                failureRedirect: path.login
            }));

        // login
        passport.use(new TwitterStrategy({

                consumerKey: configAuth.twitterAuth.consumerKey,
                consumerSecret: configAuth.twitterAuth.consumerSecret,
                callbackURL: configAuth.twitterAuth.callbackURL,
                passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

            },
            function (req, token, tokenSecret, profile, done) {

                // asynchronous
                process.nextTick(function () {

                    // check if the user is already logged in
                    if (!req.user) {

                        User.findOne({'twitter.id': profile.id}, function (err, user) {
                            if (err)
                                return done(err);

                            if (!user) {
                                user = new User();
                            }

                            user.auth.twitter = {};
                            user.auth.twitter.id = profile.id;
                            user.auth.twitter.token = token;
                            user.auth.twitter.username = profile.username;
                            user.auth.twitter.displayName = profile.displayName;

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

