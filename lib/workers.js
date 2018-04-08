/**
 * Workers realted tasks
 */

//Dependencies
var fs = require('fs');
var path = require('path');
var _data = require('./data');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var url = require('url');

//Instantiate worker object
var workers = {};

//Lookup all checks, get their data, send to validator
workers.gatherAllChecks = function(){
    //Get all checks
    _data.list('checks', function(err, checks){
        if (!err && checks && checks.length > 0){
            checks.forEach(function(check){
                //Read check
                _data.read('checks', check, function(err, originalCheckData){
                    if (!err && originalCheckData) {
                        //Pass it to validator, and let that function continue or log error on its own
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log("Error reading data for following check: "+check);
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process');
        }
    });
};

//Validator
workers.validateCheckData = function(checkData){
    checkData = typeof(checkData) == 'object' && checkData !== null ? checkData : {};
    checkData.id = typeof (checkData.id) == 'string' && checkData.id.trim().length == 20 ? checkData.id.trim() : false;
    checkData.userPhone = typeof (checkData.userPhone) == 'string' && checkData.userPhone.trim().length == 10 ? checkData.userPhone.trim() : false;
    checkData.protocol = typeof (checkData.protocol) == 'string' && ['http', 'https'].indexOf(checkData.protocol) > -1 ? checkData.protocol : false;
    checkData.url = typeof (checkData.url) == 'string' && checkData.url.trim().length > 0 ? checkData.url.trim() : false;
    checkData.method = typeof (checkData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1 ? checkData.method : false;
    checkData.successCodes = typeof (checkData.successCodes) == 'object' && checkData.successCodes instanceof Array ? checkData.successCodes : false;
    checkData.timeoutSeconds = typeof (checkData.timeoutSeconds) == 'number' && checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;

    //Set the keys that may not be set (workers have never seen this check before)
    checkData.state = typeof (checkData.state) == 'string' && ['up', 'down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof (checkData.lastChecked) == 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;

    //If all data validated, pass it to next process
    if (checkData.id && 
        checkData.protocol &&
        checkData.url &&
        checkData.userPhone &&
        checkData.method &&
        checkData.successCodes &&
        checkData.timeoutSeconds
    ) {
        workers.performCheck(checkData);
    } else {
        console.log('Error in validating data for following check, skipped it: ' + checkData.id);
    }  
}

//Perform check and send the checkData and outcome of the check to the next process
workers.performCheck = function (checkData){
    //Prepare intial check outcome
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    }

    //Mark that outcome has not been sent yet
    var outcomeSent = false;

    //Parse the hostname and path out of the check data
    var parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path; //Using path and not pathname because we want query string

    //Construct the request
    var requestDetails = {
        'protocol' : checkData.protocol + ":",
        'hostname' : hostname,
        'method' : checkData.method.toUpperCase(),
        'path' : path,
        'timeout' : checkData.timeoutSeconds * 1000
    }

    //Instantiate the request object (using either the http and https module)
    var _moduleToUse = checkData.protocol == 'http' ? http : https;
    var req = _moduleToUse.request(requestDetails, function(res){
        //Grab the status
        var status = res.statusCode;
       
        //Update the outcome and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
        }
    });

    //Bind the error event so it does not get thrown
    req.on('error', function(e){
        //Update the outcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : e
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
        }
    });

    //Bind to timeout event
    req.on('timeout', function (e) {
        //Update the outcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
        }
    });

    //End the request
    req.end();
}

//Process the outcome, update the checkdata as needed and trigger the alert if any
//Special logic for accomodating the check that has never been teste before
workers.processCheckOutcome = function(checkData, checkOutcome){
    //console.log('Check outcome ' +checkData.id +' : ', checkOutcome);
    //Decide if check is considered up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && checkData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    //Decide if alert is warranted
    var alertWarranted = checkData.lastChecked && checkData.state != state ? true : false;

    //Update the check data
    var newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    //Save the update
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if (!err) {
            //send the new check data to next phase if needed
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log(`Outcome for check id ${newCheckData.id} has not changed, no alert needed`);
            }
        } else {
            console.log('Error trying to update the check: ' + newCheckData.id);
        }
    });

};

//Alert the user to a change in their check status
workers.alertUserToStatusChange = function(newCheckData){
    var msg = "Alert: Your check for " + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + "://" + newCheckData.url + " is currently " + newCheckData.state;
    //Send sms
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
        if (!err) {
            console.log("User " + newCheckData.userPhone + " was alerted for status change in their check " + newCheckData.id + 'via sms ', msg);
        } else {
            console.log("Error in alerting user " + newCheckData.userPhone + " for status change in their check " + newCheckData.id);
        }
    });
};

//The loop
workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    },1000 * 60);
}

//Init script
workers.init = function(){
    //Execute all scripts immediately
    workers.gatherAllChecks();

    //Call the loop so checks execute later on
    workers.loop();
};

//Export worker object
module.exports = workers;
