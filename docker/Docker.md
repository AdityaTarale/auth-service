#### Building the Docker Image

```bash
docker build -t auth-service:dev -f docker/dev/Dockerfile .
```

#### Running the Express App in a Docker Container locally

```bash
docker run --rm --name auth-service -it -v $(pwd):/usr/src/app -v /usr/src/app/node_modules --env-file $(pwd)/.env -p 5501:5501 -e NODE_ENV=development auth-service:dev
```

#### Pull the PostgreSQL Docker image

```bash
docker pull postgres
```

#### Create a Persistent Volume

```bash
docker volume create mernpgdata
```

#### Run the PostgreSQL container with the volume attached

```bash
docker run --rm --name mernpg-container -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root -v mernpgdata:/var/lib/postgresql/data -p 5432:5432 -d postgres
```
