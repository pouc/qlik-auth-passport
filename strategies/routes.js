var fs              = require('fs');
var path            = require('path');
var utils           = require('qlik-utils');

var config          = require('../config');
var User            = require('./user');

var pfx = fs.readFileSync(path.join(__dirname, '..', config.pfx));

module.exports = function(app, passport) {

    var normalizedPath = path.join(__dirname);

    var visas = fs.readdirSync(normalizedPath).filter(function(file) {
        return fs.statSync(path.join(normalizedPath, file)).isDirectory();
    }).map(function(file) {
        return require("./" + file);
    }).filter(function(visa) {
        return visa.active;
    });

    app.use(function (req, res, next) {
        if (req.isAuthenticated() && req.originalUrl != '/auth' && req.originalUrl != '/logout' && req.originalUrl != '/sense') {
            res.redirect('/auth');
        } else {
            next();
        }
    });

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs', {visas: visas});
    });

    // show the login page
    app.get('/auth', isLoggedIn, function(req, res) {
        res.render('auth.ejs', {user: req.user, visas: visas});
    });

    // qlik sense ticket generation & redirect
    app.get('/sense', isLoggedIn, function(req, res) {

        var visa = visas.filter(function(visa) {
            return visa.name == Object.keys(req.user.auth)[0];
        });

        if(typeof visa !== 'undefined' && visa.length != 0) {

            utils.Qlik.getTicket({
                restUri: config.qps.uri,
                prefix: config.qps.prefix,
                pfx: pfx,
                passPhrase: config.passphrase,
                params: {
                    UserId: req.user.auth[visa[0].name][visa[0].authField],
                    UserDirectory: visa[0].name,
                    Attributes: []
                }
            }).then(function(ticket) {
                res.redirect(config.redirectUri + '?qlikTicket=' + ticket.Ticket);
            }, function(err) {
                res.status(500).send(err);
            });

        } else {

            req.logout();
            res.redirect('/');

        }

    });

    // LOGOUT ==============================
    app.get('/logout', isLoggedIn, function(req, res) {
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

    visas.forEach(function(visa) {
        visa.init(app, passport, { login: '/auth/' + visa.name, callback: '/auth/' + visa.name + '/callback', success: '/auth' });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
