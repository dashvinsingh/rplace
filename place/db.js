// https://node-postgres.com/
require('log-timestamp');
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

client.connect(err => {
    if (err) {
      console.error('connection error', err.stack)
    } else {
      console.log('connected, creating tables if not exist')
      let createCanvas = `CREATE TABLE IF NOT EXISTS Canvas("X" int NOT NULL,"Y" int NOT NULL,"Colour" int NOT NULL,"timestamp" timestamp(6) NOT NULL,Primary KEY ("X", "Y"));`;
      client.query(createCanvas, function(err, results, fields) {
        if (err) {
          console.log(err.message);
        } else {
          console.log("table created");
          console.log(results);
        }
      });   
    }
})