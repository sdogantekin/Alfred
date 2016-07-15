/**
 * Created by serkand on 05/05/2016.
 */
"use strict";

var fs       = require("fs");
var mongoose = require("mongoose");
var expat    = require("node-expat");
var Product  = require("./models/product");
var elastic  = require("./elasticsearch/client");
var async    = require("async");
var config   = require("./config/config");
var winston  = require("winston");
winston.level = 'debug';

// mongo db setup
mongoose.connect(config.mongo.url);

function parseAndExecuteFile(merchantName,product,callback) {
    var parser = new expat.Parser("UTF-8");

    var newProduct;
    var valueHolder;
    var item = {
        NONE:0,
        ID:1,
        TITLE:2,
        DESCRIPTION:3,
        PRICE:4,
        LINK:5,
        IMAGE:6,
        CATEGORY:7
    }
    var itemFlag   = item.NONE;
    var categories = [];

    parser.on('startElement', function (name, attrs) {
        //console.log(name, attrs)
        var striped = stripeNamespace(name);
        switch (striped) {
            case "item":
                newProduct          = new Product();
                newProduct.merchant = merchantName;
                break;
            case "id":
                itemFlag = item.ID;
                break;
            case "price":
                itemFlag = item.PRICE;
                break;
            case "link":
                itemFlag = item.LINK;
                break;
            case "image_link":
                itemFlag = item.IMAGE;
                break;
            case "description":
                itemFlag = item.DESCRIPTION;
                break;
            case "category":
                itemFlag = item.CATEGORY;
                break;
        }
    });

    parser.on('endElement', function (name) {
        var striped = stripeNamespace(name);
        switch (striped) {
            case "item":
                newProduct.save();
                newProduct = null;
                itemFlag   = item.NONE;
                break;
            case "id":
                newProduct.id    = valueHolder;
                break;
            case "title":
                //TODO namespace and path is needed :) (path relative to item will be enough)
                if(newProduct) {
                    newProduct.title = valueHolder;
                }
                break;
            case "price":
                if(newProduct) {
                    newProduct.price = valueHolder;
                    newProduct.price_int = parseInt(valueHolder);
                    newProduct.price_dec = parseInt((parseFloat(valueHolder) % 1).toFixed(2).substring(2));
                }
                break;
            case "link":
                if(newProduct) {
                    newProduct.link = valueHolder;
                }
                break;
            case "image_link":
                if(newProduct) {
                    newProduct.image_link = valueHolder;
                }
                break;
            case "description":
                if(newProduct) {
                    newProduct.description = valueHolder;
                }
                break;
            case "category":
                if(newProduct) {
                    newProduct.category = valueHolder;
                    categories.push(valueHolder);
                }
                break;
            case "rss":
                winston.info("File ended : "+merchantName+"_"+product);
                elastic.addCategories(categories);
                callback(null);
                break;
        }
    });

    parser.on('text', function (text) {
        valueHolder = text.trim();
    });

    parser.on('error', function (error) {
        winston.error(error);
    });


    winston.info("Beginning file "+merchantName+"_"+product);
    fs.createReadStream("./feed/example_feed_xml_rss_"+merchantName+"_"+product+".xml").pipe(parser);
}

function stripeNamespace(field) {
    if(field && field.indexOf(":") > -1) {
        return field.substr(field.indexOf(":")+1);
    }
    return field;
}

//TODO:
function parseNamespace(attr) {
    for(var field in attr) {
        if(field.indexOf("xmlns:") > -1) {

        }
    }
}

//drop the collection
mongoose.connection.db.dropCollection('products', function(err, result) {
    if(err) {
        winston.error(err);
    }
});

//drop the collection
mongoose.connection.db.dropCollection('users', function(err, result) {
    if(err) {
        winston.error(err);
    }
});


//execution array
var tasks = [];
tasks.push(function(callback){elastic.initialize("product",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","ps4",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","iphone",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","led",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","dis",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","asics",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","xbox",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","s6",callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","nike",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","ps4",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","iphone",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","led",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","dis",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","asics",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","xbox",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","s6",callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","nike",callback);});

async.series(tasks,function(error){
    if(error) {
        winston.error(error);
    }
   // process.exit();
});