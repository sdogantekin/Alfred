/**
 * Created by serkand on 18/06/2016.
 */
var config = {};

//config.env = "DEV";
config.env = "PROD";

if (config.env == "DEV") {
    config.mongo     = {};
    config.mongo.url = "mongodb://localhost:27017/test";
    config.mongo.searchMinTextScore = 0;

    config.elastic      = {};
    config.elastic.host = "localhost:9200";
    config.elastic.log  = "info"; //trace
    config.elastic.catalogMinWeight = 0;
    config.elastic.suggestSize = 10;

    config.redis      = {};
    config.redis.ip   = "localhost";
    config.redis.port = 6379;

    config.log       = {};
    config.log.level = "debug";

    config.mongoose       = {};
    config.mongoose.debug = true;

    config.displayResultTable = true;
} else if (config.env == "PROD") {
    config.mongo     = {};
    config.mongo.url = "mongodb://130.211.60.193:27017/test";
    config.mongo.searchMinTextScore = 5;

    config.elastic = {};
    config.elastic.host = "146.148.22.46:9200";
    config.elastic.log  = "info"; //trace
    config.elastic.catalogMinWeight = 5;
    config.elastic.suggestSize = 5;

    config.redis      = {};
    config.redis.ip   = "130.211.75.36";
    config.redis.port = 6379;

    config.log       = {};
    config.log.level = "warn";

    config.mongoose  = {};
    config.mongoose.debug = false;

    config.displayResultTable = false;
}

module.exports = config;