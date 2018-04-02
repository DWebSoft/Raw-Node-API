/**
 * Primary File for API
 */

 //Dependecies
var http = require('http');
var url = require('url');

//Create a server
var server = http.createServer( function (req, res) {
    
    //Parse the incoming url
    var parsedUrl = url.parse(req.url, true);
    
    //Get the path
    var path = parsedUrl.path;
    
    //Get the resource name
    var resource = path.replace(/^\/+|\/+$/g,'');
    console.log(resource);

    res.end('Hello World');
});

//Listen
server.listen(3000, function() {
    console.log('Server started listening at port 3000');
})