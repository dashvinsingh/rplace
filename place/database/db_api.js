var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});
// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var params = {
  TableName: 'Canvas',
  Item: {
    'Coordinate' : {S: "1,1"},
    'Colour' : {B: "0000"}
  }
};

// Call DynamoDB to add the item to the table
ddb.putItem(params, function(err, data) {
  if (err) { //Error
    console.log("Error", err);
  } else { // Successful Respose
    console.log("Success", data);
  }
});