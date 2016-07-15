/**
 * Created by serkand on 28/04/2016.
 */
var express = require("express");
var router  = express.Router();
var User    = require("../models/user");

// dont forget, :<name> params can be accessed through request.params.<name>
router.get("/:username",function(request,response,next){
    User.findOne({username:request.params.username},function(err,user){
        if(err) {
            return next(err);
        }
        if(!user) {
            return next(404);
        }
        response.render("profile",{user:user});
    });
});

module.exports = router;