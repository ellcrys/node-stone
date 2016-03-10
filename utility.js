/**
 * Utility function
 */

var Utility 	= {};
var _ 		 	= require('lodash');
var bencode 	= require("bencode");
module.exports  = Utility; 


/**
 * Given a json object, it will create a cannonical string 
 * representation of the object using bencode.
 * @param  {object} obj the json object
 * @return {string}     cannonical string
 */
Utility.getCanonicalString = function (obj) {
	return bencode.encode(obj).toString();
}