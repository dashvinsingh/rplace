import sys, time
import json
import boto3


VPC_ID="vpc-04800dc7a548ebeda"
EC2_CLIENT = boto3.client('ec2')
ECS_CLIENT = boto3.client('ecs')
ElC_CLIENT = boto3.client('elasticache')

def get_vpc():
    return dict(EC2_CLIENT.describe_vpcs(Filters=[{"Name": "vpc-id", "Values": [VPC_ID]}]))

def create_ecs_service():
    ECS_CLIENT.create_service(
    cluster='place',
    serviceName='place-2',
    taskDefinition='place-definiton',
    loadBalancers=[
        {
            'targetGroupArn': 'arn:aws:elasticloadbalancing:us-east-2:521221603804:targetgroup/ecs-place-place/9f3806e6bd5649f2',
            'containerName': 'place-container',
            'containerPort': 8080
        },
        {
            'targetGroupArn': 'arn:aws:elasticloadbalancing:us-east-2:521221603804:targetgroup/ecs-place-place-ws/587f33d294d05be4',
            'containerName': 'place-container',
            'containerPort': 8081
        }
        
    ],
    serviceRegistries=[
    ],
    desiredCount=1,
    launchType='FARGATE',
    capacityProviderStrategy=[

    ],
    platformVersion='1.3.0',
    # role='/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS',
    deploymentConfiguration={
        'maximumPercent': 200,
        'minimumHealthyPercent': 100
    },
    placementConstraints=[
    ],
    placementStrategy=[

    ],
    networkConfiguration={
        "awsvpcConfiguration": {
            "subnets": [
                "subnet-0fe0531d0ca518498", 
                "subnet-026f347cc86e701a9",
                "subnet-0f9592119facc0b11"
            ], 
            "securityGroups": [
                "sg-0b88d263575588fef"
            ], 
            "assignPublicIp": "ENABLED"
        }
    },
    healthCheckGracePeriodSeconds=0,
    schedulingStrategy='REPLICA',
    deploymentController={
        'type': 'ECS'
    },
    tags=[
    ],
    enableECSManagedTags=False,
    )



def check_ecs_cluster_status(cluster_name):
    response = ECS_CLIENT.describe_clusters(clusters=[cluster_name])
    return dict(response)

def check_ecs_service_status(service_name, cluster_name):
    response = ECS_CLIENT.describe_services(cluster=cluster_name, services=[service_name])
    return dict(response)

vpc = get_vpc()
ecs_cluster = check_ecs_cluster_status("place")
ecs_service = check_ecs_service_status("place", "place")
#Check status of each service
##ecs_service['services'][0]['loadBalancers'][0]['targetGroupArn']

# for a in range(1,5):
#     sys.stdout.write('\r {0} files processed.'.format(a*2))
#     time.sleep(1)

# print("hi")
# for a in range(1,5):
#     sys.stdout.write('\r {0} files processed.'.format(a*2))
#     time.sleep(1)

# print('')
# sys.stdout.write('\r#####                     (33%)')
# time.sleep(1)
# sys.stdout.write('\r#############             (66%)')
# time.sleep(1)
# sys.stdout.write('\r#######################   (100%)')
# print('')
