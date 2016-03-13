var test = require('tape'),
	validator = require("../validate"),
	moment = require('moment'),
	_ = require('lodash'),
	fx = require('node-fixtures');

validator.setStartTime(1453975575);

test('.validate()', function (t) {

	t.test('call .validate() with invalid parameters', function(st){
		var cases = [
	    	{	param: 2, expected: "Expects a json object as parameter", msg: "parameter must be a json object" }
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validate(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});

	t.test('call .validate() with objects that have a missing block', function(st){
		var cases = [
			{	param: {}, expected: "missing `meta` block", msg: "meta block is missing" },
			{	param: fx.stones.missingBlocks[0], expected: "missing `meta` block", msg: "meta block is missing" },
		];
		for (var i=0; i < cases.length; i++) {
	    	var result = validator.validate(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});

	t.test('call .validate() with various invalid attributes block value', function(st){
		fx.stones.invalid[0].meta.created_at = moment().unix();
		var cases = [
	    	{ param: fx.stones.invalid[0], expected: "`attributes` block value type is invalid. Expects a JSON object", msg: "attributes block value type must be a json object" },
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validate(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});

	t.test('call .validate() with various invalid embeds block value', function(st){
		fx.stones.invalid[1].meta.created_at = moment().unix();
		var cases = [
	    	{ param: fx.stones.invalid[1], expected: "`embeds` block value type is invalid. Expects a JSON object", msg: "embeds block value type must be a json object" },
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validate(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});

});

test('.validateMetaBlock()', function(t){

	t.test('call .validateMetaBlock() with invalid parameters', function(st){

		fx.meta.invalid[7] = _.clone(fx.meta.invalid["6"]);
		fx.meta.invalid[7].created_at = moment().add(5, 'seconds').unix();

		var cases = [
	    	{ param: "abc", expected: "`meta` block value type is invalid. Expects a JSON object", msg: "parameter must be a json object" },
	    	{ param: fx.meta.invalid[0], expected: "`unexpected_key` property is unexpected in `meta` block", msg: "cannot have unrecognized property in meta block" },
	    	{ param: fx.meta.invalid[1], expected: "`meta` block is missing `type` property", msg: "missing meta.type property" },
	    	{ param: fx.meta.invalid[2], expected: "`meta.id` value type is invalid. Expects string value", msg: "meta.id property value type must be string" },
	    	{ param: fx.meta.invalid[3], expected: "`meta.id` must have 40 characters. Preferrable a UUIDv4 SHA1 hashed string", msg: "meta.id property value length must be 40" },
	    	{ param: fx.meta.invalid[4], expected: "`meta.type` value type is invalid. Expects string value", msg: "meta.type property value type must be string" },
	    	{ param: fx.meta.invalid[5], expected: "`meta.created_at` value type is invalid. Expects an integer", msg: "meta.created_at property value type must be number" },
	    	{ param: fx.meta.invalid[6], expected: "`meta.created_at` value is too far in the past. Expects unix time on or after " + moment.unix(validator.getStartTime()).format() + "", msg: "meta.created_at property value cannot be before the start time" },
	    	{ param: fx.meta.invalid[7], expected: "`meta.created_at` value cannot be a unix time in the future", msg: "meta.created_at property value cannot be a time in the future" },
	    ];
	    
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validateMetaBlock(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});

});

test('.validateOwnershipBlock()', function(t){

	t.test('call .validateOwnershipBlock() with invalid parameters', function(st){
		
		var cases = [
	    	{ param: "abc", expected: "`ownership` block value type is invalid. Expects a JSON object", msg: "parameter must be a json object" },
	    	{ param: fx.ownership.invalid[0], expected: "`unexpected_key` property is unexpected in `ownership` block", msg: "cannot have unrecognized property in ownership block" },
	    	{ param: fx.ownership.invalid[1], expected: "`ownership` block is missing `ref_id` property", msg: "ownership.ref_id must not be missing" },
	    	{ param: fx.ownership.invalid[2], expected: "`ownership.ref_id` value type is invalid. Expects string value", msg: "ownership.ref_id value type must be a string" },
	    	{ param: fx.ownership.invalid[3], expected: "`ownership` block is missing `type` property", msg: "ownership.type must not be missing" },
	    	{ param: fx.ownership.invalid[4], expected: "`ownership.type` value type is invalid. Expects string value", msg: "ownership.type value type must be a string" },
	    	{ param: fx.ownership.invalid[5], expected: "`ownership.type` property has unexpected value", msg: "ownership.type property has unexpected value type" },
	    	{ param: fx.ownership.invalid[6], expected: "`ownership` block is missing `sole` property", msg: "ownership.sole property must not be missing when ownership.type is sole" },
	    	{ param: fx.ownership.invalid[7], expected: "`ownership.sole` value type is invalid. Expects a JSON object", msg: "ownership.sole value type must be a json object" },
	    	{ param: fx.ownership.invalid[8], expected: "`ownership.sole` property is missing `address_id` property", msg: "ownership.sole.address_id must not be missing" },
	    	{ param: fx.ownership.invalid[9], expected: "`ownership.sole.address_id` value type is invalid. Expects string value", msg: "ownership.sole.address_id value type must be a string" },
	    	{ param: fx.ownership.invalid[10], expected: "`ownership.status` value type is invalid. Expects string value", msg: "ownership.status value type must be a string" },
	    	{ param: fx.ownership.invalid[11], expected: "`ownership.status` property has unexpected value", msg: "ownership.status property has unexpected value" },
	    	
	    ];
	    
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validateOwnershipBlock(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});
});

test('.validateAttributesBlock()', function(t){

	t.test('call .validateAttributesBlock() with invalid parameters', function(st){
		
		var cases = [
	    	{ param: "abc", expected: "ownership` block value type is invalid. Expects a JSON object", msg: "parameter must be a json object" },
	    	{ param: fx.attributes.invalid[0], expected: "`unexpected_key` property is unexpected in `attributes` block", msg: "cannot have unrecognized property in attributes block" },
	    	{ param: fx.attributes.invalid[1], expected: "`attributes` block is missing `ref_id` property", msg: "attributes block must have ref_id property" },
	    	{ param: fx.attributes.invalid[2], expected: "`attributes.ref_id` value type is invalid. Expects string value", msg: "attributes.ref_id value type must be string" },

	    ];
	    
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validateAttributesBlock(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});
});

test('.validateEmbedsBlock()', function(t){

	t.test('call .validateEmbedsBlock() with invalid parameters', function(st){
		var cases = [
	    	{ param: fx.embeds.invalid[0], expected: "`embeds` block value type is invalid. Expects a JSON object", msg: "expects a json object" },
	    	{ param: fx.embeds.invalid[2], expected: "`some_key` property is unexpected in `embeds` block", msg: "cannot have unrecognized property in embeds block" },
	    	{ param: fx.embeds.invalid[3], expected: "`embeds.ref_id` value type is invalid. Expects string value", msg: "ref_id value type must be string" },
	    	{ param: fx.embeds.invalid[4], expected: "`embeds` block is missing `data` property", msg: "data property is required when embeds block is not empty" },
	    	{ param: fx.embeds.invalid[5], expected: "`embeds.data` value type is invalid. Expects an array of JSON objects", msg: "data property value type must be an array of objects" },
	    	{ param: fx.embeds.invalid[6], expected: "`embeds.data` value type is invalid. Expects an array of JSON objects", msg: "data property value must be an array of only JSON objects" },
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validateEmbedsBlock(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});

	t.test('call .validateEmbedsBlock() to proof that level 2 embeds are not validated', function(st){
		fx.embeds.invalid[1].data[0].meta.created_at = moment().unix();
		var level2Embeds = fx.embeds.invalid[1].data[0].embeds;
		var cases = [
	    	{ param: fx.embeds.invalid[1], expected: null, msg: "second level embeds are never validated" },
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.validateEmbedsBlock(cases[i].param);
	    	st.equal(result, cases[i].expected, cases[i].msg);
	    }
	    st.equal(level2Embeds, fx.embeds.invalid[1].data[0].embeds, "level 2 embeds must remain exact as the were before passing through validate()")
	    st.end();
	});

});

test('.isArrayOfObjects()', function(t){
	t.test('call .isArrayOfObjects() with different parameters', function(st){
		var cases = [
	    	{ param: "abc", expected: false, msg: "parameter type is string, not ok" },
	    	{ param: [], expected: true, msg: "an empty array is ok" },
	    	{ param: [{}, {}], expected: true, msg: "an array containing objects is ok" },
	    	{ param: [{}, "abc", 123], expected: false, msg: "an array containing mixed types is not ok" }
	    ];
	    
	    for (var i=0; i < cases.length; i++) {
	    	var result = validator.isArrayOfObjects(cases[i].param);
	    	st.equal(result, cases[i].expected, cases[i].msg);
	    }
	    st.end();
	});
});

test('.setStartTime()', function(t){
	var tm = moment().unix();
	validator.setStartTime(tm);
	t.equal(validator.getStartTime(), tm, "should get the expected time");
	t.end();
});
