var redis = require("redis"),
	client = redis.createClient("redis://r-place-redis-cache-001.tjlnvm.0001.use2.cache.amazonaws.com", {return_buffer:true});

client.on('error', function (err) {
	console.log("Error " + err);
});
var key = "board";
// Gets the board from redis cache

client.send_command("GET", [key], function(err, reply) {
	if (err) console.log(err);
	if (reply) {
		console.log("Size " + reply.length);
		console.log(readBytes(reply));
	}
	client.quit();
});

function readBytes(byteString) {
	buff = Buffer.from(byteString);
	var board = [];
	for (var i=0; i<buff.length; i++) {
		board.push(buff[i]);
	}
	return board;
}

//client.get("hash key", function(err, reply) {
    // reply is null when the key is missing
//    	console.log(reply);
//});
