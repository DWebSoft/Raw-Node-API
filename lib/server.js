/**
 * Contains all server related tasks
 */

//Dependecies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

//Instantiate server module
var server = {};

//Instantiate a http server
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req, res);
});

//Instanstiate a https server
var httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '/../https/privatekey.key')),
    cert: fs.readFileSync(path.join(__dirname, '/../https/certificate.crt')),
}
server.httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    server.unifiedServer(req, res);
});

//All server logic for both http and https server
server.unifiedServer = function (req, res) {
    //Parse the incoming url
    var parsedUrl = url.parse(req.url, true);

    //Get the path
    var path = parsedUrl.pathname;

    //Get the resource name
    var resource = path.replace(/^\/+|\/+$/g, '');

    //Get query string as an object
    var queryStringObject = parsedUrl.query;

    //Get Requested Method
    var method = req.method.toLowerCase();

    //Get Headers
    var headers = req.headers;

    //Get Payload
    var buffer = '';
    var decoder = new StringDecoder('utf-8');

    //Payload comes as a Stream. So grab it in parts and combine
    req.on('data', (data) => {
        buffer += decoder.write(data);

    });

    req.on('end', () => {
        buffer += decoder.end();

        //Choose the handler this request should go to
        var chooseHandler = typeof (server.router[resource]) !== 'undefined' ? server.router[resource] : handlers.notFound;

        //Construct the data object to be send to router
        var data = {
            resource,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer)
        };

        //Route the request to the specific handler
        chooseHandler(data, (statusCode, payload) => {

            //Set default status code
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            //Set default payload object
            payload = typeof (payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
}

//Define request router
server.router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
}

//Init script
server.init = function(){
    //Start a http server
    server.httpServer.listen(config.httpPort, function () {
        console.log(`Server started listening at port ${config.httpPort} in ${config.envName} environment`);
    });

    //Start a https server
    server.httpsServer.listen(config.httpsPort, function () {
        console.log(`Server started listening at port ${config.httpsPort} in ${config.envName} environment`);
    });
}

//Export Server Module
module.exports = server;