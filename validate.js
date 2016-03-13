/**
 * Validate module contains functions required
 * to perform stone comformity checks against the Ellcrys stone
 * standard
 */

var Validator = {};
var _ 		  = require('lodash');
var moment 	  = require('moment');
var hasFloat  = require('has-float');
module.exports 	  = Validator;

// Ellcrys start time. Stones must never be created before this time
var START_TIME = moment.unix(1453975575);

/**
 * Set start time
 * @param {Number} unixTime unix time
 */
Validator.setStartTime = function(unixTime) {
	START_TIME = moment.unix(unixTime)
}

/**
 * Get start time
 * @return {Number} start time value
 */
Validator.getStartTime = function() {
	return START_TIME.unix();
}

/**
 * Given a value, it checks whether value is an array of objects.
 * @param  {[type]}  val value or variable to check
 * @return {Boolean}     true if value is an array of objects, otherwise, false
 */
Validator.isArrayOfObjects = function(val) {
	if (!_.isArray(val)) return false;
	for (var i = 0; i < val.length; i++) {
		if (!_.isPlainObject(val[i])) 
			return false;
	}
	return true;
}

/**
 * Given a stone in , it checks whether 
 * the stone passes for a valid Ellcrys stone.
 * @param  {object} stoneJSON 	the stone as a json object
 * @return {object|null}        null if valid, otherwise an Error object
 */
Validator.validate = function(stoneJSON) {

	// expect a json object
	if (!_.isPlainObject(stoneJSON)) return new Error("Expects a json object as parameter");

	var metaBlock = stoneJSON.meta;
	var ownershipBlock = stoneJSON.ownership;
	var attributesBlock = stoneJSON.attributes;
	var embedsBlock = stoneJSON.embeds;

	// meta block is required
	if (!metaBlock) {
		return new Error("missing `meta` block");
	} else {
		if (!_.isPlainObject(metaBlock)) return new Error("`meta` block value type is invalid. Expects a JSON object");
		var vResult = this.validateMetaBlock(metaBlock);
		if (vResult != null) return vResult;
	}

	// validate ownership block if provided
	if (ownershipBlock) {
		if (!_.isPlainObject(ownershipBlock)) return new Error("`ownership` block value type is invalid. Expects a JSON object");
		if (!_.isEmpty(ownershipBlock)) {
			var vResult = this.validateOwnershipBlock(ownershipBlock);
			if (vResult != null) return vResult;
		}
	}

	// validate attributes block if provided
	if (attributesBlock) {
		if (!_.isPlainObject(attributesBlock)) return new Error('`attributes` block value type is invalid. Expects a JSON object');
		if (!_.isEmpty(attributesBlock)) {
			var vResult = this.validateAttributesBlock(attributesBlock);
			if (vResult != null) return vResult;
		}
	}

	// validate embeds block if provided
	if (embedsBlock) {
		if (!_.isPlainObject(embedsBlock)) return new Error('`embeds` block value type is invalid. Expects a JSON object');
		if (!_.isEmpty(embedsBlock)) {
			var vResult = this.validateEmbedsBlock(embedsBlock);
			if (vResult != null) return vResult;
		}
	}

	return null;
}

/**
 * Given a json object, it checks whether the object conforms to the standards a valid meta block.
 * Rules:
 * * Must not contain unknown properties
 * * A valid meta block must contain id, type and created_at properties.
 * * id must be string and 40 characters in length
 * * type must be string
 * * created_at must be a number and a valid unix date in the past but not beyond a start/launch time
 *    
 * @param  {object} 		meta an object that represents a stone's meta information
 * @return {object|null}	will return Error if validation fails or null if no error 
 */
Validator.validateMetaBlock = function (meta) {

	// expect a json object
	if (!_.isPlainObject(meta)) return new Error("`meta` block value type is invalid. Expects a JSON object");

	// must reject unexpected properties
	var accetableProps = ["id", "type", "created_at"];
	var unexpectedProps = _.difference(Object.keys(meta), accetableProps);
	if (unexpectedProps.length > 0) {
		return new Error('`'+unexpectedProps[0] + '` property is unexpected in `meta` block');
	}

	// must contain acceptable properties such as id, type and created_at
	for (var i = 0; i < accetableProps.length; i++) {
		if (_.indexOf(Object.keys(meta), accetableProps[i]) === -1) {
			return new Error('`meta` block is missing `'+accetableProps[i]+'` property');
		}
	}

	// id property must be a string and 40 characters in length
	if ("string" !== typeof meta.id) return new Error('`meta.id` value type is invalid. Expects string value');
	if (meta.id.length !== 40) return new Error('`meta.id` must have 40 characters. Preferrable a UUIDv4 SHA1 hashed string');

	// type property must be a string
	if ("string" !== typeof meta.type) return new Error('`meta.type` value type is invalid. Expects string value');

	// created_at must be a number and a valid unix date in the past but not before a start/launch time
	if (!_.isNumber(meta.created_at)) return new Error('`meta.created_at` value type is invalid. Expects an integer');
	if (moment.unix(meta.created_at).isBefore(START_TIME)) return new Error('`meta.created_at` value is too far in the past. Expects unix time on or after ' + START_TIME.format());
	if (moment.unix(meta.created_at).isAfter(moment())) return new Error('`meta.created_at` value cannot be a unix time in the future');

	return null
}

/**
 * Given an array of stones, it will validate every stone. To prevent
 * deeper levels of validation of nested stones found in individual stone embeds block,
 * it will temporarily remove the embeds property of each stone, validate it and reassign
 * the removed embeds property.
 * Rules:
 * * expects a json object as parameter
 * * must not contain expected properties other than `ref_id` and `data`
 * * ref_id must be set and should have a string value
 * * 
 * 
 * @param  {object} 		embeds 	an object that represents a stone's embeds information
 * @return {object|null}			will return Error if validation fails or null if no error
 */
Validator.validateEmbedsBlock = function (embeds) {

	// expect a json object
	if (!_.isPlainObject(embeds)) return new Error('`embeds` block value type is invalid. Expects a JSON object');

	// must reject unexpected properties
	var unexpectedProps = _.difference(Object.keys(embeds), ["ref_id", "data"]);
	if (unexpectedProps.length > 0) {
		return new Error('`'+unexpectedProps[0] + '` property is unexpected in `embeds` block');
	}

	// ref id property must be set and value type must be string
	if (!embeds.ref_id) return new Error('`embeds` block is missing `ref_id` property');
	if ("string" !== typeof embeds.ref_id) return new Error('`embeds.ref_id` value type is invalid. Expects string value');

	// data property must be set and value type must be an array of objects
	if (!embeds.data) return new Error('`embeds` block is missing `data` property');
	if (!_.isArray(embeds.data) || !this.isArrayOfObjects(embeds.data)) return new Error("`embeds.data` value type is invalid. Expects an array of JSON objects");

	var embeds = embeds.data;
	var _embeds = null;
	for (var i = 0; i < embeds.length; i++) {

		// clone embeds info if available
		if (embeds[i].embeds) {
			_embeds = _.cloneDeep(embeds[i].embeds);
			embeds[i].embeds = null;
		}

		var result = this.validate(embeds[i]);
		if (result instanceof Error) {
			return new Error('unable to validate embed at index '+i+'. Reason: ' + result.message);
		}

		// reinitialize embeds if held in _embeds
		if (_embeds)
			embeds[i].embeds = _embeds;
		_embeds = null;
	}

	return null
}

/**
 * Given a json object, it checks whether the object conforms to the standards an attributes block.
 * Rules:
 * * Must not contain unknown properties
 * * A valid attributes block must contain ref_id and data properties.
 * * ref_id property must be a string
 *    
 * @param  {object} 		attributes 	an object that represents a stone's attributes information
 * @return {object|null}				will return Error if validation fails or null if no error 
 */
Validator.validateAttributesBlock = function (attributes) {

	// expect a json object
	if (!_.isPlainObject(attributes)) return new Error("ownership` block value type is invalid. Expects a JSON object");

	// must reject unexpected properties
	var unexpectedProps = _.difference(Object.keys(attributes), ["ref_id", "data"]);
	if (unexpectedProps.length > 0) return new Error('`'+unexpectedProps[0] + '` property is unexpected in `attributes` block');

	// ref id property must be set and it's value type must be string
	if (!attributes.ref_id) return new Error('`attributes` block is missing `ref_id` property');
	if ("string" !== typeof attributes.ref_id) return new Error('`attributes.ref_id` value type is invalid. Expects string value');

	// since ref id is set, then data property is required
	if (!attributes.data) return new Error('`attributes` block is missing `data` property');

	return null
}

/**
 * Given a json object, it checks whether the object conforms to the standards a valid ownership block.
 * Rules:
 * * Must not contain unknown properties
 * * Must contain ref id and it must be a string
 * * A valid ownership block can only contain type, sole and status properties.
 * * ownership.type must be set, value type must be a string and value must be known
 *   - if ownership.type is 'sole':
 *     - ownership.sole must be set to an object
 *     - ownership.sole.address_id must be set and it must be a string
 * * ownership.status is optional, but if set
 *   - ownership.status must be a string value. The value must also be known
 *     
 * @param  {object} ownership 	 	an object that represents a stone's ownership information
 * @return {[type]}      			will return Error if validation fails or null if no error 
 */
Validator.validateOwnershipBlock = function (ownership) {

	// expect a json object
	if (!_.isPlainObject(ownership)) return new Error("`ownership` block value type is invalid. Expects a JSON object");

	// must reject unexpected properties
	var unexpectedProps = _.difference(Object.keys(ownership), ["ref_id", "type", "sole", "status"]);
	if (unexpectedProps.length > 0) return new Error('`'+unexpectedProps[0] + '` property is unexpected in `ownership` block');

	// ref id property must be set and it's value type must be string
	if (!ownership.ref_id) return new Error('`ownership` block is missing `ref_id` property');
	if ("string" !== typeof ownership.ref_id) return new Error('`ownership.ref_id` value type is invalid. Expects string value');

	// type property must be set and it's value type must be string
	if (!ownership.type) return new Error('`ownership` block is missing `type` property');
	if ("string" !== typeof ownership.type) return new Error('`ownership.type` value type is invalid. Expects string value');

	// ownership.type must contain a known value
	if (_.indexOf(["sole"], ownership.type) === -1) return new Error('`ownership.type` property has unexpected value');

	// when ownership.type is `sole`, `sole` property is required.
	// `ownership.sole` must be a json object. and must have `address_id` property.
	// `ownership.sole.address_id value type must be string.`
	if (ownership.type === 'sole' && !ownership.sole) return new Error('`ownership` block is missing `sole` property');
	if (!_.isPlainObject(ownership.sole)) return new Error('`ownership.sole` value type is invalid. Expects a JSON object');
	if (!ownership.sole.address_id) return new Error('`ownership.sole` property is missing `address_id` property');
	if ("string" !== typeof ownership.sole.address_id) return new Error('`ownership.sole.address_id` value type is invalid. Expects string value');

	// if `status` property is set, it's value type must be string
	// and it's value must be a known value
	if (ownership.status) {
		if ("string" !== typeof ownership.status) return new Error('`ownership.status` value type is invalid. Expects string value');
		if (_.indexOf(["transferred"], ownership.status) === -1) return new Error('`ownership.status` property has unexpected value');
	}

	return null
}
