require('log-timestamp');
console.log("Starting server");

// Constants
const VERBOSE = process.argv[2] || true;
const HTTP_PORT = process.argv[3] || 8080;
const WS_PORT = parseInt(HTTP_PORT) + 1;
const SECRET = process.argv[4] || "arnold";
const DIM = 250;
const timeBuffer = 5;

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

const db = new Client({
    user: 'postgres',
    host: 'r-place-1.cg7a8becuhbz.us-east-2.rds.amazonaws.com',
    database: 'Canvas',
    password: 'csc409place',
    port: 5432
})

if (VERBOSE) console.log("Connecting to persistent storage");

db.connect(err => {
    if (err) {
      console.error('Postgres connection error:', err.stack)
    } else {
			if (VERBOSE) {
				console.log("\n----------------------------");
				console.log('CONNECTED TO PERSISTENT DB')
				console.log("----------------------------\n");
			}

			let createBoard = `
				CREATE TABLE IF NOT EXISTS board(
					index int PRIMARY KEY,
					colour int NOT NULL,
					updated timestamp(6) NOT NULL
				);`

      db.query(createBoard, (err) => {
        if (err) {
          console.log("Failed to create board: ", err.message);
        } else {
					if (VERBOSE) {
						console.log("\n--------------------------");
						console.log("BOARD TABLE CREATED");
						console.log("--------------------------\n");
					}
				}
			});
			
			// Initialize all colours in the board as 0
			// let index = 0;
			// while (index < (DIM * DIM)) {
			// 	let zero = `INSERT INTO board (index, colour, updated) VALUES (${index}, 0, CURRENT_TIMESTAMP)`;
			// 	client.query(zero, (err) => {if (err) console.log("Initializing error:", err)});
			// 	index++;
			// }
			// console.log("Final index written:", index);
			
	  
			let createSessions = `
				CREATE TABLE IF NOT EXISTS sessions(
					id VARCHAR(22) NOT NULL PRIMARY KEY, 
					accessed timestamp(6) NOT NULL
				)`;

			db.query(createSessions, (err) => {
				if (err) {
					console.log("Failed to create sessions:", err.message);
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

if (VERBOSE) console.log("Finished connecting");

// Update a colour in the board at a given index
function updateBoard(index, colour) {
	let query = `UPDATE board SET colour = ${colour}, updated = CURRENT_TIMESTAMP WHERE index=${index};`
	db.query(query, (err) => {
		if (err) {
			if (VERBOSE) console.log("Update failed:", err);
		} else {
			if (VERBOSE) console.log("Update successful");
		}
	})
}

// Check the session id timestamp or make one
function checkSession(req, res, next) {
	let time = Date.now();
	let id = req.session.id;

	// Check the sessions table for an id
	let queryString = "SELECT * FROM sessions WHERE id=?;"
	db.query(queryString, [id], (err, data) => {
		if (err) {
			console.log("error:", err);
			res.status(500);
			res.send();
			return;

		// Make a session row if it doesn't exist	
		} else if (data.rowCount == 0) {
			queryString = "INSERT INTO sessions VALUES($1, $2)";
			db.query(queryString, [id, time], (err) => {
				if (err) {
					console.log("error:", err);
					res.status(500);
					res.send();
					return;
				}
			})

		// Compare the timestamp of the last time that session id was used	
		} else {
			let updated = data.row[0].updated;
			let elapsed = Math.floor((time - updated)/1000);
			if (elapsed < 10) {
				res.status(400);
				res.send();
				return;
			}
		}
	})
	next();
}




/*
-------------------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------Redis-----------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------
*/

// Redis Client
const redis = require("redis")
const redis_host = "redis://place.tjlnvm.ng.0001.use2.cache.amazonaws.com";

//###Redis Error Handling to be Done.
const options = {return_buffer: true, retry_strategy:  function(options) {
        if (options.attempt > 3) {
                return Error("Unable to connect to redis!");
        }
}}
const redisClientRead = redis.createClient(redis_host, options);
const redisClient = redis.createClient(redis_host);
redisClient.on('error', function (err) {
    assert(err instanceof Error);
    assert(err instanceof redis.AbortError);
    assert(err instanceof redis.AggregateError);
    // The set and get get aggregated in here
    console.log("Unable to connect to redis.");
});

// Create Pub-Sub channel with redis
redisClient.on("message", function(channel, message) {
		if (VERBOSE) console.log(`Received ${message} from ${channel}`);
		if (message) {
				if (VERBOSE) console.log("Broadcasted data from redis channel to all ws clients.");
				//broadcast writes to users.
				//board[index] = colour;
				wss.broadcast(message);
		}
});
redisClient.subscribe("board_channel");
//**********CODE TO Write to redis cache, for the middle node***************/
// redisClient.send_command("BITFIELD", [redisKey, "SET", "u8", `#${index}`, colour], function(err, reply) {
// 	if (err) console.log(err);
// 	if (reply) {
// 			console.log("REDIS Write successful");
// 			console.log(reply);

// 			//broadcast writes to users.
// 			board[index] = colour;
// 			wss.broadcast(message);
// 	}

// });


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
		console.log("--------------------------");
		console.log("DISCONNECTED FROM CLIENT");
		console.log("--------------------------");
	}
});

// Broadcast to all connected clients
wss.broadcast = function broadcast(data) {
	if (VERBOSE) {
		console.log("->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->");
		console.log("Sending message:", data)
		console.log("->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->->");
	}

	let a = data.split(" ");
	let index = a[0];
	let colour = a[1];
	let x = index % DIM;
	let y = Math.floor(index/DIM);
	if (VERBOSE) console.log("Sending x, y, colour =", x, y, colour);

	let boardInfo = new Uint8ClampedArray(DIM*DIM + 3);
	boardInfo[0] = x;
	boardInfo[1] = y;
	boardInfo[2] = 1;
	boardInfo[3] = colour;

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(boardInfo);
    } else {
		console.log("Unable to send")
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
		if (VERBOSE) console.log("Recieved an invalid update:", err);
		valid = false;
	}
	return valid;
}

// On a new client connection
wss.on('connection', function(ws) {
	if (VERBOSE) {
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

	//Pull board from redis cache on first launch
	const redisKey = "board";
	redisClientRead.send_command("GET", [redisKey], function(err, reply) {
			if (err) {console.log("Unable to GET board from Redis. " + err);};
			if (reply) {
							if (VERBOSE) console.log(`REDIS GET ${redisKey}, Size: ${reply.length}`);
							boardInfo.set(Buffer.from(reply), 3);
							ws.send(boardInfo);
			}
	})

	
	// On a client update, broadcast that update to all clients
	// If we are getting writes over HTTP then this section won't exist anymore, clients never write to socket.
	ws.on('message', function(message) {
		const buffer = Buffer.from(message);
		
		let x = buffer[0];
		let y = buffer[1];
		let colour = buffer[3];

		if (VERBOSE) {
			console.log("+++++++++++++++++++++++++++++++++++++++");
			console.log("Got a new message:", x, y, colour);
			console.log("+++++++++++++++++++++++++++++++++++++++");
		}

		if (validUpdate(x, y, colour)) {
			
			if (VERBOSE) {
				console.log("*********************************************");
				console.log("Updating pixel at ("+x +","+y+") to colour:", colour);
				console.log("*********************************************");
			}

			// Broadcast this update to each client and store it in the board
			//wss.broadcast(message);
			index = x + (DIM * y);
			//board[index] = colour;
			updateBoard(index, colour);
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

// Database
//const db = require('./db.js');

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

function getOffset(x, y){
	return x + (y*DIM);
}


// Serve static content
app.use(express.static('static_files')); // this directory has files to be returned

// Update endpoint
app.post('/update', (req, res) => {
	console.log("Request: " , req);
	//updateBoard();


})

function updateCanvas(x, y, colour, time) {
	var offset = x + (y*DIM);
	let query = ("UPDATE board SET colour = $1 where index = $2;" [colour, offset], (err, res) => {
		if(err){
			console.log();
		} else {
			//Send error to client
		}
	})
}

app.listen(HTTP_PORT, () => {
	if (VERBOSE) {
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




	// var time = Date.now();
	// console.log("doing stuff");
	// let id = req.session.id;
	// // if (!(id.match(/^[a-z0-9]+$/i)) && id.length <= 33) {
	// // 	console.log("here");
	// // 	return;
	// // }
	// db.query("Select last_edit from Sessions where sessionid=$1", [id],(err, res) => {
	// 	if (err) {
	// 		console.log("Unable to check Sessionid", id, err);
	// 		return;
	// 	} else {
	// 		// User does not exist
	// 		if(res.rowCount == 0){
	// 			console.log("\n\nNEW ACCOUNT\n\n");
	// 			db.query("Insert into Sessions Values($1, $2)", [id, time], (err, res) => {
	// 				if (err) {
	// 					console.log("Error creating database entry for session", id);
	// 					return;
	// 				} else {
	// 					console.log("Account created");
	// 				}
	// 			});
	// 		} else {
	// 			//One Session, too early to change,
	// 			if((time - res.row[0].last_edit).getMinutes < timeBuffer){
	// 				response.status(400);
	// 				response.send();
	// 				return;					
	// 			} else {
	// 				console.log("\n\nOLD ACCOUNT\n\n");
	// 			}
	// 		}
	// 		next();
	// 	}
