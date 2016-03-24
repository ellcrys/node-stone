# Stone

A token is a token that holds or represent digital asset for the purpose of transferring between persons and machines.

# Example

```javascript

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



