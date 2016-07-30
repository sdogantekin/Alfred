/**
 * Created by serkand on 09/05/2016.
 */
exports.mapping = {
    "index": "product",
    "type": "category",
    "body": {
        "properties": {
            "suggest": {
                "type": "completion",
                "analyzer": "simple",
                "search_analyzer": "simple",
                "payloads": true
            }
        }
    }
};