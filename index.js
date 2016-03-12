/**
 * Node Stone allows javascript developers to create, verify and sign 
 * stones according to the ellcry's standards.
 */

var StoneObj 	= {};
var _ 		 	= require('lodash');
var utility 	= require('./utility');
var Validator 	= require("./validate");
var ursa 		= require("ursa");

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
	stone.signatures = data.signatures || {};
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
	var buf = new Buffer(str, 'utf-8');
	return buf.toString("base64");
}

/**
 * Decode base 64 string to ascii string
 * @param  {string} b64Str base 64 string
 * @return {string}        corresponding ascii string
 */
function fromB64(b64Str) {
	return new Buffer(b64Str, 'base64').toString("ascii");
}

/**
 * Stone object
 */
StoneObj.Stone = function Stone() {
	this.signatures = {};
	this.meta = {};
	this.ownership = {};
	this.attributes = {};
	this.embeds = [];
}

/**
 * Sign a block. The signing process takes the value of a block,
 * converts it to a cononical string equivalent and uses the passed in
 * RSA private key to sign it. Signature generated is included in the 
 * `signatures` block. Empty blocks will not be signed; An empty string will
 * be returned.
 * 
 * @param  {string} blockName  name of block to sign
 * @param  {string} privateKey RSA private key for signing
 * @return {string|Error}      signature if successful, otherwise Error 
 */
StoneObj.Stone.prototype.sign = function (blockName, privateKey) {

	var signatureBaseString = null;
	if (!privateKey || !_.trim(privateKey).length) return new Error("private key is required for signing");

	// load private key
	try { var key = ursa.coercePrivateKey(privateKey); } catch (e) { 
		return (e.message === "Not a private key.") ? new Error("private key is invalid") : new Error("unknown error"); 
	}

	// generate signature base string. Empty blocks will not be signed
	switch(blockName) {

		case "meta":
			if (_.isEmpty(this.meta)) return "";
			signatureBaseString = utility.getCanonicalString(this.meta);
			break;

		case "ownership":
			if (_.isEmpty(this.ownership)) return "";
			signatureBaseString = utility.getCanonicalString(this.ownership);
			break;

		case "attributes":
			if (_.isEmpty(this.attributes)) return "";
			signatureBaseString = utility.getCanonicalString(this.attributes);
			break;

		case "embeds":
			if (_.isEmpty(this.embeds)) return "";
			var _canonicalEmbeds = [];
			_.each(this.embeds, function(embed){ _canonicalEmbeds.push(utility.getCanonicalString(embed)); });
			signatureBaseString = _canonicalEmbeds.join(",");				
			break;

		default:
			return new Error("block unknown");
	}

	// generate signature and update the block's signature
	var signature = key.hashAndSign("sha256", signatureBaseString, "utf8", "hex");
	this.signatures[blockName] = signature;
	return signature
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
	
	var signatureBaseString = null, key = null;
	if (!publicKey || !_.trim(publicKey).length) return new Error("public key is required for signing");
	
	// load key
	try { key = ursa.coercePublicKey(publicKey); } catch(e){
		return (e.message === "Not a public key.") ? new Error("public key is invalid") : new Error("unknown error");
	}

	switch(blockName){

		case "meta":
			if (_.isEmpty(this.meta)) return null;
			signatureBaseString = utility.getCanonicalString(this.meta);
			break;

		case "ownership":
			if (_.isEmpty(this.ownership)) return null;
			signatureBaseString = utility.getCanonicalString(this.ownership);
			break;

		case "attributes":
			if (_.isEmpty(this.attributes)) return null;
			signatureBaseString = utility.getCanonicalString(this.attributes);
			break;

		case "embeds":
			if (_.isEmpty(this.embeds)) return null;
			var _canonicalEmbeds = [];
			_.each(this.embeds, function(embed){ _canonicalEmbeds.push(utility.getCanonicalString(embed)); });
			signatureBaseString = _canonicalEmbeds.join(",");
			break;

		default:
			return new Error("block unknown");
			break;
	}

	// ensure block has signature
	if (!this.hasSignature(blockName)) 
		return new Error("block `"+blockName+"` has no signature");

	try {
		var isVerified = key.hashAndVerify("sha256", new Buffer(signatureBaseString, "utf-8"), this.signatures[blockName], "hex")
		return (isVerified) ? null : new Error("signature verification failed");
	} catch (e) {
		return new Error("signature verification failed");
	}
}

/**
 * Checks whether a block has a signature in the `signatures` block
 * @param  {string}  blockName block name
 * @return {Boolean}           true if signature exist, otherwise false
 */
StoneObj.Stone.prototype.hasSignature = function (blockName) {
	return !!(this.signatures[blockName])
}


/**
 * Returns a JSON representation of the stone instance
 * @return {object} json object 
 */
StoneObj.Stone.prototype.toJSON = function() {
	return {
		signatures: _.cloneDeep(this.signatures),
		meta: _.cloneDeep(this.meta),
		ownership: _.cloneDeep(this.ownership),
		attributes: _.cloneDeep(this.attributes),
		embeds: _.cloneDeep(this.embeds)
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
 * Encode a stone instance to base64
 * @return {string} base 64 encoded representation of the instance
 */
StoneObj.Stone.prototype.encode = function() {
	var stoneJSON = JSON.stringify(this.toJSON());
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
 * @return {}            [description]
 */
StoneObj.create = function (meta, privateKey) {
	if (!privateKey || !_.trim(privateKey).length) return new Error("private key is required for signing");
	var stone = newStone();
	var err = Validator.validateMetaBlock(meta);
	if (err instanceof Error) return err;
	stone.meta = meta;
	var signResult = stone.sign("meta", privateKey);
	if (signResult instanceof Error) return signResult;
	return stone;
}

/**
 * Load a stone from a json object, json string or a base 64 encoded json string.
 * This function will not attempt to sign any stone blocks.
 * If the string passed in starts with "{", it is considered a JSON string, otherwise, it assumes string is base 64 encoded and
 * will attempt to decoded it. 
 * @param  {string|object}	val a str
 * @return {object}         a stone object or an Error object
 */
StoneObj.load = function(val) {

	// load a json string or base64 encoded json string
	if ("string" === typeof val) {
		var stoneStr = _.trim(val);
		if (stoneStr.length == 0) return new Error("cannot load empty string");
		if (stoneStr[0] === "{") return this.loadJSON(stoneStr);
		return this.loadJSON(fromB64(stoneStr));
	}

	// load a json object
	if (_.isPlainObject(val)) {
		var val = _.cloneDeep(val);
		var err = Validator.validate(val);
		return (err instanceof Error) ? err : newStone(val);
	}

	return new Error("unsupported parameter type");
}

/**
 * Given a valid json string representation of a stone, validate it and 
 * return a stone object.
 * @param  {string} str json representation of a stone
 * @return {object}     a stone object if successful, otherwise an Error object
 */
StoneObj.loadJSON = function(str) {
	try {
		var stoneJSON = JSON.parse(str);
		var err = Validator.validate(stoneJSON);
		return (err instanceof Error) ? err : newStone(stoneJSON);
	} catch(e){
		return new Error("failed to load. JSON string is malformed");
	}
}

