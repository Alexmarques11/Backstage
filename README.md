# BackstageKotlin

A full-stack application with a Node.js/Express backend and Android Kotlin frontend, deployable via Docker and Kubernetes (Minikube).

## 🏗️ Architecture Overview

### Backend Services
- **Main Server** (Port 3000): Express.js API with PostgreSQL database
- **Auth Server** (Port 4000): Authentication service with JWT tokens
- **Database**: PostgreSQL running in Docker container

### Frontend
- **Android App**: Kotlin with Jetpack Compose UI
- **Package**: `com.example.backstagekotlin`

### Deployment Options
- **Local Development**: Docker Compose
- **Production**: Docker Compose with pre-built images
- **Kubernetes**: Minikube deployment with external access

## 🚀 Quick Start

### Option 1: Docker Compose (Local Development)
```bash
cd backend
docker-compose up
```

### Option 2: Minikube Deployment
```bash
cd k8s
./deploy.sh
```

### Option 3: Production Docker
```bash
cd backend
docker-compose -f docker-compose.prod.yaml up
```

## 🌐 External Access Configuration

The Minikube deployment includes multiple methods for external access:

### Method 1: Port Forwarding (Recommended)
- **Main Server**: `http://YOUR_HOST_IP:8080/`
- **Auth Server**: `http://YOUR_HOST_IP:8081/`

### Method 2: Socat Relay
- **Main Server**: `http://YOUR_HOST_IP:9300/`
- **Auth Server**: `http://YOUR_HOST_IP:9301/`

### Method 3: Python Proxy (Unified)
- **All Services**: `http://YOUR_HOST_IP:9090/`

## 🔧 How It Works

### Minikube Deployment Process
1. **Namespace Creation**: Isolates Backstage services
2. **Secret Generation**: Dynamic JWT secrets (never committed)
3. **Database Setup**: PostgreSQL StatefulSet with persistent storage
4. **Service Deployment**: Main server and auth server with health checks
5. **External Access**: Multiple forwarding methods for cross-network connectivity

### Network Architecture
```
External Machine → Host Network → Port Forward/Relay → Minikube → Kubernetes Services → Pods
```

### Health Monitoring
- Each service has `/health` endpoints
- Kubernetes liveness and readiness probes
- Automatic pod restart on failure

### Security Features
- JWT-based authentication
- Bcrypt password hashing
- Parameterized database queries
- Kubernetes secrets management
- Network isolation via namespaces

## 📋 API Endpoints

### Main Server (Port 3000/8080)
- `GET /` - List all users
- `POST /` - Create new user
- `GET /health` - Health check
- `GET /setup` - Initialize database
- `GET /posts` - Protected endpoint (requires JWT)
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update user profile

### Auth Server (Port 4000/8081)
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/token` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token
- `GET /health` - Health check

## 🛠️ Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Android Development
```bash
cd backstage_frontend
./gradlew build
```

### Testing API
Use the REST client file at `backend/test.rest` for API testing.

## 📁 Project Structure

```
├── backend/                 # Node.js Express servers
│   ├── server.js           # Main API server
│   ├── authserver.js       # Authentication server
│   ├── database.js         # Database configuration
│   └── docker-compose.yaml # Development deployment
├── backstage_frontend/      # Android Kotlin app
│   └── app/                # Main Android application
├── k8s/                    # Kubernetes manifests
│   ├── deploy.sh          # Automated deployment script
│   └── *.yaml             # Kubernetes resource definitions
└── README.md              # This file
```

## 🔍 Troubleshooting

### Check Service Status
```bash
kubectl get pods -n backstage
kubectl get services -n backstage
```

### Check External Access
```bash
./updated-connection-guide.sh
```

### Common Issues
- **Network connectivity**: Ensure firewall allows traffic on ports 8080, 8081, 9090, 9300, 9301
- **Minikube not accessible**: Use host-based URLs instead of direct Minikube IPs
- **Pod failures**: Check logs with `kubectl logs -n backstage <pod-name>`

## 📚 References

- [Docker Commands Reference](./DOCKER_COMMANDS.md) - Complete Docker usage guide
- [Minikube Commands Reference](./MINIKUBE_COMMANDS.md) - Kubernetes and Minikube commands
- [Minikube Setup Guide](./k8s/MINIKUBE_SETUP.md) - Installation and configuration
- [Security Documentation](./k8s/SECURITY.md) - Secrets and security management
- [Kubernetes Deployment Guide](./k8s/README.md) - Detailed deployment instructions
