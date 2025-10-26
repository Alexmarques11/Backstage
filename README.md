# Backstage Application

A full-stack application with Node.js/Express backend and Android Kotlin frontend, deployed on DigitalOcean Kubernetes in London.

## � Current Deployment

**✅ Production**: London Region (lon1) - Optimized for European users

- **Server API**: `http://159.65.95.83:30001`
- **Auth API**: `http://159.65.95.83:30002`
- **Health Check**: `http://159.65.95.83:30001/health`

## 🚀 Quick Start

### For Administrators
```bash
# Check deployment status
./london-deploy.sh status

# Deploy latest changes
./london-deploy.sh update

# Test deployment
./london-deploy.sh test
```

### For Developers
```bash
# Local development
cd backend
npm install
npm run dev

# Build for production
./london-deploy.sh build
```

## 🏗️ Architecture

### Backend Services
- **Server**: Main API (user management, business logic)
- **Auth**: Authentication & JWT token management
- **Database**: PostgreSQL 15 with SSL

### Infrastructure
- **Platform**: DigitalOcean Kubernetes (DOKS)
- **Region**: London (lon1) - 37% faster for EU users
- **Database**: Managed PostgreSQL in London
- **Registry**: Private container registry

### Security
- ✅ SSL/TLS encryption
- ✅ JWT-based authentication
- ✅ bcrypt password hashing
- ✅ Kubernetes secrets management

# Backstage Application

A full-stack application with Node.js/Express backend and Android Kotlin frontend, deployed on DigitalOcean Kubernetes in London.

## 🌍 Live System

**✅ Production**: London Region - Optimized for European users

- **Server API**: http://159.65.95.83:30001 ([Health](http://159.65.95.83:30001/health))
- **Auth API**: http://159.65.95.83:30002 ([Health](http://159.65.95.83:30002/health))

## 🚀 Quick Start

```bash
# Check if everything is working
curl http://159.65.95.83:30001/health

# Deploy code changes  
./london-deploy.sh update

# Check system status
./london-deploy.sh status
```

## 📚 Documentation

**Everything you need is in 2 files:**

### 📖 [Complete Guide](docs/COMPLETE_GUIDE.md) 
**START HERE** - Complete documentation covering:
- Getting started (for newcomers)
- Development (coding, testing, deploying)
- Administration (monitoring, scaling, security)
- Troubleshooting (fixing issues)
- Deployment (new regions, fresh installs)
- API reference

### ⚡ [Quick Reference](docs/QUICK_REFERENCE.md)
**Copy-paste commands** for:
- Daily operations
- Emergency procedures  
- API testing
- Troubleshooting

---

**Architecture**: Node.js + PostgreSQL + Kubernetes  
**Location**: London (lon1)  
**Cost**: ~$44/month  
**Status**: ✅ Production Ready

**Need help?** → [Complete Guide](docs/COMPLETE_GUIDE.md)

## 📊 Performance

- **Latency**: 264ms average (Portugal → London)
- **Availability**: 99.9% target uptime
- **Auto-scaling**: CPU-based (70% threshold)
- **Resource Limits**: 256Mi memory, 200m CPU per pod

## 🔧 Management

### Daily Operations
See [Admin Procedures](docs/ADMIN_PROCEDURES.md) for:
- Health monitoring
- Log analysis  
- Scaling operations
- Security management

### Maintenance
See [Maintenance Guide](docs/MAINTENANCE.md) for:
- Update procedures
- Backup strategies
- Troubleshooting
- Emergency recovery

### Deployment Details
See [London Deployment](docs/LONDON_DEPLOYMENT.md) for:
- Infrastructure overview
- Configuration details
- Network architecture
- Cost analysis

## 🌐 API Endpoints

### Server API (`http://159.65.95.83:30001`)
- `GET /health` - Health check
- `GET /` - List users
- `POST /` - Create user
- `GET /setup` - Initialize database
- `GET /posts` - Protected endpoint

### Auth API (`http://159.65.95.83:30002`)
- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/token` - Refresh token

## 🛠️ Development

### Local Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (Android)
cd backstage_frontend
./gradlew build
```

### Testing
```bash
# Health checks
curl http://159.65.95.83:30001/health
curl http://159.65.95.83:30002/health

# User registration
curl -X POST http://159.65.95.83:30002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","lastname":"User","username":"test","email":"test@example.com","password":"password123"}'
```

### Deployment
```bash
# Update deployment
./london-deploy.sh update

# Check status
./london-deploy.sh status
```

## 💰 Cost Optimization

**Current Monthly Costs**: ~$44
- DOKS Cluster: $24/month
- PostgreSQL DB: $15/month  
- Container Registry: $5/month

**Optimization Opportunities**:
- Scale down during low usage
- Use smaller database if sufficient
- Regular resource monitoring

## 📈 Monitoring

### Health Monitoring
- Automated health checks every hour
- Resource usage tracking
- Application log analysis

### Performance Metrics
- Response time monitoring
- Auto-scaling triggers
- Database performance

### Alerts
- Service downtime
- High resource usage
- Database connectivity issues

## 🔐 Security

### Current Measures
- SSL-enabled database connections
- JWT token authentication
- Secrets management via Kubernetes
- Private container registry

### Regular Security Tasks
- Monthly JWT secret rotation
- Weekly container image updates
- Security patch monitoring

## 📚 Documentation

**New to Backstage?** → Start with [Getting Started Guide](docs/GETTING_STARTED.md)

### User Guides
- **[👋 Getting Started](docs/GETTING_STARTED.md)** - Complete introduction for newcomers
- **[👩‍💻 Developer Guide](docs/DEVELOPER_GUIDE.md)** - Coding, testing, and development workflows  
- **[👩‍🏭 Administrator Guide](docs/ADMIN_GUIDE.md)** - Daily operations and system management
- **[🏗️ Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Setting up new environments and migrations

### Troubleshooting & Reference
- **[🔧 Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Diagnose and fix common issues
- **[📖 Technical Reference](docs/TECHNICAL_REFERENCE.md)** - Commands, APIs, and configurations

### Quick Reference
- **Server API**: http://159.65.95.83:30001 ([Health Check](http://159.65.95.83:30001/health))
- **Auth API**: http://159.65.95.83:30002 ([Health Check](http://159.65.95.83:30002/health))
- **Main Deployment Script**: `./london-deploy.sh status|update|test`

---

**Need help?** Check documentation above or review [Getting Started Guide](docs/GETTING_STARTED.md) for orientation.

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

## � CI/CD Pipeline

The project includes automated GitHub Actions workflows:

### Backend CI Pipeline
- **Triggers**: On pushes to `main`/`develop`, PRs to `main`
- **Tests**: API endpoints, database integration, Docker builds
- **Environment**: PostgreSQL 15 + Node.js 22
- **Validation**: Complete user workflow testing

### Docker Deployment Pipeline
- **Triggers**: On pushes to `main`, GitHub releases
- **Builds**: Multi-platform Docker images
- **Publishes**: Images to Docker Hub automatically
- **Tests**: Image functionality after deployment

See [GitHub Workflows Documentation](./GITHUB_WORKFLOWS.md) for detailed pipeline explanation.

## �🛠️ Development

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
├── backstage-manager.sh    # Complete deployment lifecycle management
├── test-autoscaling.sh     # Auto-scaling testing and monitoring
└── README.md              # This file
```

## 🔍 Troubleshooting

### Quick Diagnostics
```bash
# Check overall status
./backstage-manager.sh status

# Check service health
curl http://YOUR_HOST_IP:8080/health
curl http://YOUR_HOST_IP:8081/health
```

### Detailed Debugging
```bash
kubectl get pods -n backstage
kubectl get services -n backstage
kubectl logs -f deployment/backstage-server -n backstage
```

### Auto-scaling Monitoring
```bash
# Check auto-scaling status
kubectl get hpa -n backstage

# Monitor resource usage
kubectl top pods -n backstage

# Test auto-scaling
./test-autoscaling.sh
```

### External Access Issues
```bash
# Re-setup port forwarding
./backstage-manager.sh port-forward

# Check connection guide
./updated-connection-guide.sh
```

### Common Issues
- **Network connectivity**: Ensure firewall allows traffic on ports 8080, 8081, 9090, 9300, 9301
- **Minikube not accessible**: Use host-based URLs instead of direct Minikube IPs
- **Pod failures**: Check logs with `kubectl logs -n backstage <pod-name>`
- **Auto-scaling not working**: Verify metrics-server addon is enabled

## 📚 References

- [Docker Commands Reference](./DOCKER_COMMANDS.md) - Complete Docker usage guide
- [Minikube Commands Reference](./MINIKUBE_COMMANDS.md) - Kubernetes and Minikube commands
- [GitHub Workflows Documentation](./GITHUB_WORKFLOWS.md) - CI/CD pipeline explanation
- [Minikube Setup Guide](./k8s/MINIKUBE_SETUP.md) - Installation and configuration
- [Security Documentation](./k8s/SECURITY.md) - Secrets and security management
- [Kubernetes Deployment Guide](./k8s/README.md) - Detailed deployment instructions
