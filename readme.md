# Stone

A stone is a token that holds or represents digital asset for the purpose of transferring between persons and machines.

# Stone Specification

See [Stone Doc](http://stonedoc.org) for the stone specification. 


# Install
```
npm install node-stone
```


# Example

```javascript
var Stone = require("node-stone");

// A valid RSA private key
var privateKey = "-----BEGIN RSA PRIVATE KEY----..."

// define meta block
var metaBlock = {
	id: "61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
	created_at: 1457441779,
	type: "coupon"
}

// create a new and signed stone
Stone.create(metaBlock, privateKey).then(function(stn){
   
   console.log(stn)
   
}).catch(function(err){
   console.error(err);
});
```

```json
{  
   "meta":{  
      "id":"61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
      "created_at":1457441779,
      "type":"coupon"
   },
   "ownership":{ },
   "attributes":{ },
   "embeds":{},
   "signatures":{     
       "meta":"eyJhbGciOiJSUzI1NiJ9.eyJpZHh4eHh4eH.niwd6eKUyEHHwg"
   }
}
```

# Load a stone

Given a JSON representation of a stone. A stone object can be derived using the load() method.
The JSON object must be a valid stone object. 
An [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) 
will be returned if stone validation is not passed, otherwise a Stone object is returned. 

```javascript
var Stone = require("node-stone");

var stoneJSON = {  
   "meta":{  
      "id":"61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
      "created_at":1457441779,
      "type":"coupon"
   }
}

var stn = Stone.load(stoneJSON);      // returns a Stone object.

```

This method does not sign or verifies the resulting stone object. Use `sign()` and `verify()` method respectively.


# Sign a block


#### Stone.sign(blockName, privateKey)


All blocks (execept the signatures block) must be signed before encoding to base64 string for transmission. This method signs a block. A fulfilled promise is returned if signing is successful.

```js
var Stone = require("node-stone");

// A valid RSA private key
var privateKey = "-----BEGIN RSA PRIVATE KEY----..."

var stoneJSON = {  
   "meta":{  
      "id":"61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
      "created_at":1457441779,
      "type":"coupon"
   }
}

var stn = Stone.load(stoneJSON); 

stn.sign("meta", privateKey).then(function(signature){
   console.log(signature);   // y1NiJ9.eyJpj=....===n0.TZlWPGPks
});
```

# Verify a block's signature

#### Stone.verify(blockName, publicKey)

```js
var Stone = require("node-stone");

// A valid RSA public key
var publicKey = "-----BEGIN PUBLIC KEY----..."

var stoneJSON = {  
   "meta":{  
      "id":"61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
      "created_at":1457441779,
      "type":"coupon"
   },
   "signatures":{             
      "meta":"eyJhbGciOiJSUzI1NiJ9.eyJpZHh4eHh4eHh4eHg=...Y291cG9uIn0.niwd6eB=...KUyEHHwg"
   }
}

var stn = Stone.load(stoneJSON); 

stn.verify("meta", publicKey).then(function(verified){
   console.log(verified);   // true or false
});
```

# Encode a stone

#### stone.encode()

The `encode()` method creates a base64 url string from the signatures block. The resulting string can be shared or transferred.

```js
var stoneJSON = {  
   "meta":{  
      "id":"61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
      "created_at":1457441779,
      "type":"coupon"
   }
}

var stn = Stone.load(stoneJSON); 
console.log(stn.encode());  
```

```txt
eyJtZXRhIjoiZXlKaGJHY2lPaUpTVXpJMU5pSjkuZXlKcFpDSTZJall4TVRRMFl6QTVaak0xWmpGbVpEWmtOelV5TmpWalpXRm1OV0pqT0RjMU4yTXpZVFEyWXpNaUxDSmpjbVZoZEdWa1gyRjBJam94TkRVM05EUXhOemM1TENKMGVYQmxJam9pWTI5MWNHOXVJbjAuVFpsV1BVSDRGQnJkbExCdEJTTWU3dy0yN2hOSVRiWTV1OU85STdXdU5SRHVLdVZOS3VWVDBmbEdGeW1aczlvUWdJaE44dU1CTmVnbkhYTUNzNVpnSWhQN1Z3S1Y4b3BYMkJlRVc3VlRIaWZTSkZxWVB6ckttMjNaQjczZG9CelNubzFlWXhnUXIwRFY2cnlUcGFELVRud0c1WnRlLTFqUDhUNU10Um1HUGtzIn0
```

# Decode an encoded stone

#### stone.encode()

A base64 url encoded stone can be decoded to the original stone object it was derived from. 

```js
var encodedStone = "eyJtZXRhIjoiZXlKaGJHY2lPaUpTVXpJMU5pSjkuZXlKcFpDSTZJall4TVRRMFl6QTVaak0xWmpGbVpEWmtOelV5TmpWalpXRm1OV0pqT0RjMU4yTXpZVFEyWXpNaUxDSmpjbVZoZEdWa1gyRjBJam94TkRVM05EUXhOemM1TENKMGVYQmxJam9pWTI5MWNHOXVJbjAuVFpsV1BVSDRGQnJkbExCdEJTTWU3dy0yN2hOSVRiWTV1OU85STdXdU5SRHVLdVZOS3VWVDBmbEdGeW1aczlvUWdJaE44dU1CTmVnbkhYTUNzNVpnSWhQN1Z3S1Y4b3BYMkJlRVc3VlRIaWZTSkZxWVB6ckttMjNaQjczZG9CelNubzFlWXhnUXIwRFY2cnlUcGFELVRud0c1WnRlLTFqUDhUNU10Um1HUGtzIn0";

var stn = Stone.decode(encodedStone); 
console.log(stn.encode());  
```

```json
{  
   "meta":{  
      "id":"61144c09f35f1fd6d75265ceaf5bc8757c3a46c3",
      "created_at":1457441779,
      "type":"coupon"
   },
   "signatures": {
      "meta": "eyJhbGciOiJSUzI1NiJ9.eyJpZCI6IjYxMT.TZlWPUH4FBrdlLBtBS"
   }
}
```

# Other Methods


#### stone.clone()
Returns an exact copy of a Stone instance.

#### stone.isValid()
Checks if the stone's current state passes validation.

#### stone.addMeta(meta, privateKey)
Updates the meta block of a Stone instance. It will validate and sign the new block. Returns a promise object.

#### stone.addOwnership(ownership, privateKey)
Updates the ownership block of a Stone instance. It will validate and sign the new block. Returns a promise object.

#### stone.addAttributes(attributes, privateKey)
Updates the attributes block of a Stone instance. It will validate and sign the new block. Returns a promise object.

#### stone.addEmbeds(embeds, privateKey)
Updates the embeds block of a Stone instance. It will validate and sign the new block. Returns a promise object.

#### stone.hasOwnership()
Checks if the ownership block is set or not empty.

#### stone.hasAttributes()
Checks if the attributes block is set or not empty.

#### stone.hasEmbeds()
Checks if the embeds block is set or not empty.

#### stone.hasSignature(blockName)
Checks if the a block has a signature in the signatures block.

#### stone.toJSON()
Returns a JSON equivalent of a Stone instance.

