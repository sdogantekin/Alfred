var express      = require("express");
var path         = require("path");
var favicon      = require("serve-favicon");
var logger       = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser   = require("body-parser");
var mongoose     = require("mongoose");
var passport     = require("passport");
var session      = require("express-session");
var flash        = require("connect-flash");
var redis        = require("redis");
var config       = require("./config/config");
// TODO: check session management on redis
// https://codeforgeek.com/2015/07/using-redis-to-handle-session-in-node-js/
var redisStore   = require('connect-redis')(session);

var passportSetup = require("./passport/setup");
var routes        = require("./routes/main");
var client        = redis.createClient(config.redis.port,config.redis.ip);

var app = express();

// mongo db setup
mongoose.connect(config.mongo.url);

// setup passport
passportSetup();

//set app locals
app.locals.displayResultTable = config.displayResultTable;

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// morgan logger is set
app.use(logger('dev'));

// static files should be served through public directory
app.use(express.static(path.join(__dirname, "public")));

// extended false makes more simple and secure
// form parameters can be accessed through request.body
// multiple parsers can be used simultaneously
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Parse Cookie header and populate request.cookies with an object keyed by the cookie names
app.use(cookieParser());

// Session data is not saved in the cookie itself, just the session ID. Session data is stored server-side
// default name for session id cookie (set in the response and read from in the request)--> connect.sid
// Express-session directly reads and writes cookies on req/res
// To store or access session data, simply use the request property req.session
// The default server-side session storage, MemoryStore, is purposely not designed for a production environment -- "store" option
app.use(session({
  // This is the secret used to sign the session ID cookie.
  // This can be either a string for a single secret, or an array of multiple secrets.
  // If an array of secrets is provided, only the first element will be used to sign the session ID cookie,
  // while all the elements will be considered when verifying the signature in requests.
  secret : "TKRv0IJs=HYqrvagQ#&!F!%V]Ww/4KiVs$s,<<MX",
  // forces the session to be saved back to the session store, even if the session was never modified during the request
  resave : true,
  // Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified
  // Passport will add an empty Passport object to the session for use after a user is authenticated
  // which will be treated as a modification to the session, causing it to be saved
  saveUninitialized : true,
  store: new redisStore({ host: config.redis.ip, port: 6379, client: client,ttl :  260})
}));

// The flash is a special area of the session used for storing messages.
// Messages are written to the flash and cleared after being displayed to the user
// The flash is typically used in combination with redirects,
// ensuring that the message is available to the next page that is to be rendered
app.use(flash());

// these must be called after express-session is "used"
app.use(passport.initialize());
app.use(passport.session());

// assign main router
app.use(routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
