var redis = require("redis"),
	client = redis.createClient("redis://r-place-redis-cache-001.tjlnvm.0001.use2.cache.amazonaws.com", {return_buffer:true});

client.on('error', function (err) {
	console.log("Error " + err);
});

// Gets the board from redis cache
var offset = "#" + process.argv[2];
var value = process.argv[3];
var key = "board";
console.log(offset);
console.log(value);
client.send_command("BITFIELD", [key, "SET", "u8", offset, value], function(err, reply) {
	if (err) console.log(err);
	console.log(reply);
	client.quit();
});

//client.get("hash key", function(err, reply) {
    // reply is null when the key is missing
//    	console.log(reply);
//});
