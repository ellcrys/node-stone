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
	var signaturesBlock = stoneJSON.signatures;
	var ownershipBlock = stoneJSON.ownership;
	var attributesBlock = stoneJSON.attributes;
	var embedsBlock = stoneJSON.embeds;

	// validate meta block
	if (!metaBlock) {
		return new Error("missing `meta` block");
	} else {
		if (!_.isPlainObject(metaBlock)) {
			return new Error("`meta` block value type is invalid. Expects a JSON object");
		} else {
			var vResult = this.validateMetaBlock(metaBlock);
			if (vResult != null) {
				return vResult
			}
		}
	}

	// validate signatures block
	if (!signaturesBlock) {
		return new Error("missing `signatures` block");
	} else {
		if (!_.isPlainObject(signaturesBlock)) {
			return new Error("`signatures` block value type is invalid. Expects a JSON object");
		} else {
			var vResult = this.validateSignaturesBlock(signaturesBlock);
			if (vResult != null) {
				return vResult
			}
		}
	}

	// validate ownership block if provided
	if (ownershipBlock) {
		if (!_.isPlainObject(ownershipBlock)) {
			return new Error("`ownership` block value type is invalid. Expects a JSON object");
		}
		if (!_.isEmpty(ownershipBlock)) {
			if (!signaturesBlock.ownership) {
				return new Error("missing `ownership` property in `signatures` block");
			}
			var vResult = this.validateOwnershipBlock(ownershipBlock);
			if (vResult != null) {
				return vResult
			}
		}
	}

	// validate attributes block if provided
	if (attributesBlock) {
		
		if (!_.isPlainObject(attributesBlock)) {
			return new Error('`attributes` block value type is invalid. Expects a JSON object');
		}

		// since this block will contain arbitrary data, we must
		// ensure no float value is used here
		if (hasFloat(attributesBlock)) {
			return new Error("float value is forbidden");
		}

		if (!_.isEmpty(attributesBlock)) {
			if (!signaturesBlock.attributes) {
				return new Error("missing `attributes` property in `signatures` block");
			}
		}
	}

	// validate embeds block if provided
	if (embedsBlock) {
		
		if (!_.isArray(embedsBlock) || !this.isArrayOfObjects(embedsBlock)) {
			return new Error("`embeds` block value type is invalid. Expects an array of only JSON objects");
		}
		
		// signature block must have embeds property as long as embeds is not empty
		if (embedsBlock.length && !signaturesBlock.embeds){
			return new Error("missing `embeds` property in `signatures` block");
		}

		// validate each embeds. To prevent continous validation of nested embeds,
		// we will temporarily remove the embeds property of each an embeds, validate it and reassign
		// the removed embeds property
		var _embeds = null;
		for (var i = 0; i < embedsBlock.length; i++) {

			// clone embeds info if available
			if (embedsBlock[i].embeds) {
				_embeds = _.cloneDeep(embedsBlock[i].embeds);
				embedsBlock[i].embeds = [];
			}

			var result = this.validate(embedsBlock[i]);
			if (result instanceof Error) {
				return new Error('unable to validate embed at index '+i+'. Reason: ' + result.message);
			}

			// reinitialize embeds if held in _embeds
			if (_embeds)
				embedsBlock[i].embeds = _embeds;
			_embeds = null;
		}
	}

	return null;
}

/**
 * Given a json object, it checks whether the object conforms to the standards a valid signatures block.
 * Rules:
 * * must contain only acceptable properties (meta, ownership, embeds)
 * * `meta` signature must be present and must be a string type
 * * `attributes` property must be string type if set
 * * `ownership` property must be string type if set
 * * `embeds` property must be string type if set
 * @param  {object} signatures object representing the signature information
 * @return {[type]}            will return Error if validation fails or null if no error 
 */
Validator.validateSignaturesBlock = function (signatures) {

	// expect a json object
	if (!_.isPlainObject(signatures)) return new Error("Expects a json object as parameter");

	// must reject unexpected properties
	var accetableProps = ["meta", "ownership", "attributes", "embeds"];
	var unexpectedProps = _.difference(Object.keys(signatures), accetableProps);
	if (unexpectedProps.length > 0) {
		return new Error('`'+unexpectedProps[0] + '` property is unexpected in `signatures` block');
	}

	// must have meta signature and it's value type must be a string
	if (!signatures.meta) {
		return new Error('missing `signatures.meta` property');
	} else if ("string" !== typeof signatures.meta) {
		return new Error('`signatures.meta` value type is invalid. Expects string value')
	}

	// if ownership property is set, it's value type must be a string
	if (signatures.ownership && ("string" !== typeof signatures.ownership)) {
		return new Error('`signatures.ownership` value type is invalid. Expects string value');
	}

	// if attributes property is set, it's value type must be a string
	if (signatures.attributes && ("string" !== typeof signatures.attributes)) {
		return new Error('`signatures.attributes` value type is invalid. Expects string value');
	}

	// if embeds property is set, it's value type must be a string
	if (signatures.embeds && ("string" !== typeof signatures.embeds)) {
		return new Error('`signatures.embeds` value type is invalid. Expects string value');
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
	if (!_.isPlainObject(meta)) return new Error("Expects a json object as parameter");

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
	if ("string" !== typeof meta.id) {
		return new Error('`meta.id` value type is invalid. Expects string value');
	} else if (meta.id.length !== 40) {
		return new Error('`meta.id` must have 40 characters. Preferrable a UUIDv4 SHA1 hashed string');
	}

	// type property must be a string
	if ("string" !== typeof meta.type) {
		return new Error('`meta.type` value type is invalid. Expects string value');
	}

	// created_at must be a number and a valid unix date in the past but not before a start/launch time
	if (!_.isInteger(meta.created_at)) {
		return new Error('`meta.created_at` value type is invalid. Expects an integer')
	} else if (moment.unix(meta.created_at).isBefore(START_TIME)) {
		return new Error('`meta.created_at` value is too far in the past. Expects unix time on or after ' + START_TIME.format())
	} else if (moment.unix(meta.created_at).isAfter(moment())) {
		return new Error('`meta.created_at` value cannot be a unix time in the future')
	}

	return null
}

/**
 * Given a json object, it checks whether the object conforms to the standards a valid ownership block.
 * Rules:
 * * Must not contain unknown properties
 * * A valid ownership block can only contain type, sole and status properties.
 * * ownership.type must be set, value type must be a string and value must be known
 *   - if ownership.type is 'sole':
 *     - ownership.sole must be set to an object
 *     - ownership.sole.address_id must be set and it must be a string
 * * ownership.status is optional, but if set
 *   - ownership.status must be a string value. The value must also be known
 *     
 * @param  {object} ownership 	 an object that represents a stone's ownership information
 * @return {[type]}      [description]
 */
Validator.validateOwnershipBlock = function (ownership) {

	// expect a json object
	if (!_.isPlainObject(ownership)) return new Error("Expects a json object as parameter");

	// must reject unexpected properties
	var accetableProps = ["type", "sole", "status"];
	var unexpectedProps = _.difference(Object.keys(ownership), accetableProps);
	if (unexpectedProps.length > 0) {
		return new Error('`'+unexpectedProps[0] + '` property is unexpected in `ownership` block');
	}

	// type property must be set
	if (!ownership.type) {
		return new Error('`ownership` block is missing `type` property');
	} else {
		if ("string" !== typeof ownership.type) {
			return new Error('`ownership.type` value type is invalid. Expects string value');
		}
		var allowedValues = ["sole"];
		if (_.indexOf(allowedValues, ownership.type) === -1) {
			return new Error('`ownership.type` property has unexpected value');
		}
	}

	// when ownership.type is `sole`, `sole` property is required
	if (ownership.type === 'sole' && !ownership.sole) {
		return new Error('`ownership` block is missing `sole` property');
	} else {
		if (!_.isPlainObject(ownership.sole)) {
			return new Error('`ownership.sole` value type is invalid. Expects a JSON object');
		}
		if (!ownership.sole.address_id) {
			return new Error('`ownership.sole` property is missing `address_id` property');
		}
		if ("string" !== typeof ownership.sole.address_id) {
			return new Error('`ownership.sole.address_id` value type is invalid. Expects string value');
		}
	}

	// if `status` property it's value type must be string
	// and it's value must be acceptable
	if (ownership.status) {
		if ("string" !== typeof ownership.status) {
			return new Error('`ownership.status` value type is invalid. Expects string value');
		}
		var allowedValues = ["transferred"];
		if (_.indexOf(allowedValues, ownership.status) === -1) {
			return new Error('`ownership.status` property has unexpected value');
		}
	}

	return null
}
