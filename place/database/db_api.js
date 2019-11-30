var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});
// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


// Call DynamoDB to add the item to the table
function putItem(item, tableName) {
  var params = {
    TableName: tableName,
    Item: item
  }
  ddb.putItem(params, function(err, data) {
    if (err) { //Error
      console.log("Error", err);
    } else { // Successful Respose
      console.log("Success", data);
    }
  });
}

function getItem(key, tableName){
  var params = {
    Key: key,
    TableName: tableName
  }
  ddb.getItem(params, function(err, data) {
      if(err){
        console.log("Error", err)
      } else {
        console.log("Success", data)
      }
  });
}

// putItem({'Coordinate' : {S: "44,1"},
//     'Colour' : {B: "1100"}}, "Canvas");
// putItem({'User' : {S: "julian"},
//     'Token' : {S: "2"}}, "Users");
// getItem({'User' : {S: "julian"},
// 'Token' : {S: "2"}}, "Users");