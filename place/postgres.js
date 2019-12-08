// Node-postgres: https://node-postgres.com/
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'r-place-1.cg7a8becuhbz.us-east-2.rds.amazonaws.com',
  database: 'Canvas',
  password: 'csc409place',
  port: 5432
})

// Check the session id timestamp or make one
function checkSession(req, res, next) {
	let time = Date.now();
	let id = req.session.id;

	// Check the sessions table for an id
	let queryString = "SELECT * FROM sessions WHERE id=?;"
	client.query(queryString, [id], (err, data) => {
		if (err) {
			console.log("error:", err);
			res.status(500);
			res.send();
			return;

		// Make a session row if it doesn't exist	
		} else if (data.rowCount == 0) {
			queryString = "INSERT INTO sessions VALUES($1, $2)";
			client.query(queryString, [id, time], (err) => {
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





















// Search the sessions table for an id
// const searchSessions = (client, id) => {
//   return new Promise((resolve, reject) => {
//     let queryString = "SELECT * FROM sessions WHERE id=?;"
//     client.query(queryString, [id], (err, res) => {
//       if (err) { 
//         reject(err);
//       } else if (res.rowCount == 0) {
//         resolve(0);
//       } else {
//         resolve(res.row[0].updated);
//       }
//     })
//   })
// }

// // Insert a new session id into the sessions table
// const insertSession = (client, id) => {
//   return new Promise((resolve, reject) => {
//     let queryString = "INSERT INTO sessions VALUES($1, $2)";
//     let time = Date.now();
//     client.query(queryString, [id, time], (err) =>{
//       if (err) { 
//         reject(err) }
//       else { 
//         resolve("INSERT SESSION SUCCESSFUL");
//       }
//     })
//   })
// }

// // Update the a sessions id's timestamp
// const updateSession = (client, id) => {
//   return new Promise((resolve, reject) => {
//     let time = Date.now();
//     let queryString = "UPDATE sessions SET updated=? WHERE id=?";
//     client.query(queryString, [time, id], (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve("UPDATE SESSION SUCCESSFUL");
//       }
//     })
//   })
// }

// // Update a colour value in the board table
// const updateBoard = (client, index, colour) => {
//   return new Promise((resolve, reject) => {
//     let query = "UPDATE board SET colour=?, updated=CURRENT_TIMESTAMP WHERE index=?";
//     client.query(queryString, [colour, index], (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve("UPDATE BOARD SUCCCESSFUL");
//       }
//     })
//   })
// }

// const canEdit = (last) => {
//   let time = Date.now();
//   let elapsed = (time - last)/1000;
//   if (elapsed < 10) return false;
//   return true;
// }


// Create the board (array of pixel colours) if it doesn't exist
// const createBoard = (client) => {
//   return new Promise((resolve, reject) => {
//     let queryString = `
//     CREATE TABLE IF NOT EXISTS board(
//       index int PRIMARY KEY, 
//       colour int NOT NULL, 
//       updated timestamp NOT NULL
//     );`
//     client.query(queryString, (err) => {
//       if (err) {
//         console.log("error:", err);
//         reject(err);
//       } else {
//         console.log("success");
//         resolve();
//       }
//     })
//   })
// }


// Create the sessions table if it doesn't exist
// const createSessions = (client) => {
//   return new Promise((resolve, reject) => {
//     let queryString = `
//     CREATE TABLE IF NOT EXISTS sessions(
//       id VARCHAR(22) NOT NULL PRIMARY KEY, 
//       last_write timestamp(6) NOT NULL
//     )`;
  
//   client.query(queryString, (err) => {
//     if (err) {
//       console.log("Failed to create sessions table");
//     } else {
//       console.log("Created sessions table");
//     }
//   });
//   })
// }

// Update the board with a new colour at given index
// function updateBoard(client, index, colour) {
//   let time = Date.now();
//   let queryString = `UPDATE board SET colour = ${colour}, updated = ${time}, WHERE index=${index};`
//   client.query(queryString, (err) => {
//     if (err) console.log("Update failed");
//   })
// }

// function searchSessions(client, id) {
//   let queryString = "SELECT last_write FROM sessions w"
// }

// module.exports = { createBoard }