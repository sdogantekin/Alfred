/**
 * Created by serkand on 28/04/2016.
 */
var mongoose = require("mongoose");

// this defines the document schema
var couponSchema = mongoose.Schema({
    merchant: {type:String, required: true},
    category: {type:String, required: false},
    validFrom: {type:Date, required:false},
    validTo:{type:Date, required:false},
    type:{type:String, required:true},
    value:{type:String, required:true}
    // condition structure
});


// methods must be added to the schema before compiling it with mongoose.model()
// the first parameter is the singular name of collection --> collection name is db is plural --> users!
var Coupon = mongoose.model("Coupon",couponSchema);

module.exports = Coupon;