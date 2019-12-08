require('log-timestamp');
console.log("Starting server");

// Constants
const VERBOSE = process.argv[2] || true;
const HTTP_PORT = process.argv[3] || 8080;
const WS_PORT = parseInt(HTTP_PORT) + 1;
const SECRET = process.argv[4] || "arnold";

const period = 5000;
const lastChecked = Date.now();


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

db.connect(async err => {
    if (err) {
        console.error('Postgres connection error:', err.stack)
    } else {
        console.log("Connected to Persistent Storage");
        await initalSetup();        
        console.log("Initial setup done")
        const lastChecked = Date.now();
        while (1) {setTimeout(function() {
            var t = lastChecked - period;
            db.query("Select * From board where updated < $1", [t], (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    lastChecked = lastChecked + period;
                    console.log("send to redis");
                }
            })
        },period)}
    }
})

async function initalSetup(){
    var i = 0;
    var step = 100;
    while(i <= 62499){
        //console.log("Trying to get from", i , "to", i+step)
        async.series(db.query("select * from board where index < $1 and index >= $2", [i + step, i],  (err, res) =>  {
            if (err) {
                console.log(err);
            }
            else {
                //console.log("send to redis", res.rows[0].index);
            }
        }))
        i = i + step;
    }
}


