#### Building the Docker Image
```bash
docker build -t auth-service:dev -f docker/development/Dockerfile .
```

#### Running the Express App in a Docker Container locally
```bash
docker run --rm --name auth-service -it -v $(pwd):/usr/src/app -v /usr/src/app/node_modules --env-file $(pwd)/.env -p 5501:5501 -e NODE_ENV=development auth-service:dev
```
