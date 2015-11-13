var User = require('./user');

module.exports = function(app, passport) {

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/auth');
        } else {
            app.customRender(res, __dirname, 'index.ejs');
        }
    });

    app.get('/auth', isLoggedIn, function(req, res) {
        res.render('auth.ejs', {user: req.user});
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    require('./local')(app, passport);

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
