require('log-timestamp');
console.log("Starting server");

// Constants
const VERBOSE = process.argv[2] || true;
const HTTP_PORT = process.argv[3] || 8080;
const WS_PORT = parseInt(HTTP_PORT) + 1;
const SECRET = process.argv[4] || "arnold";
const DIM = 250;

// Websockets
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });

// https://node-postgres.com/
/*
-------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------DATABASE--------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------
*/
const { Pool, Client } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'r-place-1.cg7a8becuhbz.us-east-2.rds.amazonaws.com',
    database: 'Canvas',
    password: 'csc409place',
    port: 5432
})

const client = new Client({
    user: 'postgres',
    host: 'r-place-1.cg7a8becuhbz.us-east-2.rds.amazonaws.com',
    database: 'Canvas',
    password: 'csc409place',
    port: 5432
})

console.log("Connecting to persistent storage");
client.connect(err => {
    if (err) {
      console.error('connection error', err.stack)
    } else {
		if(VERBOSE) {
			console.log("")
			console.log("--------------------------");
			console.log('CONNECTED TO PERSISTENT DB')
			console.log("--------------------------");
		}
      let createCanvas = `CREATE TABLE IF NOT EXISTS Canvas("X" int NOT NULL,"Y" int NOT NULL,"Colour" int NOT NULL,"timestamp" timestamp(6) NOT NULL,Primary KEY ("X", "Y"));`;
      client.query(createCanvas, function(err, results, fields) {
        if (err) {
          console.log(err.message);
        } else {
			if(VERBOSE) {
				console.log("")
				console.log("--------------------------");
				console.log("CANVAS TABLE CREATED");
				console.log("--------------------------");
			}
		}
	  });
	  
	  let createSessions = `CREATE TABLE IF NOT EXISTS Sessions("SessionID" VARCHAR(22) NOT NULL, "timestamp" timestamp(6) not NULL, Primary Key("SessionID"));`;
	  client.query(createCanvas, function(err, results, fields) {
        if (err) {
          console.log(err.message);
        } else {
			if(VERBOSE) {
				console.log("")
				console.log("--------------------------");
				console.log("SESSIONS TABLE CREATED");
				console.log("--------------------------");
			}
		}
	  });

    }
})
console.log("Finished connecting");
 
/*
-------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------API-----------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------
*/
// Set up the board as flat array, each pixel is 1 unsigned integer
// 3 maps to white, the board will be all white to begin
let board = new Uint8Array(DIM*DIM); 
board.fill(3);

// Log when a client disconnects
wss.on('close', () => {
	if (VERBOSE) {
		console.log("")
		console.log("--------------------------");
		console.log("DISCONNECTED FROM CLIENT");
		console.log("--------------------------");
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
		console.log("")
		console.log("++++++++++++++++++++++++");
		console.log("New client connection");
		console.log("++++++++++++++++++++++++");
	}

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', heartbeat);

	// Send the current board to the client
	let boardInfo = new Uint8ClampedArray(DIM*DIM + 3);
	boardInfo[0] = 0;
	boardInfo[1] = 0;
	boardInfo[2] = DIM;
	boardInfo.set(board, 0);
	ws.send(boardInfo);
	
	// On a client update, broadcast that update to all clients
	ws.on('message', function(message) {
		const buffer = Buffer.from(message);
		let time = Date.now();
		let x = buffer[0];
		let y = buffer[1];
		let colour = buffer[3];

		if (VERBOSE) {
			console.log("+++++++++++++++++++++++++++++++++++++++");
			console.log("Got a new message:", x, y, colour, time);
			console.log("+++++++++++++++++++++++++++++++++++++++");
		}

		if (validUpdate(x, y, colour)) {
			if (VERBOSE) {
				console.log("*********************************************");
				console.log("Updating pixel at ("+x +","+y+") to colour:", colour);
				console.log("*********************************************");
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

// Sessions
const session = require('express-session');
app.use(session({
	resave: false,
	saveUninitialized: true,
	secret: SECRET,
}))

function printSession(req, res, next) {
	console.log("SESSION:" , req.session.id);
	next();
}

// Serve static content
app.use('/', printSession, express.static('static_files')); // this directory has files to be returned

// Update endpoint
app.use('/update', printSession, (req, res) => {
	
})

app.listen(HTTP_PORT, () => {
	if (VERBOSE) {
		console.log("")
		console.log("========================================");
		console.log('Example app listening on port:', HTTP_PORT);
		console.log("========================================");
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

