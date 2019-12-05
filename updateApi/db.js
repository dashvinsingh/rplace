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
      console.log('connected')
      client.end().then(() => console.log('client has disconnected')).catch(err => console.error('error during disconnection', err.stack))
    }
})

