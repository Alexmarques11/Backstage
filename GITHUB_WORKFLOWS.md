# GitHub Actions Workflows Documentation

This document explains each GitHub Actions workflow in the project and what every line accomplishes.

## 📁 Workflow Files

- `backend-ci.yml` - Continuous Integration for backend code
- `docker-deploy.yml` - Docker image building and deployment to Docker Hub

---

## 🔄 backend-ci.yml - Backend Continuous Integration

### Workflow Triggers
```yaml
on:
  push:
    branches: [ main, develop ]
    paths: 
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    branches: [ main ]
    paths: 
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
```
**What it does:**
- **Triggers on push** to `main` or `develop` branches
- **Triggers on pull requests** to `main` branch
- **Only runs** when files in `backend/` directory or this workflow file change
- **Saves resources** by not running on unrelated changes (frontend, docs, etc.)

### Job 1: test - Backend Testing with PostgreSQL

#### Service Setup
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: user123
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: backstage
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```
**What it does:**
- **Starts PostgreSQL 15** as a service container
- **Creates test database** with known credentials
- **Exposes port 5432** for backend connection
- **Health checks** ensure PostgreSQL is ready before tests start
- **Automatically retries** connection if database isn't ready immediately

#### Node.js Setup
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json
```
**What it does:**
- **Installs Node.js version 22** (latest LTS)
- **Caches npm packages** to speed up future runs
- **Uses backend/package-lock.json** for cache key generation
- **Speeds up workflow** by reusing previously downloaded packages

#### Database Testing
```yaml
- name: Test database connectivity
  run: |
    PGPASSWORD=123456 pg_isready -h localhost -p 5432 -U user123 -d backstage || {
      echo "PostgreSQL is not ready"
      exit 1
    }
```
**What it does:**
- **Tests PostgreSQL connection** before starting backend
- **Uses pg_isready command** to verify database accepts connections
- **Fails fast** if database isn't accessible
- **Prevents false test failures** due to database connectivity issues

#### Backend Server Testing
```yaml
- name: Start backend server
  working-directory: backend
  run: |
    npm run dev &
    SERVER_PID=$!
    echo "SERVER_PID=$SERVER_PID" >> $GITHUB_ENV
    
    # Wait for server to start
    for i in {1..30}; do
      if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        echo "Server is ready"
        break
      fi
      echo "Waiting for server... ($i/30)"
      sleep 2
    done
```
**What it does:**
- **Starts backend server** in background (`&`)
- **Captures process ID** (`$!`) for later cleanup
- **Stores PID** in GitHub environment for other steps
- **Waits up to 60 seconds** for server to respond
- **Tests server readiness** with curl requests
- **Fails if server doesn't start** within timeout period

#### API Endpoint Testing
```yaml
- name: Test API endpoints
  run: |
    echo "Testing GET endpoint..."
    curl -f http://localhost:3000/ || exit 1
    
    echo "Testing POST endpoint with new schema..."
    curl -f -X POST http://localhost:3000/ \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test",
        "lastname": "User", 
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
      }' || exit 1
```
**What it does:**
- **Tests GET endpoint** for listing users
- **Tests POST endpoint** for creating users with complete schema
- **Uses `-f` flag** to fail on HTTP errors (4xx, 5xx)
- **Validates user creation** by checking response contains test data
- **Tests user profile endpoint** for user retrieval
- **Ensures all API endpoints work** before marking as successful

### Job 2: build-docker - Docker Image Testing

#### Docker Build Testing
```yaml
- name: Build Docker image
  working-directory: backend
  run: |
    docker build -t backstage-backend:latest .
```
**What it does:**
- **Builds Docker image** from Dockerfile in backend directory
- **Tags image** as `backstage-backend:latest`
- **Validates Dockerfile** syntax and build process
- **Ensures image can be created** from current code

#### Docker Compose Integration Testing
```yaml
- name: Test Docker image
  working-directory: backend
  run: |
    echo "Starting Docker Compose services..."
    docker compose up -d
    sleep 15
    
    echo "Testing Docker setup endpoint..."
    curl -f http://localhost:13000/setup || exit 1
```
**What it does:**
- **Starts full Docker environment** (app + database)
- **Waits 15 seconds** for services to fully initialize
- **Tests on port 13000** (Docker Compose mapped port)
- **Validates database setup** endpoint works in containerized environment
- **Tests complete user workflow** in Docker environment
- **Ensures Docker deployment works** end-to-end

---

## 🐳 docker-deploy.yml - Docker Hub Deployment

### Workflow Triggers
```yaml
on:
  push:
    branches: [ main ]
    paths: 
      - 'backend/**'
      - '.github/workflows/docker-deploy.yml'
  release:
    types: [ published ]
```
**What it does:**
- **Deploys on main branch pushes** (production-ready code)
- **Deploys on GitHub releases** (version tags)
- **Only triggers on backend changes** to avoid unnecessary builds
- **Ensures only tested code** gets deployed (after CI passes)

### Environment Variables
```yaml
env:
  REGISTRY: docker.io
  DOCKER_USER: ${{ secrets.DOCKER_USERNAME }}
  DOCKER_PASS: ${{ secrets.DOCKER_PASSWORD }}
  SERVER_IMAGE: ${{ secrets.DOCKER_USERNAME }}/backstage-server
  AUTH_IMAGE: ${{ secrets.DOCKER_USERNAME }}/backstage-auth
```
**What it does:**
- **Uses Docker Hub** as container registry
- **Reads credentials** from GitHub secrets (secure)
- **Dynamically generates image names** based on username
- **Maintains separation** between server and auth images
- **Allows credential rotation** without code changes

### Job 1: build-and-push-server - Server Image Deployment

#### Metadata Generation
```yaml
- name: Extract metadata for Server
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ${{ env.SERVER_IMAGE }}
    tags: |
      type=ref,event=branch
      type=ref,event=pr
      type=sha,prefix={{branch}}-
      type=raw,value=latest,enable={{is_default_branch}}
```
**What it does:**
- **Generates Docker tags** automatically based on Git context
- **Creates branch-specific tags** for feature branches
- **Creates SHA tags** for commit traceability
- **Creates latest tag** only for main branch
- **Enables image versioning** without manual intervention

#### Multi-platform Build
```yaml
- name: Build and push Server Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./backend
    file: ./backend/Dockerfile.server
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha,scope=server
    cache-to: type=gha,mode=max,scope=server
```
**What it does:**
- **Builds from backend directory** context
- **Uses specific Dockerfile** for server service
- **Pushes to Docker Hub** immediately after build
- **Applies generated tags** from metadata step
- **Uses GitHub Actions cache** to speed up builds
- **Caches by scope** to separate server/auth builds

### Job 2: build-and-push-auth - Auth Server Image Deployment

Similar to server build but with:
- **Different Dockerfile** (`Dockerfile.auth`)
- **Different cache scope** (`scope=auth`)
- **Different image name** (backstage-auth)

### Job 3: test-docker-images - Image Validation

#### Server Image Testing
```yaml
- name: Test Server Docker image from Docker Hub
  run: |
    docker run -d -p 3000:3000 \
      -e DATABASE_HOST=localhost \
      -e DATABASE_USER=testuser \
      -e DATABASE_PASSWORD=testpass \
      -e DATABASE_NAME=testdb \
      -e ACCESS_TOKEN_SECRET=test_secret \
      --name backstage-server-test \
      ${{ env.DOCKER_USER }}/backstage-server:latest
```
**What it does:**
- **Pulls image from Docker Hub** (validates upload worked)
- **Runs container** with test environment variables
- **Tests container startup** and basic functionality
- **Verifies image is functional** after upload
- **Cleans up test containers** to avoid resource leaks

### Job 4: notification - Deployment Notification

```yaml
- name: Deployment notification
  run: |
    echo "✅ Docker images successfully built and pushed!"
    echo "🐳 Images available on Docker Hub:"
    echo "📦 Server: ${{ env.DOCKER_USER }}/backstage-server:latest"
    echo "📦 Auth Server: ${{ env.DOCKER_USER }}/backstage-auth:latest"
```
**What it does:**
- **Confirms successful deployment** to Docker Hub
- **Provides pull commands** for immediate use
- **Shows exact image names** for deployment
- **Indicates workflow completion** status

## 🔐 Required GitHub Secrets

Both workflows require these secrets in GitHub repository settings:

### For Docker Deployment
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or access token

### Security Notes
- **Secrets are encrypted** and not visible in logs
- **Access tokens recommended** over passwords for Docker Hub
- **Secrets are scoped** to repository and not shared across forks

## 🎯 Workflow Benefits

### Continuous Integration (CI)
- **Prevents broken code** from reaching main branch
- **Tests database integration** automatically
- **Validates Docker deployment** before release
- **Provides fast feedback** on code changes

### Continuous Deployment (CD)
- **Automates image building** and publishing
- **Ensures consistent deployments** across environments
- **Provides versioned artifacts** for rollback capability
- **Reduces manual deployment errors** and time

### Resource Optimization
- **Caches dependencies** to speed up builds
- **Only runs when needed** (path-based triggers)
- **Parallel job execution** when possible
- **Proper cleanup** to avoid resource leaks

This workflow setup ensures reliable, automated testing and deployment of the Backstage application.