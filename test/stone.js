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
fx.stones.valid[3].embeds[0].meta.created_at = moment().unix();

var privateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIICXgIBAAKBgQDUAwSH1WJcV7I/sU4w54BNYFHwgvpxiXkmPDDkEjFL6+LKX46p\nsEccT8ETR7enF42qQtV3iFrtLi3Rr5QtIPB2cjASoDvkQT7TlpsPG5SHJHqF+7iD\ndS25GMR9eoDtvB7TyBk0B1SjSOYIizzPfYgdFoIl/X82BCtQVL2xnsaaBwIDAQAB\nAoGBAMvLfs5nYp5rOg+ZixTdY2p9fSZZcQ40XH1RfJmvly1ouN9ZjZQ1u5VOYMT8\nul/m9ylEB1hYfTbine6i/SeIMzuXMP+fNktCEMKFEdqGhvodu8EqQtJMk3bHIqmO\ndrjXdn20emdqUHTNdZUPU2lK89Q4Z+m4jEFoOAtOhbe3AhlJAkEA+h/SFMbq5QRP\nrxwuhg3M55iGRdf21ch5x6X4zRKyUayYTDqGl2DWKOitK5LwI2EsdsTdGpeR49U2\n3rRTLYNcJQJBANj9/7ITENa6ciFipw6X95OGcccuLPUydkaZwT37nmDD4iCrCFS2\nx85R+h0iktf6xWKqbLSzajFGp8LLovHxr7sCQQC+A4x6Ij9yKdtLITKqvjMqwbFH\nv/ARqpHxPMINMKXs7Bxq1I9I0tT/EPv1PVRW3EyGEboSqJC5L1HWz9Dco41NAkAy\nj+UP8n9e+az0eI9iyChpWM+UUP8q12pWAyfTMJl0BNDhOdlEHB8sxU9ZkJ/U8dsi\npYGVDaV1+/fFXTwH0oBXAkEA3KlgV9nQHpSkQS1SrElVdBkOHPnO90orv7RtB2SM\nfiztPjnExA2AVEBIj4hDRE34sNFnBRTWyCHQqU2JPrkaeg==\n-----END RSA PRIVATE KEY-----"
var publicKey = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUAwSH1WJcV7I/sU4w54BNYFHw\ngvpxiXkmPDDkEjFL6+LKX46psEccT8ETR7enF42qQtV3iFrtLi3Rr5QtIPB2cjAS\noDvkQT7TlpsPG5SHJHqF+7iDdS25GMR9eoDtvB7TyBk0B1SjSOYIizzPfYgdFoIl\n/X82BCtQVL2xnsaaBwIDAQAB\n-----END PUBLIC KEY-----"

test('.load()', function (t) {

	t.test("test different invalid parameters", function(st){
		var cases = [
	    	{ param: "", expected: "cannot load empty string", msg: "cannot pass empty string" },
	    	{ param: '{ "x": }', expected: "failed to load. JSON string is malformed", msg: "cannot pass malformed json" },
	    	{ param: "abcde==", expected: "failed to load. JSON string is malformed", msg: "cannot pass malformed base64" },
	    	{ param: 123, expected: "unsupported parameter type", msg: "parameter type is not supported" }
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = stone.load(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end()
	});

});


test('.loadJSON()', function (t) {

	t.test("test different invalid parameters", function(st){
		var cases = [
	    	{ param: "{", expected: "failed to load. JSON string is malformed", msg: "cannot load malformed json" },
	    	{ param: new Buffer("{").toString("base64") , expected: "failed to load. JSON string is malformed", msg: "cannot load base64 encoded malformed json" },
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = stone.load(cases[i].param);
	    	st.equal(result instanceof Error, true, "error is expected")
	    	st.equal(result.message, cases[i].expected, cases[i].msg);
	    }
	    st.end()
	});

});

test('.create()', function (t) {

	t.test("call without private key", function(st){
		var result = stone.create({}, null)
		var expected = "private key is required for signing"
		st.equal(result.message, expected, "private key is required");
	    st.end()
	});

	t.test("call with invalid meta information", function(st){
		var result = stone.create({}, privateKey)
		var expected = "`meta` block is missing `stone_id` property"
		st.equal(result.message, expected, "cannot pass invalid meta block data");
	    st.end()
	});

});

test('.sign()', function (t) {

	var key = ursa.coercePrivateKey(privateKey);

	t.test("accurately sign meta block", function(st){
		var result = stone.load(fx.stones.valid[0]);
		st.equal(result instanceof Error, false, "error not expected");
		var signature = result.sign("meta", privateKey);
		st.equal(signature, result.signatures.meta, "signature created must match the signature stored");
		var signatureBaseString = utility.getCanonicalString(fx.stones.valid[0].meta);
		var signature2 = key.hashAndSign("sha256", signatureBaseString, "utf8", "hex");
		st.equal(signature, signature2, "signature generated from stone.sign() must equal signature from key.hashAndSign()")
		st.end()
	});

	t.test("accurately sign ownership block", function(st){
		var result = stone.load(fx.stones.valid[1]);
		st.equal(result instanceof Error, false, "error not expected");
		var signature = result.sign("ownership", privateKey);
		st.equal(signature, result.signatures.ownership, "signature created must match the signature stored");
		var signatureBaseString = utility.getCanonicalString(fx.stones.valid[1].ownership);
		var signature2 = key.hashAndSign("sha256", signatureBaseString, "utf8", "hex");
		st.equal(signature, signature2, "signature generated from stone.sign() must equal signature from key.hashAndSign()")
		st.end()
	});

	t.test("accurately sign attributes block", function(st){
		var result = stone.load(fx.stones.valid[2]);
		st.equal(result instanceof Error, false, "error not expected");
		var signature = result.sign("attributes", privateKey);
		st.equal(signature, result.signatures.attributes, "signature created must match the signature stored");
		var signatureBaseString = utility.getCanonicalString(fx.stones.valid[2].attributes);
		var signature2 = key.hashAndSign("sha256", signatureBaseString, "utf8", "hex");
		st.equal(signature, signature2, "signature generated from stone.sign() must equal signature from key.hashAndSign()")
		st.end()
	});

	t.test("accurately sign embeds block", function(st){
		var result = stone.load(fx.stones.valid[3]);
		st.equal(result instanceof Error, false, "error not expected");
		var signature = result.sign("embeds", privateKey);
		st.equal(signature, result.signatures.embeds, "signature created must match the signature stored");
		var signatureBaseString = utility.getCanonicalString(fx.stones.valid[3].embeds[0]);
		var signature2 = key.hashAndSign("sha256", signatureBaseString, "utf8", "hex");
		st.equal(signature, signature2, "signature generated from stone.sign() must equal signature from key.hashAndSign()")
		st.end()
	});
});

test('.verify()', function (t) {

	t.test("fail without public key", function(st){
		var s = stone.load(fx.stones.valid[0])
		var result = s.verify("meta", null)
		var expected = "public key is required for signing"
		st.equal(result.message, expected, "public key is required");
	    st.end()
	});

	t.test("fail with invalid public key", function(st){
		var s = stone.load(fx.stones.valid[0])
		var result = s.verify("meta", "abc")
		var expected = "public key is invalid"
		st.equal(result.message, expected, "cannot pass invalid public key");
	    st.end()
	});

	t.test("fail when a non-empty block has no signature", function(st){
		var s = stone.load(_.cloneDeep(fx.stones.valid[0]))
		delete s.signatures.meta;
		var result = s.verify("meta", publicKey)
		var expected = "block `meta` has no signature";
		st.equal(result.message, expected, "cannot pass invalid public key");
	    st.end()
	});

	t.test("succeed in verifying meta", function(st){
		var s = stone.load(fx.stones.valid[0])
		s.sign("meta", privateKey);
		var result = s.verify("meta", publicKey)
		st.equal(result, null, "succeed in verifying meta");
	    st.end()
	});	

	t.test("succeed in verifying ownership", function(st){
		var s = stone.load(fx.stones.valid[1])
		s.sign("ownership", privateKey);
		var result = s.verify("ownership", publicKey)
		st.equal(result, null, "succeed in verifying ownership");
	    st.end()
	});	

	t.test("succeed in verifying attributes", function(st){
		var s = stone.load(fx.stones.valid[2])
		s.sign("attributes", privateKey);
		var result = s.verify("attributes", publicKey)
		st.equal(result, null, "succeed in verifying attributes");
	    st.end()
	});

	t.test("succeed in verifying embeds", function(st){
		var s = stone.load(fx.stones.valid[3])
		s.sign("embeds", privateKey);
		var result = s.verify("embeds", publicKey)
		st.equal(result, null, "succeed in verifying embeds");
	    st.end()
	});	

});

test('.toJSON()', function (t) {

	t.test("succeed in converting to json", function(st){
		var s = stone.load(fx.stones.valid[0])
		var stoneJSON = s.toJSON();
		st.equal(_.isPlainObject(stoneJSON), true, "type must be json object");
		st.deepEqual(s, stone.load(stoneJSON), "both objects must be equal")
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

	t.test("succeed in converting stone instance to base 64 string", function(st){
		var s = stone.load(fx.stones.valid[0]);
		var enc = s.encode();
		st.equal(typeof enc, "string", "should be a string");
		var loadEnc = stone.load(enc)
		st.equal(loadEnc.isValid(), true, "should be valid");
	    st.end()
	});	

});

test('.clone()', function (t) {

	t.test("succeed in cloning a stone instance", function(st){
		var s = stone.load(fx.stones.valid[0]);
		var clone = s.clone();
		st.equal(clone instanceof stone.Stone, true, "should be a stone instance");
		st.deepEqual(clone, s, "original stone content should be equal to clone's content");
		s.meta.stone_id = "xxx"
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


