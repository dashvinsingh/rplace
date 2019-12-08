var redis = require("redis"),
	client = redis.createClient("redis://r-place-redis-cache-001.tjlnvm.0001.use2.cache.amazonaws.com", {return_buffer:true});

client.on('error', function (err) {
	console.log("Error " + err);
});

// Gets the board from redis cache
var board = "board";
client.send_command("DEL", [board], function(err, reply) {
	if (err) console.log(err);
	console.log("Board Deleted", reply);
	client.quit();
});
