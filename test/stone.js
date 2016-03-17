var test = require('tape');
var stone = require("../");
var fx = require('node-fixtures');
var moment = require('moment');
var _ = require("lodash");
var validator = require("../validate");
var utility = require("../utility");
var ursa = require('ursa');

validator.setStartTime(1453975575);
fx.stones.valid[0].meta.created_at = moment().unix();
fx.stones.valid[1].meta.created_at = moment().unix();
fx.stones.valid[2].meta.created_at = moment().unix();
fx.stones.valid[3].meta.created_at = moment().unix();
fx.stones.valid[3].embeds.data[0].meta.created_at = moment().unix();

var privateKey = fx.keys.valid[0];
var publicKey = fx.keys.valid[1];

test('.load()', function (t) {

	t.test("test different invalid parameters", function(st){
		var cases = [
	    	{ param: "", expected: "cannot load empty string", msg: "cannot pass empty string" },
	    	{ param: '{ "x": }', expected: "failed to load. JSON string is malformed", msg: "cannot pass malformed json" },
	    	{ param: 123, expected: "unsupported parameter", msg: "parameter type is not supported" }
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = stone.load(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end()
	});

	t.test("successfully load json object and json string", function(st){
		var data = _.clone(fx.stones.valid[0]);
		var cases = [
	    	{ param: data, expected: stone.Stone, msg: "successfully loaded a json object" },
	    	{ param: JSON.stringify(data), expected: stone.Stone, msg: "successfully loaded a json string" },
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = stone.load(cases[i].param);
	    	st.equal(result instanceof cases[i].expected, true, cases[i].msg)
	    }
	    st.end()
	})

});


test('.create()', function (t) {

	t.test("call without private key", function(st){
		var result = stone.create({}, null).catch(function(err){
			var expected = "private key is required for signing"
			st.equal(err.message, expected, "private key is required");
		    st.end()
		});
	});

	t.test("call with invalid meta information", function(st){
		var result = stone.create({}, privateKey).catch(function(err){
			var expected = "`meta` block is missing `id` property"
			st.equal(err.message, expected, "private key is required");
		    st.end()
		});
	});

});

test('.sign()', function(t) {
	
	t.test('fail to sign: private is not passed', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
    	stn.sign("meta", null).catch(function(err){
    		st.equal(err.message, 'private key is required for signing', "must provide a private key");
    		st.end();
    	});
	});

	t.test('fail to sign: private key is invalid', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
    	stn.sign("meta", publicKey).catch(function(err){
    		st.equal(err.message, 'private key is invalid', "private key is invalid");
    		st.end();
    	});
	});

	t.test('failed to sign: sign unknown block', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
    	stn.sign("xxx", privateKey).catch(function(e){
    		st.equal(e.message, 'block unknown');
    		st.end();
    	});
	});

	t.test('failed to sign: block is empty', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
    	stn.sign("embeds", privateKey).catch(function(e){
    		st.equal(e.message, 'cannot sign empty block', 'cannot sign empty block');
    		st.end();
    	});
	});

	t.test('sign meta block', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
    	st.equal(stn.signatures.meta, undefined, "should not have signatures.meta set");
    	stn.sign("meta", privateKey).then(function(signature){
    		st.notEqual(stn.signatures.meta, undefined, "should have a signatures.meta set");
    		st.equal(stn.signatures.meta, signature, "signature from sign() should be equal to signatures.meta");
    		st.end();
    	});
	});

});

test('.verify()', function(t) {

	t.test('fail to sign: unknown block name', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
		stn.verify("unknown_block", publicKey).catch(function(err){
			st.equal(err.message, 'block unknown', "cannot pass unknown block name");
			st.end();
		});
	});

	t.test('fail to sign: public key is not passed', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
		stn.verify("meta", null).catch(function(err){
			st.equal(err.message, 'public key is required for verifying', "must provide a public key");
			st.end();
		});
	});

	t.test('fail to sign: public key is invalid', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
		stn.verify("meta", privateKey).catch(function(err){
			st.equal(err.message, 'public key is invalid', "must provide a valid public key");
			st.end();
		});
	});

	t.test('fail to sign: block has no signature', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
		stn.verify("meta", publicKey).catch(function(err){
			st.equal(err.message, 'block `meta` has no signature', "cannot verify a block that has no signature");
			st.end();
		});
	});

	t.test('successfully verify a block', function(st){
		var data = _.clone(fx.stones.valid[0]);
    	var stn = stone.load(data);
    	stn.sign("meta", privateKey).then(function(err){
    		stn.verify("meta", publicKey).then(function(verified){
    			st.equal(verified, true, "successfully verified block");
    			st.end();
    		});
    	});
	});

});

test('.toJSON()', function (t) {

	t.test("succeed in converting to json", function(st){
		var s = stone.load(fx.stones.valid[0])
		var stoneJSON = s.toJSON();
		st.equal(_.isPlainObject(stoneJSON), true, "type must be json object");
		st.notEqual(stoneJSON.meta, undefined, "must have meta property");
		st.notEqual(stoneJSON.attributes, undefined, "must have attributes property");
		st.notEqual(stoneJSON.ownership, undefined, "must have ownership property");
		st.notEqual(stoneJSON.embeds, undefined, "must have embeds property");
		st.notEqual(stoneJSON.signatures, undefined, "must have signatures property")
		st.deepEqual(s, stone.load(stoneJSON), "both objects must be equal");
	    st.end()
	});	

});

test('.isValid()', function (t) {

	t.test("succeed in checking validity", function(st){
		var s = stone.load(_.cloneDeep(fx.stones.valid[0]))
		st.equal(s.isValid(), true, "should be true");
		delete s.meta.created_at;
		st.equal(s.isValid(), false, "should be false since meta block is invalid");
	    st.end()
	});	

});

test('.encode()', function (t) {

	t.test("successfully encode stone signatures", function(st){
		var s = stone.load(fx.stones.valid[0]);
		var enc = s.encode();
		st.equal(typeof enc, "string", "should be a string");
	    st.end()
	});	

});

test('.decode()', function (t) {

	t.test("failed because encoded signature is invalid", function(st){
		var result = stone.decode("xxx");
		st.equal(result.message, "failed to decode", "cannot decoded an invalid encoded stone signature");
	    st.end()
	});	

	t.test("failed because signatures.meta is not a valid JWS signature", function(st){
		var s = stone.load(fx.stones.valid[0]);
		s.sign("meta", privateKey).then(function(signature){
			s.signatures.meta = "xxx.xxx";
			var enc = s.encode();
			var result = stone.decode(enc);
			st.equal(result.message, "parameter is not a valid JWS signature", "cannot decoded encoded signature with invalid signatures.meta signature");
		    st.end()
		});
	});	

	t.test("successfully encode stone signatures", function(st){
		var s = stone.load(fx.stones.valid[0]);
		s.sign("meta", privateKey).then(function(signature){
			var enc = s.encode();
			var decodedStone = stone.decode(enc);
			st.equal(decodedStone instanceof stone.Stone, true, "should be an instance of stone.Stone");
			st.equal(s.signatures.meta, decodedStone.signatures.meta)
		    st.end()
		});
	});	

});

test('.clone()', function (t) {

	t.test("succeed in cloning a stone instance", function(st){
		var s = stone.load(fx.stones.valid[0]);
		var clone = s.clone();
		st.equal(clone instanceof stone.Stone, true, "should be a stone instance");
		st.deepEqual(clone, s, "original stone content should be equal to clone's content");
		s.meta.id = "xxx"
		st.notDeepEqual(clone, s, "update to original object should not affect cloned object");
	    st.end()
	});	

});

test('.hasOwnership()', function (t) {

	t.test("succeed in checking availability of ownership information", function(st){
		var s = stone.load(fx.stones.valid[1]);
		var s2 = s.clone();
		delete s2.ownership;
		st.equal(s.hasOwnership(), true, "should have ownership information");
		st.equal(s2.hasOwnership(), false, "should not have ownership information");
	    st.end()
	});	

});

test('.hasAttributes()', function (t) {

	t.test("succeed in checking availability of attributes information", function(st){
		var s = stone.load(fx.stones.valid[2]);
		var s2 = s.clone();
		delete s2.attributes;
		st.equal(s.hasAttributes(), true, "should have ownership information");
		st.equal(s2.hasAttributes(), false, "should not have ownership information");
	    st.end()
	});	

});

test('.hasEmbeds()', function (t) {

	t.test("succeed in checking availability of embeds information", function(st){
		var s = stone.load(fx.stones.valid[3]);
		var s2 = s.clone();
		delete s2.embeds;
		st.equal(s.hasEmbeds(), true, "should have embeds information");
		st.equal(s2.hasEmbeds(), false, "should not have embeds information");
	    st.end()
	});	

});

test(".add* methods", function(t){

	var meta = {
		id: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
		type: "coupon",
		created_at: parseInt(Date.now() / 1000)
	}

	t.test("addMeta: successfully add block", function(st){
		var m = _.clone(meta)
		var result = stone.create(m, privateKey).then(function(stn){
			var newMeta = _.clone(m);
			newMeta.type = "couponx";
			stn.addMeta(newMeta, privateKey).then(function(sig){
				st.notEqual(newMeta.type, m.type)
				st.notEqual(stn.signatures["meta"], undefined)
				st.end()
			})
		});
	});

	t.test("addOwnership: successfully add block", function(st){
		var m = _.clone(meta)
		var result = stone.create(m, privateKey).then(function(stn){
			var ownership = {
				ref_id: m.id,
				type: "sole",
				sole: {
					address_id: "abc"
				}
			}
			st.deepEqual(stn.ownership, {})
			stn.addOwnership(ownership, privateKey).then(function(sig){
				st.notDeepEqual(stn.ownership, {})
				st.equal(stn.signatures.ownership, sig)
				st.end()
			})
		});
	});

	t.test("successfully add addAttributes block", function(st){
		var m = _.clone(meta)
		var result = stone.create(m, privateKey).then(function(stn){
			var attributes = {
				ref_id: m.id,
				data: "some_data"
			}
			st.deepEqual(stn.attributes, {})
			stn.addAttributes(attributes, privateKey).then(function(sig){
				st.notDeepEqual(stn.attributes, {})
				st.equal(stn.signatures.attributes, sig)
				st.end()
			})
		});
	})

});
