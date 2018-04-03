/**
 * Library for storing and editing data
*/

//Dependencies
var fs = require('fs');
var path = require('path');

//Container of the module (to be exported)
var lib = {};

//Crate a base directory for data folder
lib.baseDir = path.join(__dirname,'/../.data/');

//Write data to file
/**
 * 
 * @param {String} dir Table Name
 * @param {String} file Document
 * @param {any} data Data to be stored
 * @param {function} callback Error Callback
 */
lib.create  = function(dir, file, data, callback){
    //Open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err, fd) => {
        if (!err && fd) {
            //Strigify the JSON data
            var stringData = JSON.stringify(data);

            //Write the file and close it
            fs.writeFile(fd, stringData, (err) => {
                if (!err) {
                    //Close the file
                    fs.close(fd, () => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create a new file, it may already exists');
        }
    });
};

//Read the file
lib.read = function(dir, file, callback){
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => {
        callback(err, data);
    });
};

//Update the file
lib.update = function(dir, file, data, callback){
    //Open the file
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fd) => {
        if (!err && fd) {
            //Strigify the JSON data
            var stringData = JSON.stringify(data);

            //Write the file and close it
            fs.writeFile(fd, stringData, (err) => {
                if (!err) {
                    //Close the file
                    fs.close(fd, () => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing the file');
                        }
                    });
                } else {
                    callback('Error updating file');
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exists');
        }
    });  
};

//Delete the file
lib.delete = function(dir, file, callback){
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
        if (!err ) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

//Export the module
module.exports = lib;