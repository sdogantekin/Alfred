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

function parseAndExecuteFile(merchantName,product,categoryDelimeter,descriptionAsCategory,limit,callback) {
    var parser = new expat.Parser("UTF-8");

    var newProduct;
    var valueHolder;
    var item = {
        NONE:0,
        ITEM:1,
        SHIPPING:2
    }
    var itemFlag   = item.NONE;
    var categories = [];
    var count      = 0;

    parser.on('startElement', function (name, attrs) {
        //console.log(name, attrs)
        var striped = stripeNamespace(name);
        switch (striped) {
            case "item":
                newProduct          = new Product();
                newProduct.merchant = merchantName;
                itemFlag            = item.ITEM;
                break;
            case "shipping":
                itemFlag = item.SHIPPING;
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
                if(count < limit) {
                    count++;
                } else {
                    winston.info("limit reached");
                    elastic.addCategories(categories, categoryDelimeter);
                    parser.stop();
                    callback(null);
                }
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
                if(newProduct && itemFlag == item.ITEM) {
                    newProduct.price = valueHolder;
                    newProduct.price_int = parseInt(valueHolder);
                    newProduct.price_dec = parseInt((parseFloat(valueHolder) % 1).toFixed(2).substring(2));
                }
                break;
            case "sale_price":
                if(newProduct && itemFlag == item.ITEM) {
                    newProduct.sale_price = valueHolder;
                    newProduct.sale_price_int = parseInt(valueHolder);
                    newProduct.sale_price_dec = parseInt((parseFloat(valueHolder) % 1).toFixed(2).substring(2));
                }
                break;
            case "sale_price_effective_date":
                if(newProduct) {
                    var dates = valueHolder.split("/");
                    newProduct.sale_start = new Date(dates[0]);
                    newProduct.sale_end   = new Date(dates[1]);
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
            case "brand":
                if(newProduct) {
                    newProduct.brand = valueHolder;
                }
                break;
            case "description":
                if(newProduct) {
                    if (descriptionAsCategory) {
                        newProduct.category = valueHolder;
                        categories.push(valueHolder);
                    }
                    newProduct.description = valueHolder;
                }
                break;
            case "category":
                if(newProduct) {
                    newProduct.category = valueHolder;
                    categories.push(valueHolder);
                }
                break;
            case "shipping":
                itemFlag = item.ITEM;
                break;
            case "rss":
                winston.info("File ended : "+merchantName+"_"+product);
                elastic.addCategories(categories, categoryDelimeter);
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

tasks.push(function(callback){elastic.initialize(elastic.INDEX_PRODUCT,callback);});
/*
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","ps4","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","iphone","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","led","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","dis","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","asics","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","xbox","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","s6","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","nike","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","ps4","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","iphone","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","led","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","dis","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","asics","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","xbox","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","s6","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("n11","nike","|",false,10000,callback);});
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","real"," > ",true,50000,callback);});
*/
tasks.push(function(callback){parseAndExecuteFile("hepsiburada","realmini"," > ",true,50000,callback);});

async.series(tasks,function(error){
    if(error) {
        winston.error(error);
    }
   // process.exit();
});