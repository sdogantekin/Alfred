/**
 * Created by serkand on 05/05/2016.
 */
var mongoose = require('mongoose')
require('mongoose-double')(mongoose);
var elastic   = require("../elasticsearch/client");
var config    = require("../config/config");
var winston   = require("winston");

winston.level = config.log.level;

var SchemaTypes = mongoose.Schema.Types;

mongoose.set("debug", config.mongoose.debug);

// this defines the document schema
var productSchema = mongoose.Schema({
    id: {type:String, required: true},// unique:true},
    merchant: {type:String, required:true},
    title: {type:String, required:true},
    description: {type:String, required:true},
    link: {type:String, required:true},
    image_link: {type:String, required:false},
    brand: {type:String, required:false},
    price: {type:SchemaTypes.Double, required:true},
    price_int: {type:Number, required:true},
    price_dec: {type:Number, required:true},
    sale_price: {type:SchemaTypes.Double, required:false},
    sale_price_int: {type:Number, required:false},
    sale_price_dec: {type:Number, required:false},
    sale_start: {type:Date, required:false},
    sale_end: {type:Date, required:false},
    category: {type:String, required:true}
});

//productSchema.index({ merchant:1, title: 'text', description: 'text' });
//productSchema.index({ merchant:1, title: 'text'},{ default_language: "turkish" });
productSchema.index({ merchant:1, title: 'text', category:"text"},{name: 'product index', weights: {title: 10, category: 5}});

productSchema.pre("save",function(done){
//    winston.info("saving product");
    return done();
});

productSchema.post("save",function(doc) {
//    winston.info("saved product --> "+doc);
    if(doc) {
//        elastic.addProduct(doc);
    }
    return;
});

productSchema.statics.search = function (searchedText,merchantName, callback) {
//    this.find({merchant: merchantName, $text: {$search: searchedText}}, {score: {$meta: "textScore"}}, {score: { $gt: config.mongo.searchMinTextScore }})
    var now = new Date();
    this.aggregate([
            {
                $match: {
                    merchant: merchantName,
                    $text: {
                        $search: searchedText
                    }
                }
            },
            {
                $project: {
                    merchant:1,
                    title:1,
                    description:1,
                    link:1,
                    image_link:1,
                    brand:1,
                    price:{
                        $cond: { if: { $and: [{$gte: [now,"$sale_start"]},{$lte: [now,"$sale_end"]}] }, then: "$sale_price", else: "$price" }
                    },
                    price_int:{
                        $cond: { if: { $and: [{$gte: [now,"$sale_start"]},{$lte: [now,"$sale_end"]}] }, then: "$sale_price_int", else: "$price_int" }
                    },
                    price_dec:{
                        $cond: { if: { $and: [{$gte: [now,"$sale_start"]},{$lte: [now,"$sale_end"]}] }, then: "$sale_price_dec", else: "$price_dec" }
                    },
                    category:1,
                    score: {
                        $meta: "textScore"
                    }
                }
            },
            {
                $match: {
                    score: { $gt: config.mongo.searchMinTextScore }
                }
            }
        ])
        .sort({score:{$meta:"textScore"} , price_int: 1, price_dec:1}) //1 : ascending or -1 : descending
        .limit(10)
        .exec(callback);
}

productSchema.statics.searchSync = function (searchedText,merchantName) {
    return this.find({merchant: merchantName, $text: {$search: searchedText, $language: "tr"}}, {score: {$meta: "textScore"}})
        .sort({score:{$meta:"textScore"} , price_int: 1, price_dec:1})
        .limit(10);
}

// methods must be added to the schema before compiling it with mongoose.model()
// the first parameter is the singular name of collection --> collection name is db is plural --> products!
var Product = mongoose.model("Product",productSchema);

module.exports = Product;