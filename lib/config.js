/**
 * File that contain all config variables
 * for different environments
 */
var environments = {}

//Staging environment
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging',
    hashingSecret: 'ThisIsASecret',
    maxChecks: 5,
    twilio: {
        'accountSid': 'ACa17ffbe1703027c703c221b27d17f513',
        'authToken': '5c0b8e7e58898533d4e4b8e88d8d0536',
        'fromPhone': '+13183107249'
    }
}

//Production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'ThisIsAlsoASecret',
    maxChecks: 5,
    twilio: {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
}

//Determine which environment is passed as a command line environment
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that current environment is one that is defined above, default to staging
var envToExport = typeof (environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

module.exports = envToExport;