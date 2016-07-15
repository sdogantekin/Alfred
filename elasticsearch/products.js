/**
 * Created by serkand on 09/05/2016.
 */
exports.mapping = {
    "index": "product",
    "type": "category",
    "body": {
        "properties": {
            //"id": { "type": "string" },
            //"title": { "type": "string" },
            //"description": {
            //    "type": "string",
            //    "fields": {
            //        "turkish": {
            //            "type": "string",
            //            "analyzer": "turkish"
            //        }
            //    }
            //},
            //"link": { "type": "string" },
            //"image_link": { "type": "string" },
            //"price": { "type": "string" },
            "suggest": {
                "type": "completion",
                "analyzer": "simple",
                "search_analyzer": "simple",
                "payloads": true
            }
        }
    }
};