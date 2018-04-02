/**
 * Primary File for API
 */

 //Dependecies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

//Create a server
var server = http.createServer( function (req, res) {
    
    //Parse the incoming url
    var parsedUrl = url.parse(req.url, true);
    
    //Get the path
    var path = parsedUrl.pathname;
    
    //Get the resource name
    var resource = path.replace(/^\/+|\/+$/g,'');

    //Get query string as an object
    var queryStringObject = parsedUrl.query;

    //Get Requested Method
    var method = req.method.toUpperCase();

    //Get Headers
    var headers = req.headers;

   //Get Payload
   var payload = '';
   var decoder = new StringDecoder('utf-8');

   //Payload comes as a Stream. So grab it in parts and combine
   req.on('data', (data) => {
        payload += decoder.write(data);
      
   });

   req.on('end', () => {
       payload += decoder.end();
       console.log('Payload', payload);
       res.end('Hello World');
   });
});

//Listen
server.listen(3000, function() {
    console.log('Server started listening at port 3000');
})