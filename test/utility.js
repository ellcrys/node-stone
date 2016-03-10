var test = require('tape');
var utility = require("../utility")

test('.getCanonicalString()', function (t) {

	t.test("test different parameters", function(st){
		var cases = [
	    	{ param: {}, expected: "de", msg: "empty object must equal 'de'" },
	    	{ param: { x: 4, a: 2 }, expected: "d1:ai2e1:xi4ee", msg: "should equal expected value" },
	    	{ param: { a: 2, x: 4 }, expected: "d1:ai2e1:xi4ee", msg: "should equal expected value no matter the order of properties" }
	    ];
	    for (var i=0; i < cases.length; i++) {
	    	var result = utility.getCanonicalString(cases[i].param);
	    	st.equal(result, cases[i].expected, cases[i].msg);
	    }
	    st.end()
	});

});