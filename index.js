/**
 * Node Stone allows javascript developers to create, verify and sign 
 * stones according to the ellcry's standards.
 */

var StoneObj 	= {};
var _ 		 	= require('lodash');
var utility 	= require('./utility');
var Validator 	= require("./validate");
var ursa 		= require("ursa");
var base64      = require("base64url");
var blockNames  = ["meta", "ownership", "attributes", "embeds"];
var Promise 	= require('bluebird');

module.exports = StoneObj;

/**
 * Initialize a new Stone object. Validation of blocks is not performed.
 * So a stone created using this method may not be valid. Use the validator
 * to perform necessary checks.
 * 
 * @param  {object} data new stone object
 * @return {object}      new Stone instance
 */
function newStone(data) {
	var data = data || {};
	var stone = new StoneObj.Stone();
	stone.meta = data.meta || {};
	stone.ownership = data.ownership || {};
	stone.attributes = data.attributes || {};
	stone.embeds = data.embeds || [];
	return stone;
}

/**
 * Base 64 encode a string
 * @param  {string} str string to encode
 * @return {string}     base64 string
 */
function toB64(str) {
	return base64.encode(str);
}

/**
 * Decode base 64 string to ascii string
 * @param  {string} b64Str base 64 string
 * @return {string}        corresponding ascii string
 */
function fromB64(b64Str) {
	return base64.decode(b64Str)
}

/**
 * Given a valid json string representation of a stone, validate it and 
 * return a stone object.
 * @param  {string} str json representation of a stone
 * @return {object}     a stone object if successful, otherwise an Error object
 */
function loadJSON(str) {
	try {
		var stoneJSON = JSON.parse(str);
		var err = Validator.validate(stoneJSON);
		return (err instanceof Error) ? err : newStone(stoneJSON);
	} catch(e){
		return new Error("failed to load. JSON string is malformed");
	}
}

/**
 * Stone object
 */
StoneObj.Stone = function Stone() {
	this.meta = {};
	this.ownership = {};
	this.attributes = {};
	this.embeds = [];
	this.signatures = {};
}

/**
 * Sign a block. The signing process takes the value of a block and signs
 * it using JWS. The signature generated is included in the 
 * `signatures` block. If a block is empty or unknown, an error is returned 
 * 
 * @param  {string} blockName  name of block to sign
 * @param  {string} privateKey RSA private key for signing
 * @return {string|Error}      signature if successful, otherwise Error 
 */
StoneObj.Stone.prototype.sign = function (blockName, privateKey) {
	return new Promise(function(resolve, reject){

		var signature = null;

		// private key is required
		if (!privateKey || !_.trim(privateKey).length) return reject(new Error("private key is required for signing"));

		// load private key
		if (!utility.isValidRSAPrivatekKey(privateKey)) return reject(new Error("private key is invalid")); 

		// check if block name is valid
		if (_.indexOf(blockNames, blockName) === -1) return reject(new Error("block unknown"));

		// cannot sign empty block
		if (_.isEmpty(this[blockName])) return reject(new Error("cannot sign empty block"));

		// generate signature 
		utility.createRSASig(privateKey, JSON.stringify(this[blockName])).then(function(signature){
			this.signatures[blockName] = signature;
			resolve(signature);
		}.bind(this)).catch(reject);

	}.bind(this));
}

/**
 * Verifies the signature of a block. It will compute the signature of a
 * block and compare it with the signature stored in the signatures block.
 * It will return null when verification is passed or when the block to check is empty.
 * An instance of Error is returned when verification fails.
 * 
 * @param  {string} blockName 		block name
 * @param  {string} publicKey 		public key for verification
 * @return {Error|null}             null is returned if successful, otherwise an Error object
 */
StoneObj.Stone.prototype.verify = function (blockName, publicKey) {
	return new Promise(function(resolve, reject){

		// public key is required
		if (!publicKey || !_.trim(publicKey).length) return reject(new Error("public key is required for verifying"));
		
		// check key validity
		if (!utility.isValidRSAPublickKey(publicKey)) return reject(new Error("public key is invalid"));

		// check if block name is valid
		if (_.indexOf(blockNames, blockName) === -1) return reject(new Error("block unknown"));
		
		// ensure block has signature
		if (!this.hasSignature(blockName)) return reject(new Error("block `"+blockName+"` has no signature"));

		// verify an RSA signature
		utility.verifyRSASig(publicKey, this.signatures[blockName]).then(function(result){
			return (result.verified) ? resolve(true) : resolve(false);
		}).catch(reject);

	}.bind(this));
}

/**
 * Returns a JSON representation of the stone instance
 * @return {object} json object 
 */
StoneObj.Stone.prototype.toJSON = function() {
	return {
		meta: _.clone(this.meta),
		ownership: _.cloneDeep(this.ownership),
		attributes: _.cloneDeep(this.attributes),
		embeds: _.cloneDeep(this.embeds),
		signatures: _.clone(this.signatures)
	}
}

/**
 * Checks if the stone instance current state is considered valid
 * @return {boolean} true if valid, otherwise false
 */
StoneObj.Stone.prototype.isValid = function() {
	return !(Validator.validate(this.toJSON()) instanceof Error)
}

/**
 * Encode a base64 url equivalent of the instance signatures
 * @return {string} base 64 encoded representation of the instance
 */
StoneObj.Stone.prototype.encode = function() {
	var stoneJSON = JSON.stringify(this.toJSON().signatures);
	return toB64(stoneJSON);
}

/**
 * Create an identical instance
 * @return {Stone} new stone object
 */
StoneObj.Stone.prototype.clone = function() {
	var stoneJSON = this.toJSON();
	return StoneObj.load(stoneJSON);
}

/**
 * Checks if the instance content in the ownership block
 * @return {Boolean} true if content is available, otherwise false
 */
StoneObj.Stone.prototype.hasOwnership = function() {
	return !_.isEmpty(this.ownership);
}

/**
 * Checks if the instance content in the attributes block
 * @return {Boolean} true if content is available, otherwise false
 */
StoneObj.Stone.prototype.hasAttributes = function() {
	return !_.isEmpty(this.attributes);
}

/**
 * Checks if the instance content in the embeds block
 * @return {Boolean} true if content is available, otherwise false
 */
StoneObj.Stone.prototype.hasEmbeds = function() {
	return !_.isEmpty(this.embeds);
}

/**
 * Check whether a block has a signature
 * @param  {string}  blockName block name
 * @return {Boolean}           true if signature exists, otherwise false
 */
StoneObj.Stone.prototype.hasSignature = function (blockName) {
	return (this.signatures[blockName]) ? true : false; 
}

/**
 * Initialize meta block with new value. New value 
 * is validated and signed.
 * @param {object} meta       meta information
 * @param {string} privateKey private key for signing
 */
StoneObj.Stone.prototype.addMeta = function (meta, privateKey) {
	var result = Validator.validateMetaBlock(meta);
	if (result instanceof Error) return result;
	this.meta = meta;
	var sig = this.sign("meta", privateKey);
	return (sig instanceof Error) ? sig : null
}

/**
 * Initialize ownership block with new value. New value 
 * is validated and signed.
 * @param {object} ownership       ownership information
 * @param {string} privateKey private key for signing
 */
StoneObj.Stone.prototype.addOwnership = function (ownership, privateKey) {
	var result = Validator.validateOwnershipBlock(ownership);
	if (result instanceof Error) return result;
	this.ownership = ownership;
	var sig = this.sign("ownership", privateKey);
	return (sig instanceof Error) ? sig : null
}

/**
 * Initialize attributes block with new value. New value 
 * is validated and signed.
 * @param {object} attributes       attributes information
 * @param {string} privateKey private key for signing
 */
StoneObj.Stone.prototype.addAttributes = function (attributes, privateKey) {
	if (!_.isPlainObject(attributes)) return new Error('`attributes` block value type is invalid. Expects a JSON object');
	this.attributes = attributes;
	var sig = this.sign("attributes", privateKey);
	return (sig instanceof Error) ? sig : null
}

/**
 * Append a new embed object to the embeds block
 * @param {object} ownership       ownership information
 * @param {string} privateKey private key for signing
 */
StoneObj.Stone.prototype.addEmbed = function (embed, privateKey) {
	var result = Validator.validate(embed);
	if (result instanceof Error) return result;
	this.embeds.push(embed);
	var sig = this.sign("embeds", privateKey);
	return (sig instanceof Error) ? sig : null
}

/**
 * Create a new stone with a valid meta block that
 * is also signed. 
 * 
 * @param  {object} meta       meta block value
 * @param  {string} privateKey issuer private
 * @return {Promise}            [description]
 */
StoneObj.create = function (meta, privateKey) {
	return new Promise(function(resolve, reject){

		// private key is required
		if (!privateKey || !_.trim(privateKey).length) return reject(new Error("private key is required for signing"));

		// create new stone
		var stone = newStone();

		// validate meta block
		var err = Validator.validateMetaBlock(meta);
		if (err instanceof Error) return reject(err);

		// assign meta to stone.meta
		stone.meta = meta;

		// sign meta block
		stone.sign("meta", privateKey).then(function(signature){
			resolve(stone);
		}).catch(reject);
	});
}

/**
 * Load a stone from a json object.
 * This function will not attempt to sign any stone blocks.
 * String begining with "{" will be passed to JSON.parse.
 *  
 * @param  {string|object}	val a str
 * @return {object}         	a stone object or an Error object
 */
StoneObj.load = function(val) {

	// load a json string
	if ("string" === typeof val) {
		var stoneStr = _.trim(val);
		if (stoneStr.length == 0) return new Error("cannot load empty string");
		if (stoneStr[0] === "{") return loadJSON(stoneStr);
	}

	// load a json object
	if (_.isPlainObject(val)) {
		var val = _.cloneDeep(val);
		var err = Validator.validate(val);
		return (err instanceof Error) ? err : newStone(val);
	}

	return new Error("unsupported parameter");
}

/**
 * Given an encoded signed stone, it will attempt to
 * decode and load the underlying stone object.
 * @param  {string} val base64 url encoded stone 
 * @return {[type]}     [description]
 */
StoneObj.decode = function(val) {

	var signatures = null;
	var signedStone = fromB64(val);
	var curBlock = null;
	var stone = newStone();

	try {

		// parse signed stone signatures object to json
		signatures = JSON.parse(signedStone);

		// process meta signature if available
		if (signatures.meta) {
			var result = utility.getJWSPayload(signatures.meta);
			if (result instanceof Error) return result;
			curBlock = "meta";
			var block = JSON.parse(result);
			stone.meta = block;
			stone.signatures.meta = signatures.meta;
		}

		// process ownership signature if available
		if (signatures.ownership) {
			var result = utility.getJWSPayload(signatures.ownership);
			if (result instanceof Error) return result;
			curBlock = "ownership";
			var block = JSON.parse(result);
			stone.ownership = block;
			stone.signatures.ownership = signatures.ownership;
		}

		// process attributes signature if available
		if (signatures.attributes) {
			var result = utility.getJWSPayload(signatures.attributes);
			if (result instanceof Error) return result;
			curBlock = "attributes";
			var block = JSON.parse(result);
			stone.attributes = block;
			stone.signatures.attributes = signatures.attributes;
		}

		// process embeds signature if available
		if (signatures.embeds) {
			var result = utility.getJWSPayload(signatures.embeds);
			if (result instanceof Error) return result;
			curBlock = "embeds";
			var block = JSON.parse(result);
			stone.embeds = block;
			stone.signatures.embeds = signatures.embeds;
		}

		return stone;

	} catch(e){
		return new Error("failed to decode" + ((!curBlock) ? "" : (": invalid " + curBlock + " signature")))
	}
}
