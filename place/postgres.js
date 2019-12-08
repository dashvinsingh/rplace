const { Client } = require('pg'); 

const client = new Client({
  user: 'postgres',
  host: 'r-place-1.cg7a8becuhbz.us-east-2.rds.amazonaws.com',
  database: 'Canvas',
  password: 'csc409place',
  port: 5432
});

function createBoard(client) {
  let queryString = `
    CREATE TABLE IF NOT EXISTS board(
      index int PRIMARY KEY,
      colour int NOT NULL,
      updated timestamp(6) NOT NULL
    );`

  client.query(queryString, (err) => {
    if (err) {
      console.log("Failed to create board table");
    } else {
      console.log("Created board table");
    }
  })
}

function createSessions(client) {
  let queryString = `
    CREATE TABLE IF NOT EXISTS sessions(
      id VARCHAR(22) NOT NULL PRIMARY KEY, 
      accessed timestamp(6) NOT NULL
    )`;
  
  client.query(queryString, (err) => {
    if (err) {
      console.log("Failed to create sessions table");
    } else {
      console.log("Created sessions table");
    }
  });
}

function updateBoard(client, index, colour) {
  let time = Date.now();
  let queryString = `UPDATE board SET colour = ${colour}, updated = ${time}, WHERE index=${index};`
  client.query(queryString, (err) => {
    if (err) console.log("Update failed");
  })
}