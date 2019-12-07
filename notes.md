Install AWS Cli for linux:
-pip3 install awscli --user
-add ~/.local/bin to PATH in (~/.profile)
-Restart shell and try "aws --version"

# VPC
## Attaching VPC To the internet
Doing this becuase currently the VPC is not attached to the interne
```console
aws ec2 attach-internet-gateway --vpc-id "vpc-00404bec178b6db66" --internet-gateway-id "igw-02f8519d017ed0dec" --region us-east-2
```
Added to route table 0.0.0.0/0 -> new internet gateway
# EC2
## Login
ssh -l ubuntu -i <PRIVKEY> 3.135.113.167
# Elastic Cache
## Create Subnet Group
Command:
```shell
aws elasticache create-cache-subnet-group --cache-subnet-group-name elasticache-public --cache-subnet-group-description "csc409A3 subnet for redis cache" --subnet-ids subnet-0cba5933d40e35954
```
Response:
```js
{
    "CacheSubnetGroup": {
        "CacheSubnetGroupName": "elasticache-public",
        "CacheSubnetGroupDescription": "csc409A3 subnet for redis cache",
        "VpcId": "vpc-00404bec178b6db66",
        "Subnets": [
            {
                "SubnetIdentifier": "subnet-0cba5933d40e35954",
                "SubnetAvailabilityZone": {
                    "Name": "us-east-2b"
                }
            }
        ]
    }
}
```
## List Cache Clusters
```console
aws elasticache --describe-cache-clusters
```

### Links
- Connecting to Redis: https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/GettingStarted.ConnectToCacheNode.html
- Creating a new cluster: https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/GettingStarted.CreateCluster.html

# Config
Private Subnet Id: *subnet-098b8d8e35c382c8b*
Public Subnet Id: *subnet-0cba5933d40e35954*
