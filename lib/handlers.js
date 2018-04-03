/**
 * Request handlers
 */

//Dependencies
var _data = require('./data'); 
var helpers = require('./helpers');

//Request Handlers
var handlers = {};

//Users
handlers.users = function(data, callback){
    var allowedMethods = ['get','post','put','delete'];
    if(allowedMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        //Method not allowed status
        callback(405);
    }
}

//Container for users submethod
handlers._users = {};

//Users - POST
//Required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function(data, callback) { 
    //Check if all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false; 
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false; 
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false; 
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false; 

    //All fields are required
    if ( firstName && lastName && password && phone && tosAgreement ){
        //Check if user already exists
        _data.read('users', phone, function(err, data){
            //User not exist
            if (err) {
                //Hash Password
                var hashedPassword = helpers.hash(password);
                
                if ( hashedPassword ) {
                    //Create user object
                    var userObject = {
                        firstName,
                        lastName,
                        hashedPassword,
                        phone,
                        tosAgreement
                    }

                    //Create User
                    _data.create('users', phone, userObject, function(err){
                        if ( !err ) {
                            callback(200);
                        } else {
                            callback(500, {"Error" : "Could not create user"})
                        }

                    });
                } else {
                    callback(500, {"Error" : "Could not hash user password"});
                }

            } else {
                callback(400, {"Error":"User with this phone number already exists"});
            }
        });

    } else {
        callback(400, { "Error": "Missing required fields"});
    }
};

//Users - get
//Required data - phone
//Optional data - None
//@TODO: only allow authenticated uses access their data, and not anyone else's data
handlers._users.get = function(data, callback){
    //check the phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false; 
    if(phone){
        //Lookup the user
        _data.read('users', phone, function(err, data){
            if(!err && data){
                //Remove the hashed password data
                delete data.hashedPassword;
                callback(200, data); 
            }else{
                callback(404);
            }
        });
    }else{
        callback(400,{"Error":"Missing required field"});
    }
};

//Ping handler
handlers.ping = function (data, callback) {
    callback(200);
}

//Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
}

module.exports = handlers;