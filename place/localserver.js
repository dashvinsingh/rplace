// Constants
const VERBOSE = process.argv[2] || false;
const HTTP_PORT = process.argv[3] || 8080;
const WS_PORT = parseInt(HTTP_PORT) + 1;
const DIM = 250;

// Redis
// var redis = require("redis");
// const redisClient = redis.createClient();

// Websockets
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });

// Redis Client
const redis = require("redis")
const redis_host = "redis://r-place-redis-cache-001.tjlnvm.0001.use2.cache.amazonaws.com";

//###Redis Error Handling to be Done.
const options = {return_buffer: true, retry_strategy:  function(options) {
	if (options.attempt > 3) {
		return Error("Unable to connect to redis!");
	}
}}
const redisClient = redis.createClient(redis_host, options);
redisClient.on('error', function (err) {
    assert(err instanceof Error);
    assert(err instanceof redis.AbortError);
    assert(err instanceof redis.AggregateError);
    // The set and get get aggregated in here
    console.log("Unable to connect to redis.");
});

// Set up the board as flat array, each pixel is 1 unsigned integer
// 3 maps to white, the board will be all white to begin
let board = new Uint8Array(DIM*DIM); 
board.fill(3);

// Log when a client disconnects
wss.on('close', () => {
	if (VERBOSE) {
		console.log("\n--------------------------");
		console.log("DISCONNECTED FROM CLIENT");
		console.log("--------------------------\n");
	}
});

// Broadcast to all connected clients
wss.broadcast = function broadcast(data) {
	console.log("->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->");
	console.log("Broadcasting message:", data)
	console.log("->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->");
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    } else {
		console.log("===ERROR: Unable to broadcast, socket state: " + client.readyState);
	}
  });
};

// Heartbeat (set isAlive to true on receiving a pong) 
function noop() {}
function heartbeat() {
  this.isAlive = true;
}

// Check if a client pixel update is valid
function validUpdate(x, y, colour) {
	let valid = false;
	try {
		valid = 
			Number.isInteger(x) && x != null && 0 <= x && x < DIM &&
			Number.isInteger(y) && y != null && 0 <= y && y < DIM && 
			Number.isInteger(colour) && colour != null && 0 <= colour && colour <= 15;
	} catch (err) {
		console.log("Recieved an invalid update:", err);
		valid = false;
	}
	return valid;
}

// On a new client connection
wss.on('connection', function(ws) {
	if (VERBOSE) {
		console.log("\n++++++++++++++++++++++++");
		console.log("New client connection");
		console.log("++++++++++++++++++++++++\n");
	}

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', heartbeat);

	// Send the current board to the client
	let boardInfo = new Uint8ClampedArray(DIM*DIM + 3);
	boardInfo[0] = 0;
	boardInfo[1] = 0;
	boardInfo[2] = DIM;


	//Make connection to redis and send the board back to the clients.
	const redisKey = "board";
	redisClient.send_command("GET", [redisKey], function(err, reply) {
		if (err) {console.log("Unable to GET board from Redis. " + err);};
		if (reply) {
				console.log(`REDIS GET ${redisKey}, Size: ${reply.length}`);
				// send(ws, "INIT", {board: readBytes(reply)});
				// ws.send(replay);
				boardInfo.set(reply, 3);
				ws.send(boardInfo);
		}
	})
	// boardInfo.set(board, 3);
	// ws.send(boardInfo);
	
	// On a client update, broadcast that update to all clients
	ws.on('message', function(message) {
		const buffer = Buffer.from(message);
		let x = buffer[0];
		let y = buffer[1];
		let colour = buffer[3];

		if (VERBOSE) {
			console.log("\n+++++++++++++++++++++++++++++++++++++++");
			console.log("Got a new message:", x, y, colour);
			console.log("+++++++++++++++++++++++++++++++++++++++\n");
		}

		if (validUpdate(x, y, colour)) {
			if (VERBOSE) {
				console.log("\n*********************************************");
				console.log("Updating pixel at ("+x +","+y+") to colour:", colour);
				console.log("*********************************************\n");
			}

			// Broadcast this update to each client and store it in the board
			wss.broadcast(message);
			index = x + (DIM * y);
			board[index] = colour;
		}
	});
});

// Heartbeat (ping) sent to all clients
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

// Express server for HTTP
let express = require('express');
let app = express();

// Serve static content
app.use('/',express.static('static_files')); // this directory has files to be returned

app.listen(HTTP_PORT, () => {
	if (VERBOSE) {
		console.log("\n========================================");
		console.log('Example app listening on port:', HTTP_PORT);
		console.log("========================================\n");
	}
});

// To DO:
//   1) Make the board larger (gotta watch out for 8 bit integer limits for x and y values)
//   2) Use drawImage() and fillRect() and putImageData() maybe
//   3) Figure out to send binary data through websockets if possible
//   4) Make a reddit thingie
//   5) Make a postgres thingie
//   6) https://gist.github.com/hagino3000/1447986
//   7) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
//   8) https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData

