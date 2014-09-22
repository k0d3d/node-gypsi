var errors = require('errors'),
    _ = require('lodash');


function createError () {
  errors.create(this);
}

module.exports.init = function () {
  errors.stacks(true);
  var jsondata = require('../config/errors.json');
  _.invoke(jsondata, createError);
  return function (req, res, next) {
    next(); 
  };
};

/**
 * creates a new error object using the
 * errortype as an argument. Errors can be defined
 * in /config/errors.json file
 * @param  {String | Name} errorType the name of the error if 
 * a string is supplied or the number code of an error if a 
 * number is suplied.
 * BUG:: specifying errors by numbers (errors.find) doesnt work. 
 * @return {object}           Error Object
 */
module.exports.nounce = function (errorType) {
  console.log(errorType);
  if (_.isNumber (errorType)) {
    // console.log( new errors.find(errorType));

    return new errors.find(errorType);

  } else if (_.isString(errorType)) {

    return new errors[errorType]();
  }
};

/**
 * creates a new error using a http response 
 * status code as an argument
 * @param  {Number | String} statusCode http response status code
 * @param {string} message optional message
 * @return {object}            error object
 */
module.exports.httpError = function httpError (statusCode, message) {
  var code = 'Http' + statusCode + 'Error';
  return new errors[code](message);
};