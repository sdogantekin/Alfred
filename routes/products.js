/**
 * Created by serkand on 06/05/2016.
 */
var express = require("express");
var router  = express.Router();
var elastic = require("../elasticsearch/client");
var winston = require("winston");
var async   = require("async");
var Product = require("../models/product");
var Campaign = require("../models/campaign")
var common   = require("./common");

router.post("/search",function(request,response,next){
    var merchants        = ["n11","hepsiburada"];
    var merchantQueries  = [];
    var result           = {};
    result["products"]   = {};
    if(request.user) {
        result["discounts"]  = [];
    }
    merchants.forEach(function(merchant){
        merchantQueries.push(function(callback) {
            Product.search(request.body.input, merchant, function(error, results) {
                if(error) {
                    winston.warn(error);
                    return next(error);
                }
                result["products"][merchant] = [];
                var discountQueries = [];
                if (request.user && results.length > 0) {
                    discountQueries.push(function(callback2){
                        discountForProduct(results[0], request.user, result["discounts"], callback2, null);
                    });
                }
                results.forEach(function(item) {
                    result["products"][merchant].push(item);
                });
                async.parallel(discountQueries,function(error){
                    if(error) {
                        winston.warn(error);
                        return next(error);
                    }
                    callback();
                });
            });
        });
    });
    async.parallel(merchantQueries,function(error){
        if(error) {
            winston.warn(error);
            return next(error);
        }
        addProductsToSession(request.session, result["products"]);
        response.json(result);
    });
});

router.post("/discount", common.ensureAuthenticated, function(request,response,next) {
    var user            = request.user;
    var result          = [];
    var productIds      = request.session.productList;
    var campaignQueries = [];
    productIds.forEach(function(productId) {
        campaignQueries.push(function(callback){
            Product.findById(productId, function (error, product){
                if(error) {
                    winston.warn(error);
                    return next(error);
                }
                Campaign.findCampaigns(product.merchant,request.user,product.price,function(error,campaigns){
                    if(error) {
                        winston.warn(error);
                        return next(error);
                    }
                    result.push(Campaign.getBestMatch(campaigns,product));
                    callback();
                });
            });
        });
    });
    async.parallel(campaignQueries,function(error){
        if(error) {
            winston.warn(error);
            return next(error);
        }
        response.json(result);
    });
});

function discountForProduct(product, user, discountList, callback, next) {
    Campaign.findCampaigns(product.merchant,user,product.price,function(error,campaigns){
        if(error) {
            winston.warn(error);
            if(next) {
                return next(error);
            }
        } else {
            discountList.push(Campaign.getBestMatch(campaigns,product));
        }
        if(callback) {
            callback();
        }
    });
}

router.get('/suggest/:input', function (req, res, next) {
    suggest(req.params.input,function(result){
        res.json(result);
    });
});

router.get('/suggest', function (req, res, next) {
    suggest(req.query.term,function(result){
        res.send(result);
    });
});

router.post('/find', function (req, res, next) {
    elastic.findProduct(req.body.input).then(function (result) {
        console.log(result);
        res.json(result);
    });
});

function suggest(input,callback) {
    elastic.suggest("product",input).then(function (result) {
        var response = [];
        if(result["product-suggest"] && result["product-suggest"].length > 0) {
            result["product-suggest"][0].options.forEach(function(obj){
                if(!exists(obj,response)) {
                    response.push({
                        id:obj.payload.id,
                        label:obj.text,
                        value:obj.text
                    });
                }
            });
        }
        callback(response);
    });
}

function exists(item, array) {
    array.forEach(function(obj){
        if(obj.value == item.value) {
            return true;
        }
    });
    return false;
}

function addProductsToSession(session, result) {
    session.productList = [];
    for(var key in result){
        if(result[key].length > 0) {
            var product = result[key][0];
            session.productList.push(product._id);
        }
    }
}

module.exports = router;