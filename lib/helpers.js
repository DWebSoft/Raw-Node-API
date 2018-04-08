/**
 * Helper Functions
 */

//Dependencies
var crypto = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');

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


//Create random string using given length
helpers.createRandomString = function(strLength){
    strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
       //Define all possible characters that can go in the string
       var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';
       
       //Create string
       var string = '';
       for(var i=0; i<strLength; i++){
           //Get a random character from possible characters string
           var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
           string += randomCharacter;
       }
       return string;
    } else {
        return false;
    }
};

//Send an SMS via Twilio
helpers.sendTwilioSms = function(phone, msg, callback){
    //Validate parameters
    phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone : false;
    msg = typeof (msg) == 'string' && msg.trim().length > 0 ? msg : false;

    if (phone && msg) {
        //Configure the request payload
        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+91' + phone,
            'Body' : msg
        }

        //Stringfy the payload. 
        //querystring is used so that it should be like submitted using form
        var stringPayload = querystring.stringify(payload);

        //Configure request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth' : config.twilio.accountSid + ":" + config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        }

        //Instantiate the request
        var req = https.request(requestDetails, function(res){
            //Grab the status of res
            var status = res.statusCode;
        
            //Callback on success
            if (status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was : ' + status);
            }
        });

        //Bind the error event so it does not get thrown
        req.on('error', function(e){
            callback(e);
        });

        //Add the payload
        req.write(stringPayload);

        //End request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }

};

//Export module
module.exports = helpers