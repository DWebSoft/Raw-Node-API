/**
 * Primary File for API
 */

 //Dependencies
 var server = require('./lib/server');
 var workers = require('./lib/workers');

 //Declare the app
 var app = {};

 //Init app
 app.init = function(){
    //Start Server
    server.init();

    //Start Workers
     workers.init();

 }

 //Execute
 app.init();

 //Export app module
 module.exports = app;