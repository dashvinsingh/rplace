
cd place/
docker build -t place-image-repo .
docker tag place-image-repo 521221603804.dkr.ecr.us-east-2.amazonaws.com/place-image-repo:latest
docker push 521221603804.dkr.ecr.us-east-2.amazonaws.com/place-image-repo:latest
aws ecs update-service --cluster place --service place --force-new-deployment
