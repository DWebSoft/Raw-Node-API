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
    hashingSecret: 'ThisIsASecret'
}

//Production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'ThisIsAlsoASecret'
}

//Determine which environment is passed as a command line environment
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that current environment is one that is defined above, default to staging
var envToExport = typeof (environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

module.exports = envToExport;