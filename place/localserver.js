// Constants
const VERBOSE = process.argv[2] || false;
const HTTP_PORT = process.argv[3] || 8080;
const WS_PORT = process.argv[4] || 8081;
const DIM = 250;

// Redis
// var redis = require("redis");
// const redisClient = redis.createClient();

// Websockets
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });
 
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
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
			if (VERBOSE) {
				console.log("->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->");
				console.log("Sending message:", data)
				console.log("->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->");
			}

      client.send(data);
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
	boardInfo.set(board, 3);
	ws.send(boardInfo);
	
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

