/**
 * Created by serkand on 05/05/2016.
 */
"use strict";

var fs        = require("fs");
var config    = require("./config/config");
var mongoose  = require("mongoose");
var Campaign  = require("./models/campaign");
mongoose.set('debug', config.mongoose.debug);

// mongo db setup
mongoose.connect(config.mongo.url);

Campaign.remove({},function(error){});

var campaign1 = new Campaign();
campaign1.merchant   = "n11";
campaign1.type       = "DISCOUNT";
campaign1.value      = "0.1";
campaign1.conditions = [{type:"PRICE_MIN",value:"1000"},{type:"CARD",value:"bonus"}];

campaign1.save();

var campaign2 = new Campaign();
campaign2.merchant   = "hepsiburada";
campaign2.type       = "BONUS";
campaign2.value      = "25";
campaign2.conditions = [{type:"PRICE_MIN",value:"200"},{type:"CARD",value:"bonus"}];

campaign2.save(function(error) {
    process.exit();
});
