/**
 * Created by serkand on 18/06/2016.
 */
var config = {};

config.mongo   = {};
config.mongo.url = "mongodb://130.211.60.193:27017/test";
//config.mongo.url = "mongodb://localhost:27017/test";

config.elastic = {};
config.elastic.host = "146.148.22.46:9200";
//config.elastic.host = "localhost:9200";
config.elastic.log  = "info"; //trace
config.elastic.catalogMinWeight = 5;
config.elastic.suggestSize = 5;
//config.elastic.suggest.size = 10;

config.redis     = {};
config.redis.ip   = "130.211.75.36";
//config.redis.ip   = "localhost";
config.redis.port = 6379;

config.log       = {};
config.log.level = "debug";

config.mongoose  = {};
config.mongoose.debug = true;

config.displayResultTable = false;
//config.displayResultTable = true;

module.exports = config;