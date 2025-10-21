# Docker Commands Reference

This document explains all Docker commands used in the BackstageKotlin project.

## 🐳 Core Docker Commands

### Building Images

#### Local Development Build
```bash
docker build -t backstage-server -f Dockerfile.server .
docker build -t backstage-auth -f Dockerfile.auth .
```
**What it does:**
- `-t backstage-server`: Tags the image with name "backstage-server"
- `-f Dockerfile.server`: Uses specific Dockerfile for the server
- `.`: Uses current directory as build context

#### Production Build (Multi-platform)
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t alexmarques11/backstage-server:latest -f Dockerfile.server . --push
docker buildx build --platform linux/amd64,linux/arm64 -t alexmarques11/backstage-auth:latest -f Dockerfile.auth . --push
```
**What it does:**
- `--platform linux/amd64,linux/arm64`: Builds for multiple CPU architectures
- `--push`: Automatically pushes to Docker Hub after building
- `alexmarques11/backstage-server:latest`: Full image name with registry and tag

### Running Containers

#### Single Container Run
```bash
docker run -d -p 3000:3000 --name backstage-server backstage-server
docker run -d -p 4000:4000 --name backstage-auth backstage-auth
```
**What it does:**
- `-d`: Runs container in detached mode (background)
- `-p 3000:3000`: Maps host port 3000 to container port 3000
- `--name backstage-server`: Assigns a name to the container for easy reference

#### With Environment Variables
```bash
docker run -d -p 3000:3000 -e NODE_ENV=production -e DB_HOST=database backstage-server
```
**What it does:**
- `-e NODE_ENV=production`: Sets environment variable inside container
- `-e DB_HOST=database`: Sets database host for container networking

### Docker Compose Commands

#### Development Deployment
```bash
docker-compose up
docker-compose up -d
docker-compose up --build
```
**What it does:**
- `up`: Starts all services defined in docker-compose.yaml
- `-d`: Runs in detached mode (background)
- `--build`: Forces rebuild of images before starting

#### Production Deployment
```bash
docker-compose -f docker-compose.prod.yaml up -d
```
**What it does:**
- `-f docker-compose.prod.yaml`: Uses production configuration file
- Uses pre-built images from Docker Hub instead of building locally

#### Service Management
```bash
docker-compose start
docker-compose stop
docker-compose restart
docker-compose down
```
**What it does:**
- `start/stop/restart`: Controls running services
- `down`: Stops and removes containers, networks, and volumes

#### Viewing Logs
```bash
docker-compose logs
docker-compose logs -f backstage-server
docker-compose logs --tail=50 backstage-auth
```
**What it does:**
- `logs`: Shows logs from all services
- `-f`: Follows logs in real-time (like tail -f)
- `--tail=50`: Shows only last 50 lines
- `backstage-server`: Shows logs from specific service

#### Scaling Services
```bash
docker-compose up -d --scale backstage-server=3
docker-compose up -d --scale backstage-auth=2
```
**What it does:**
- `--scale backstage-server=3`: Runs 3 instances of the server service
- Useful for load testing and high availability

### Container Inspection

#### List Running Containers
```bash
docker ps
docker ps -a
```
**What it does:**
- `ps`: Shows currently running containers
- `-a`: Shows all containers (including stopped ones)

#### Container Details
```bash
docker inspect backstage-server
docker logs backstage-server
docker exec -it backstage-server /bin/bash
```
**What it does:**
- `inspect`: Shows detailed configuration and state information
- `logs`: Shows container output and error logs
- `exec -it`: Opens interactive terminal inside running container

#### Resource Usage
```bash
docker stats
docker stats backstage-server backstage-auth
```
**What it does:**
- `stats`: Shows real-time CPU, memory, and network usage
- Can specify specific containers to monitor

### Network Management

#### Create Custom Network
```bash
docker network create backstage-network
docker network ls
docker network inspect backstage-network
```
**What it does:**
- `create`: Creates isolated network for containers
- `ls`: Lists all Docker networks
- `inspect`: Shows network configuration and connected containers

#### Connect Container to Network
```bash
docker run -d --network backstage-network --name postgres postgres:13
```
**What it does:**
- `--network backstage-network`: Connects container to custom network
- Enables container-to-container communication using service names

### Volume Management

#### Create and Use Volumes
```bash
docker volume create postgres-data
docker run -d -v postgres-data:/var/lib/postgresql/data postgres:13
```
**What it does:**
- `volume create`: Creates named volume for persistent data
- `-v postgres-data:/var/lib/postgresql/data`: Mounts volume to container path
- Data persists even when container is removed

#### Bind Mounts
```bash
docker run -d -v /host/path:/container/path backstage-server
docker run -d -v $(pwd):/app backstage-server
```
**What it does:**
- `-v /host/path:/container/path`: Mounts host directory into container
- `$(pwd)`: Uses current working directory
- Changes in host directory are immediately reflected in container

### Cleanup Commands

#### Remove Containers
```bash
docker rm backstage-server
docker rm -f backstage-server
docker container prune
```
**What it does:**
- `rm`: Removes stopped container
- `-f`: Forces removal of running container
- `prune`: Removes all stopped containers

#### Remove Images
```bash
docker rmi backstage-server
docker image prune
docker image prune -a
```
**What it does:**
- `rmi`: Removes specific image
- `prune`: Removes unused images
- `-a`: Removes all unused images (not just dangling ones)

#### Complete Cleanup
```bash
docker system prune
docker system prune -a --volumes
```
**What it does:**
- `system prune`: Removes unused containers, networks, and images
- `-a`: More aggressive cleanup
- `--volumes`: Also removes unused volumes

## 🔧 Project-Specific Docker Usage

### Development Workflow
```bash
# 1. Build images locally
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Check health
curl http://localhost:3000/health
curl http://localhost:4000/health

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

### Production Deployment
```bash
# 1. Pull latest images
docker-compose -f docker-compose.prod.yaml pull

# 2. Start production services
docker-compose -f docker-compose.prod.yaml up -d

# 3. Monitor services
docker-compose -f docker-compose.prod.yaml ps
docker-compose -f docker-compose.prod.yaml logs
```

### Troubleshooting
```bash
# Check container status
docker ps -a

# Inspect failed container
docker logs <container-name>

# Access container shell
docker exec -it <container-name> /bin/bash

# Check resource usage
docker stats

# Restart specific service
docker-compose restart backstage-server
```

## 📊 Docker Compose File Structure

### Development (docker-compose.yaml)
- **database**: PostgreSQL container with persistent volume
- **app**: Backstage server built from local Dockerfile.server
- **auth**: Auth server built from local Dockerfile.auth
- **Networks**: Custom network for service communication
- **Volumes**: Named volume for database persistence

### Production (docker-compose.prod.yaml)
- **Uses pre-built images** from Docker Hub
- **Health checks** for service monitoring
- **Restart policies** for high availability
- **Resource limits** for production stability

## 🔒 Security Considerations

### Image Security
```bash
# Scan images for vulnerabilities
docker scout cves backstage-server
docker scout recommendations backstage-server
```

### Runtime Security
```bash
# Run with non-root user
docker run -u 1000:1000 backstage-server

# Limit resources
docker run --memory=512m --cpus=1 backstage-server

# Read-only filesystem
docker run --read-only --tmpfs /tmp backstage-server
```

This reference covers all Docker commands and concepts used in the BackstageKotlin project, with explanations of what each command does and why it's used.