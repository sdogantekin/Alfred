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
    price: {type:SchemaTypes.Double, required:true},
    price_int: {type:Number, required:true},
    price_dec: {type:Number, required:true},
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

//productSchema.statics.search = function (searchedText,callback) {
//    this.find({$text: {$search: searchedText}}, {score: {$meta: "textScore"}})
//        .sort({score:{$meta:"textScore"}})
//        .limit(5)
//        .exec(callback);
//}

productSchema.statics.search = function (searchedText,merchantName, callback) {
    this.find({merchant: merchantName, $text: {$search: searchedText}}, {score: {$meta: "textScore"}})
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