// set up ======================================================================
// get all the tools we need
var express         = require('express');
var app             = express();
var passport        = require('passport');
var flash           = require('connect-flash');

var morgan          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var session         = require('express-session');

var config          = require('./config');
var port            = process.env.PORT || config.port || 8484;

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

app.customRender = function (res, root, name, opts) {

    var engines = app.engines;
    var cache = app.cache;

    view = cache[root + '-' + name];

    if (!view) {
        view = new (app.get('view'))(name, {
            defaultEngine: app.get('view engine'),
            root: root,
            engines: engines
        });

        if (!view.path) {
            var err = new Error('Failed to lookup view "' + name + '" in views directory "' + root + '"');
            err.view = view;
            return fn(err);
        }

        cache[root + '-' + name] = view;
    }

    var fn = function(err, html) {
        if (err) {
            console.log(err);
            res.send(404);
        } else {
            res.send(200, html);
        }
    };

    try {
        if(opts) {
            view.render(opts, fn);
        } else {
            view.render(fn);
        }
    } catch (err) {
        fn(err);
    }
};

// required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// routes ======================================================================
require('./strategies/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);