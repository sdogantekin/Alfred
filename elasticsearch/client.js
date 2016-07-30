/**
 * Created by serkand on 08/05/2016.
 */
var elasticsearch = require("elasticsearch");
var product       = require("./products");
var config        = require("../config/config");
var shortid       = require("shortid");
var winston       = require("winston");
winston.level     = config.log.level;

var client = new elasticsearch.Client({
    host: config.elastic.host,
    log: config.elastic.log
});

const INDEX_PRODUCT    = "product";
exports.INDEX_PRODUCT  = INDEX_PRODUCT;

const TYPE_CATEGORY    = "category";
const DUMMY_CATEGORIES = ["Diğer","Diger","Other"];

var addedItems = [];

function initIndex(indexName,resolve) {
    winston.info("initIndex : "+indexName);
    return client.indices.create({
        index:indexName
    }).then(function() {
            product.mapping.index = indexName;
            client.indices.putMapping(product.mapping);
        }
    ).then(function(){
        winston.info("DONE!");
        resolve(null);
    });
}
exports.initIndex = initIndex;

function deleteIndex(indexName) {
    winston.info("deleteIndex : "+indexName);
    return client.indices.delete({
        index: indexName
    });
}
exports.deleteIndex = deleteIndex;

function existsIndex(indexName) {
    winston.info("existsIndex : "+indexName);
    return client.indices.exists({
        index: indexName
    });
}
exports.existsIndex = existsIndex;

function initialize(indexName,callback) {
    winston.info("elastic init starting for "+indexName);
    existsIndex(indexName)
        .then(function(exists) {
            winston.info("exists --> "+exists);
            if(exists) {
                deleteIndex(indexName).then(initIndex(indexName,callback));
            } else if(!exists) {
                initIndex(indexName,callback);
            }
        });
}
exports.initialize = initialize;

function suggest(indexName,inputText) {
    return client.suggest({
        index: indexName,
        type: TYPE_CATEGORY,
        body: {
            "product-suggest" : {
                text: inputText,
                completion: {
                    field: "suggest",
                    size: config.elastic.suggestSize,
                    fuzzy: true
                }
            }
        }
    });
}
exports.suggest = suggest;

function getOutput(inputItems) {
    var candidate = "";
    if(inputItems.length == 1) {
        candidate = inputItems[0];
    } else {
        var lastItem   = inputItems[inputItems.length-1];
        if(DUMMY_CATEGORIES.indexOf(lastItem) == -1) {
            candidate = lastItem;
        } else {
            candidate = inputItems[inputItems.length-2];
        }
    }
    if (candidate != "" && addedItems.indexOf(candidate) == -1) {
        addedItems.push(candidate);
        return candidate;
    }
    return null;
}

function addCategories(categories, categoryDelimeter) {
    var categoryList = {};
    categories.forEach(function(item,index) {
        var parsedCategory = parseCategory(item, categoryDelimeter);
        if(parsedCategory.output in categoryList) {
            categoryList[parsedCategory.output].weight = categoryList[parsedCategory.output].weight + 1;
            //add input array
        } else {
            categoryList[parsedCategory.output]        = {};
            categoryList[parsedCategory.output].weight = 1;
            categoryList[parsedCategory.output].input  = parsedCategory.input;
        }
    });
    for (var category in categoryList) {
        if(categoryList[category].weight >= config.elastic.catalogMinWeight) {
            var categoryId = shortid.generate();
            client.index({
                index: INDEX_PRODUCT,
                type:TYPE_CATEGORY,
                id: categoryId,
                body:{
                    suggest: {
                        input: categoryList[category].input,
                        output: category,
                        weight: categoryList[category].weight,
                        payload: {"id":categoryId}
                    }
                }
            }, function(error,response){
                if(error) {
                    winston.error("error --> "+error);
                } else {
                    //winston.info("response --> "+response);
                }
            });
        }
    }
}
exports.addCategories = addCategories;

function parseCategory(category, categoryDelimeter) {
    var parsed = {};
    parsed["input"] = category.split(categoryDelimeter);
    if(parsed["input"].length == 1) {
        parsed["output"] = parsed["input"][0].trim();
    } else {
        var dummyItems = ["Diğer"];
        var lastItem   = parsed["input"][parsed["input"].length-1];
        if(dummyItems.indexOf(lastItem) == -1) {
            parsed["output"] = lastItem.trim();
        } else {
            parsed["output"] = parsed["input"][parsed["input"].length-2].trim();
        }
    }
    return parsed;
}

function addProduct(product) {
    var inputItems = product.category.split("|");
    var outputItem = getOutput(inputItems);
    if(outputItem) {
        winston.error("output --> "+outputItem);
        return client.index({
            index: INDEX_PRODUCT,
            type:TYPE_CATEGORY,
            id:product._id.toString(),
            body:{
                /*
                 id: product.id,
                 title:product.title,
                 description:product.description,
                 price:product.price,
                 suggest: {
                 input: product.title.split(" "),
                 output: product.title,
                 payload: {id: product.id} || {}
                 }
                 */
                suggest: {
                    input: inputItems,
                    output: outputItem,
                    payload: {id: product.id} || {}
                }
            }
        }, function(error,response){
            if(error) {
                winston.error("error --> "+error);
            } else {
                //winston.info("response --> "+response);
            }
        });
    }
    return;
}
exports.addProduct = addProduct;

function findProduct(text) {
    return client.search({
        index :INDEX_PRODUCT,
        body : {
            query : {
                multi_match : {
                    type: "most_fields",
                    query: text,
                    fields:["description","description_turkish"]
                }
            },
            sort: [{price:"asc"}]
        }
    });
}
exports.findProduct = findProduct;

function incrementWeight(categoryId,callback) {
    client.update({
        index: INDEX_PRODUCT,
        type:TYPE_CATEGORY,
        id: categoryId,
        body: {
            script: 'ctx._source.suggest.weight += 1'
        }
    }, function (error, response) {
        if(error) {
            winston.error(error);
        }
        callback(error);
    });
}
exports.incrementWeight = incrementWeight;