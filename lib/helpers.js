/**
 * Helper Functions
 */

//Dependencies
var crypto = require('crypto');
var config = require('./config');

//Container for all the helpers
var helpers = {}

//Create a SHA256 hash
helpers.hash = function (str) {
    if( typeof(str) == 'string' && str.trim().length > 0 ){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
}

//Parse JSON string to object in all cases
helpers.parseJsonToObject = function(str){
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
} 

//Export module
module.exports = helpers