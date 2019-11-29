import boto3

client = boto3.client('dynamodb')

try:
    resp = client.delete_table(
        TableName="Canvas",
    )
    print("Canvas Table deleted successfully!")
except Exception as e:
    print("Error deleting table:")
    print(e)

try:
    resp = client.delete_table(
        TableName="Users",
    )
    print("Users Table deleted successfully!")
except Exception as e:
    print("Error deleting table:")
    print(e)
