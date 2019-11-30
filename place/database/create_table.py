import boto3

# boto3 is the AWS SDK library for Python.
# We can use the low-level client to make API calls to DynamoDB.
client = boto3.client('dynamodb')

try:
    resp = client.create_table(
        TableName="Canvas",
        # Declare your Primary Key in the KeySchema argument
        KeySchema=[
            {
                "AttributeName": "Coordinate",
                "KeyType": "HASH"
            }
        ],
        # Any attributes used in KeySchema or Indexes must be declared in AttributeDefinitions
        AttributeDefinitions=[
            {
                "AttributeName": "Coordinate",
                "AttributeType": "S"
            }
        ],
        # ProvisionedThroughput controls the amount of data you can read or write to DynamoDB per second.
        # You can control read and write capacity independently.
        ProvisionedThroughput={
            "ReadCapacityUnits": 1,
            "WriteCapacityUnits": 1
        }
    )
    print("Canvas Table created successfully!")
except Exception as e:
    print("Error creating Canvas table:")
    print(e)

try:
    resp = client.create_table(
        TableName="Users",
        # Declare your Primary Key in the KeySchema argument
        KeySchema=[
            {
                "AttributeName": "User",
                "KeyType": "HASH"
            },{
                "AttributeName": "Token",
                "KeyType": "RANGE"
            }
        ],
        # Any attributes used in KeySchema or Indexes must be declared in AttributeDefinitions
        AttributeDefinitions=[
            {
                "AttributeName": "User",
                "AttributeType": "S"
            },
            {
                "AttributeName": "Token",
                "AttributeType": "S"
            }
        ],
        # ProvisionedThroughput controls the amount of data you can read or write to DynamoDB per second.
        # You can control read and write capacity independently.
        ProvisionedThroughput={
            "ReadCapacityUnits": 1,
            "WriteCapacityUnits": 1
        }
    )
    print("Users Table created successfully!")
except Exception as e:
    print("Error creating Users table:")
    print(e)
