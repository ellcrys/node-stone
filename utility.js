/**
 * Utility function
 */

var Utility 	= {};
var _ 		 	= require('lodash');
var Readable 	= require('stream').Readable;
var Promise     = require('bluebird');
var jws 		= require('jws');
module.exports  = Utility; 

/**
 * Create a string stream
 * @param  {string} str stream content
 * @return {object}     readable stream
 */
Utility.stringStream = function (str) {
	var stream = new Readable();
	stream.push(str)
	stream.push(null)
	return stream
}

/**
 * Create signature using JWS
 * @param  {string}   privateKey RSA private key
 * @param  {object}   payload    object to sign
 * @return {Promise}             
 */
Utility.createRSASig = function(privateKey, payload){
	return new Promise(function(resolve, reject){
		jws.createSign({
			header: { alg: 'RS256' },
		  	privateKey: Utility.stringStream(privateKey),
		  	payload: Utility.stringStream(payload)
		}).on('done', function(signature){
			resolve(signature)
		}).on('error', reject);
	});
}