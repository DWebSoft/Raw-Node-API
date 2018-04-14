/**
 * Library for storing and handling logs
 */

//Dependecies
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

//Container for lib
var lib = {};

//Crate a base directory for logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');

//Apend a string to file. Create it if does not exists.
lib.append = function(file, str, callback){
    //Open the file for appending
    fs.open(lib.baseDir + file + '.log', 'a', function(err, fd){
        if (!err && fd) {
            //Append the file
            fs.appendFile(fd, str + '\n', function(err){
                if (!err) {
                    //Close file
                    fs.close(fd, function(err){
                        if (!err) {
                            callback(false);
                        } else {    
                            callback('Error in closing file that was being appended');
                        }
                    });
                } else {
                    callback('Error in appending the file');
                }
            });
        } else {
            callback('Could not open file for appending');
        }
    });
};


//List all logs, optionally include compressed logs
lib.list = function(includeCompressedLogs, callback){
    fs.readdir(lib.baseDir, function(err, data){
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName){
                //Add the .log files
                if (fileName.indexOf('.log') > -1){
                    trimmedFileNames.push(fileName.replace('.log', ''));
                }

                //Add .gz files
                if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }
            });
            //console.log(trimmedFileNames);
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
}

//Compress the content of one .log file in .gz.b64 file within same directory
lib.compress = function(logId, newFileId, callback){
    var sourceFile = logId + '.log';
    var destFile = newFileId + '.gz.b64';

    //Read the source file
    fs.readFile(lib.baseDir + sourceFile, 'utf-8', function(err, inputString){
        if (!err && inputString) {
            //Compress the string
            zlib.gzip(inputString, function(err, buffer){
                if (!err && buffer) {
                    //Send the compress data to destination file
                    fs.open(lib.baseDir+destFile, 'wx', function(err, fd){
                        if (!err && buffer) {
                            //Write to dest file
                            fs.writeFile(fd, buffer.toString('base64'), function(err){
                                if (!err) {
                                    //Close file
                                    fs.close(fd, function(err){
                                        if (!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }    
                            });
                        } else {
                            callback(err);
                        }    
                    });
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

//Decompress the content of .gz.b64 file to string
lib.decompress = function(fileId, callback){
    var fileName = fileId + '.gz.b64';
    fs.readFile(lib.baseDir + fileName, 'utf8', function(err, str){
        //Convert string to Buffer
        var inputBuffer = new Buffer(str, 'base64');
        //Decompress data
        zlib.unzip(inputBuffer, function(err, outputBuffer){
            if (!err && outputBuffer) {
                //Covert to string
                var outputStr = outputBuffer.toString();
                callback(false, outputStr);
            } else {
                callback(err);
            }
        });

    });
}

//Truncate a log file
lib.truncate = function(logId, callback){
    fs.truncate(lib.baseDir+logId+'.log', 0, function(err){
        if (!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
}

//Export the module
module.exports = lib;