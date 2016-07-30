/**
 * Created by serkand on 28/04/2016.
 */
var express = require("express");
var userRouter = require("./users");
var productRouter = require("./products");
var winston = require("winston");
var passport = require("passport");
var User = require("../models/user");
var common = require("./common");

var router = express.Router();

router.use(function (request, response, next) {
    /*
     don't forget the order
     app.locals
     response.locals
     object passed to render
     */
    response.locals.currentUser = request.user;
    // Get an array of flash messages by passing the key to req.flash()
    response.locals.errors = request.flash("error");
    response.locals.infos  = request.flash("info");
    next();
});

router.use("/users", common.ensureAuthenticated, userRouter);
router.use("/products", productRouter);

router.get("/", function (request, response, next) {
    User.find()
        .sort({createdAt: "descending"})
        .exec(function (err, users) {
            if (err) {
                return next(err);
            }
            response.render("index", {users: users});
        });
});

router.get("/login", function (request, response) {
    response.render("login");
});

// By default, LocalStrategy expects to find credentials in parameters named username and password
router.post("/login", passport.authenticate("alfred", {
    successRedirect: "/",
    failureRedirect: "/login",
    // Setting the failureFlash option to true instructs Passport to flash an error message using the message option set by the verify callback above.
    // This is helpful when prompting the user to try again.
    failureFlash: true
}));

router.post("/login2", function (request, response, next) {
    passport.authenticate("alfred", function (error, user, info) {
        var result = {};
        if (error) {
            result.status  = "fail";
            result.message = err;
            return response.json(result);
        }
        if (!user) {
            result.status  = "fail";
            result.message = "User does not exits";
            return response.json(result);
        }
        request.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            result.status = "success";
            return response.json(result);
        });
    })(request, response, next);
});

router.get("/logout", function (request, response) {
    // Passport exposes a logout() function on req (also aliased as logOut()) that can be called from any route handler which needs to terminate a login session.
    // Invoking logout() will remove the req.user property and clear the login session (if any).
    request.logout();
    response.redirect("/");
});

router.get("/signup", function (request, response) {
    response.render("signup");
});


router.post("/signup", function (request, response, next) {
    var username = request.body.username;
    var password = request.body.password;

    User.findOne({username: username}, function (err, user) {
        var result = {};
        if (err) {
            result.status  = "fail";
            result.message = err;
            return response.json(result);
        }
        if (user) {
            result.status  = "fail";
            result.message = "User already exits";
            return response.json(result);
        }
        var newUser = new User({username: username, password: password});
        if(request.body.age) {
            newUser.age = request.body.age;
        }
        if(request.body.gender) {
            newUser.gender = request.body.gender;
        }
        if(request.body.shoeSize) {
            newUser.shoeSize = request.body.shoeSize;
        }
        if(request.body.clothSize) {
            newUser.clothSize = request.body.clothSize;
        }
        newUser.cards       = [];
        newUser.operators   = [];
        newUser.programs    = [];
        newUser.preferences = [];

        request.body.cards.forEach(function(value){
            newUser.cards.push(value);
        });
        request.body.operators.forEach(function(value){
            newUser.operators.push(value);
        });
        request.body.programs.forEach(function(value){
            newUser.programs.push(value);
        });
        request.body.preferences.forEach(function(value){
            newUser.preferences.push(value);
        });

        newUser.save(next);
    });
}, function (request, response, next) {
    passport.authenticate("alfred", function (error, user, info) {
        var result = {};
        if (error) {
            result.status  = "fail";
            result.message = err;
            return response.json(result);
        }
        if (!user) {
            result.status  = "fail";
            result.message = "User does not exits";
            return response.json(result);
        }
        request.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            result.status = "success";
            return response.json(result);
        });
    })(request, response, next);
});

router.get("/edit", common.ensureAuthenticated, function (request, response) {
    response.render("edit");
});

router.post("/edit", common.ensureAuthenticated, function (request, response, next) {
    request.user.username       = request.body.username;
    request.user.email          = request.body.email;
    request.user.welcomeMessage = request.body.welcomeMessage;
    request.user.bio            = request.body.bio;
    request.user.cards          = [];
    for (var i = 0; i < request.body.cards.length; i++) {
        request.user.cards.push(request.body.cards[i]);
    }
    request.user.save(function (err) {
        var result = {};
        if (err) {
            winston.error(err);
            result.status = "fail";
        }
        result.status = "success";
        response.json(result);
    });
});

module.exports = router;
