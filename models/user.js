/**
 * Created by serkand on 28/04/2016.
 */
var mongoose = require("mongoose");
var bcrypt   = require("bcrypt-nodejs");

const SALT_FACTOR = 10;

// this defines the document schema
var cardSchema = mongoose.Schema({
//    bank:{type:String, required:false},
    brand:{type:String, required:false}
});

var operatorSchema = mongoose.Schema({
    item:{type:String, required:false}
});

var programSchema = mongoose.Schema({
    item:{type:String, required:false}
});

var preferenceSchema = mongoose.Schema({
    item:{type:String, required:false}
});

var userSchema = mongoose.Schema({
    username: {type:String, required: true, unique:true},
    password: {type:String, required: true},
    email: {type:String, required:true, default:"deneme@deneme.com"},
    createdAt: {type:Date, default:Date.now()},
    bio: {type:String, required:false},
    welcomeMessage: {type:String, required:false},
    age: {type:String, required:false},
    gender: {type:String, required:false},
    shoeSize: {type:String, required:false},
    clothSize: {type:String, required:false},
    cards:{type:[cardSchema], required: false},
    programs:{type:[programSchema], required: false},
    operators:{type:[operatorSchema], required: false},
    preferences:{type:[preferenceSchema], required: false}
});

userSchema.methods.validatePassword = function(entry,callback) {
    bcrypt.compare(entry,this.password,function(err,isMatch){
        callback(err,isMatch);
    });
};

userSchema.methods.hasCard = function(cardBrand) {
    for(var i = 0; i < this.cards.length; i++) {
        var card = this.cards[i];
        if (card.brand == cardBrand) {
            return true;
        }
    }
    return false;
};

var noop = function(){};

userSchema.pre("save",function(done){
    var user = this;
    if(!user.isModified("password")) {
        return done();
    }
    bcrypt.genSalt(SALT_FACTOR,function(err,salt){
        if(err) {
            return done(err);
        }
        bcrypt.hash(user.password, salt, noop, function(err,hashedPassword){
            if(err) {
                return done(err);
            }
            user.password = hashedPassword;
            done();
        });
    });
});

// methods must be added to the schema before compiling it with mongoose.model()
// the first parameter is the singular name of collection --> collection name is db is plural --> users!
var User = mongoose.model("User",userSchema);

module.exports = User;