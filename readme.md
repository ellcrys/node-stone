# Stone

A stone is a token that holds or represents digital asset for the purpose of transferring between persons and machines.


# Install
```
npm install node-stone
```


# Example

```javascript
var stone = require("node-stone");

// A valid RSA private key
var privateKey = "-----BEGIN RSA PRIVATE KEY----..."

// define meta block
var metaBlock = {
	id: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	created_at: 1457441779,
	type: "coupon"
}

// create a new and signed stone
stone.create(metaBlock, privateKey).then(function(stn){
   
   console.log(stn)
   
}).catch(function(err){
   console.error(err);
});
```

```json
{  
   "meta":{  
      "id":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "created_at":1457441779,
      "type":"coupon"
   },
   "ownership":{  
   
   },
   "attributes":{  
   
   },
   "embeds":{  

   },
   "signatures":{     
       "meta":"eyJhbGciOiJSUzI1NiJ9.eyJpZHh4eHh4eHh4eHg=...Y291cG9uIn0.niwd6eB=...KUyEHHwg"
   }
}
```
