const db = require('./db.js');
const pg = require('./postgres.js');

var client = db.client;
client.connect(err => {
  if (err) {
    console.log("error");
  } else {
    console.log("connected");
  }
});

async function main() {
  try {
    let a = await pg.updateBoard(client, 5, 3);
  } catch {
    console.log("caught");
  }
}

main();