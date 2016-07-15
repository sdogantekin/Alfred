/**
 * Created by serkand on 28/04/2016.
 */
// The most widely used way for websites to authenticate users is via a username and password.
// Support for this mechanism is provided by the passport-local module
var passport      = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var User          = require("../models/user");

// the following function will be used to initialize passport configuration
module.exports = function() {
    // Passport will serialize and deserialize user instances to and from the session
    passport.serializeUser(function(user,done){
        // first parameter is error
        // mongo documents has an unique _id field
        done(null, user._id);
    });
    passport.deserializeUser(function(id,done){
        User.findById(id,function(err,user){
            done(err,user);
        });
    });
    // By default, LocalStrategy expects to find credentials in parameters named username and password
    // If your site prefers to name these fields differently, options are available to change the defaults
    passport.use("alfred",new LocalStrategy(
        function(username,password,done) {
            User.findOne({username:username},function(err,user){
                if(err) {
                    return done(err);
                }
                if(!user) {
                    return done(null,false,{message: "No suitable user found"});
                }
                user.validatePassword(password,function(err,isMatch){
                    if(err) {
                        return done(err);
                    }
                    if(isMatch) {
                        return done(null,user);
                    } else {
                        return done(null,false,{message: "No suitable user found"});
                    }
                });
            });
        }
    ));
};