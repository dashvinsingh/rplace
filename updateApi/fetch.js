require('log-timestamp');
console.log("Starting server");

// Constants
const VERBOSE = process.argv[2] || true;
const HTTP_PORT = process.argv[3] || 8080;
const WS_PORT = parseInt(HTTP_PORT) + 1;
const SECRET = process.argv[4] || "arnold";

const period = 5000;



////REDIS INIT
const redis = require("redis")
const redis_host = "redis://place.tjlnvm.ng.0001.use2.cache.amazonaws.com";

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

db.connect( err => {
    if (err) {
        console.error('Postgres connection error:', err.stack)
    } else {
        console.log("Connected to Persistent Storage");
        //await initalSetup();        
        console.log("Initial setup done")
	setInterval(function() {
	    console.log("Fetch: " + Date.now());
            db.query("Select * From board where updated > CURRENT_TIMESTAMP - interval '5 seconds'", (err, res) => {
                if (err) {
                    console.log(err);
                } else {
		    if (res.rowCount > 0) {
		    	//There's a diff, put all this into redis.
		        console.log("Fetched " + res.rowCount + " rows from PG.");
			for (var i=0; i<res.rowCount; i++ ){
				redisArgs = ["board", "SET"];
				redisArgs.push("u8")
				redisArgs.push("#" + res.rows[i].index);
				redisArgs.push(res.rows[i].colour);
				console.log(res.rows[i]);
				redisClient.send_command("BITFIELD", redisArgs, function(err, reply) {
					if (err) console.log(err);
			 		if (reply) {
 		    				console.log("REDIS-OK");
			 		}

			 	});
			}

		    }
		}
            })
        },period)
    }
})

// async function initalSetup(){
//     var i = 0;
//     var step = 100;
//     while(i <= 62499){
//         //console.log("Trying to get from", i , "to", i+step)
//         async.series(db.query("select * from board where index < $1 and index >= $2", [i + step, i],  (err, res) =>  {
//             if (err) {
//                 console.log(err);
//             }
//             else {
//                 console.log("send to redis", res.rows[0].index);
//             }
//         }))
//         i = i + step;
//     }
// }
