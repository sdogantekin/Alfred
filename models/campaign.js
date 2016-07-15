/**
 * Created by serkand on 28/04/2016.
 */
var mongoose = require("mongoose");
var winston = require("winston");

// this defines the document schema
var conditionSchema = mongoose.Schema({
    type: {type: String, required: true},
    value: {type: String, required: true}
});

var campaignSchema = mongoose.Schema({
    merchant: {type: String, required: true},
    category: {type: String, required: false},
    validFrom: {type: Date, required: false},
    validTo: {type: Date, required: false},
    benefitFrom: {type: Date, required: false},
    benefitTo: {type: Date, required: false},
    type: {type: String, required: true},
    value: {type: String, required: true},
    conditions: {type: [conditionSchema], required: false}
});

campaignSchema.statics.findCampaigns = function (merchantName, user, price, callback) {
    this.find({$or: [{merchant: {$exists: false}}, {merchant: merchantName}]}).exec(function (error, campaigns) {
        var result = [];
        if (error) {
            callback(error, result);
        }
        campaigns.forEach(function (campaign) {
            if(controlDateValidity(campaign.validFrom, campaign.validTo)) {
                var valid = true;
                for (var key in campaign.conditions) {
                    if (!valid) {
                        break;
                    }
                    var condition = campaign.conditions[key];
                    switch (condition.type) {
                        case "PRICE_MIN":
                            valid = valid && (price >= parseFloat(condition.value));
                            break;
                        case "PRICE_MAX":
                            valid = valid && (price <= parseFloat(condition.value));
                            break;
                        case "CARD":
                            if (user) {
                                valid = valid && user.hasCard(condition.value);
                            } else {
                                valid = false;
                            }
                            break;
                    }
                }
                if (valid) {
                    result.push(campaign);
                }
            }
        });
        callback(null, result);
    });
}

function controlDateValidity(validFrom, validTo) {
    var currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    return (validFrom == null ? true : currentDate >= validFrom) && (validTo == null ? true : currentDate <= validTo);
}

campaignSchema.statics.getBestMatch = function (campaigns, product) {
    var bestMatch = {
        id: product._id,
        merchant: product.merchant,
        title: product.title,
        price: product.price,
        discount: 0,
        bonus: 0
    };
    campaigns.forEach(function (campaign) {
        var temp = campaign.execute(product);
        if ((temp.price < bestMatch.price)
            || (temp.price == bestMatch.price && temp.bonus > bestMatch.bonus)) {
            bestMatch = temp;
        }
    });
    return bestMatch;
}

campaignSchema.methods.execute = function (product) {
    var result = {
        id: product._id,
        merchant: product.merchant,
        title: product.title,
        price: product.price,
        discount: 0,
        bonus: 0
    };
    switch (this.type) {
        case "DISCOUNT":
            result.discount = this.value * product.price
            result.price    = product.price - result.discount;
            break;
        case "BONUS":
            result.bonus = this.value;
            break;
    }
    return result;
}

// methods must be added to the schema before compiling it with mongoose.model()
// the first parameter is the singular name of collection --> collection name is db is plural --> users!
var Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = Campaign;