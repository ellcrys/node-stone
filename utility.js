/**
 * Utility function
 */

var Utility 	= {};
var _ 		 	= require('lodash');
var Readable 	= require('stream').Readable;
var Promise     = require('bluebird');
var jws 		= require('jws');
var ursa 		= require('ursa');
var base64      = require("base64url");
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
 * Create signature using JWS and RSA
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

/**
 * Verify a JWS RSA signature 	
 * @param  {string} pubKey    RSA public key
 * @param  {string} signature the signature to be verified
 * @return {Promise}          
 */
Utility.verifyRSASig = function(publicKey, signature) {
	return new Promise(function(resolve, reject){
		jws.createVerify({
			algorithm: 'RS256',
			publicKey: Utility.stringStream(publicKey),
		  	signature: Utility.stringStream(signature)
		}).on('done', function(verified, obj) {
			resolve({ verified: verified, obj: obj});
		}).on('error', reject);
	});
}

/**
 * Check whether public key is valid
 * @param  {string}  key public key (PEM format)
 * @return {Boolean}     true if valie, otherwise false
 */
Utility.isValidRSAPublickKey = function(key) {
	try { 
		ursa.coercePublicKey(key); 
		return true;
	} catch(e){
		return false;
	}
}

/**
 * Check whether private key is valid
 * @param  {string}  key public key (PEM format)
 * @return {Boolean}     true if valie, otherwise false
 */
Utility.isValidRSAPrivatekKey = function(key) {
	try { 
		ursa.coercePrivateKey(key); 
		return true;
	} catch(e){
		return false;
	}
}

/**
 * Given a JWS compact signature, it returns the 
 * decoded version of the payload section
 * 	
 * @param  {string} signature JWS compact signature
 * @return {string|Error}           decoded payload or Error 
 */
Utility.getJWSPayload = function(signature) {
	var parts;
	if ("string" !== typeof signature) return new Error("expects string as parameter");
	parts = signature.split(".");
	if (parts.length !== 3) return new Error("parameter is not a valid JWS signature");
	return base64.decode(parts[1]);
}