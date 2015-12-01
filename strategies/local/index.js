var LocalStrategy    = require('passport-local').Strategy;
var User = require('../user');

module.exports = {

    active: true,
    name: 'local',
    color: 'default',
    icon: 'fa-user',
    label: 'Local Login',
    authField: 'email',

    init: function(app, passport, path) {

        // show the login form
        app.get(path.login, function(req, res) {
            app.customRender(res, __dirname, 'login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post(path.callback, passport.authenticate('local-login', {
            successRedirect : path.success, // redirect to the secure profile section
            failureRedirect : path.login, // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // login
        passport.use('local-login', new LocalStrategy({
                // by default, local strategy uses username and password, we will override with email
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            },
            function(req, email, password, done) {
                if (email)
                    email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

                // asynchronous
                process.nextTick(function() {
                    User.findOne({ 'local.email' :  email }, function(err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        // if no user is found, return the message
                        if (!user)
                            return done(null, false, req.flash('loginMessage', 'No user found.'));

                        if (!user.validPassword(password))
                            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                        // all is well, return user
                        else
                            return done(null, user);
                    });
                });
            }
        ));
    }

};


