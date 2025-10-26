# Backstage Application# Backstage Application



A full-stack application with Node.js/Express backend and Android Kotlin frontend. Currently, the **backend is deployed and running** in London, while the **frontend (Android app) is under development**.A full-stack application with Node.js/Express backend and Android Kotlin frontend, deployed on DigitalOcean Kubernetes in London.



## 🌍 Current Status## � Current Deployment



### ✅ Backend (Production Ready)**✅ Production**: London Region (lon1) - Optimized for European users

- **User Management API**: http://159.65.95.83:30001 ([Health](http://159.65.95.83:30001/health))

- **Authentication API**: http://159.65.95.83:30002 ([Health](http://159.65.95.83:30002/health))- **Server API**: `http://159.65.95.83:30001`

- **Database**: PostgreSQL 15 with SSL (London region)- **Auth API**: `http://159.65.95.83:30002`

- **Infrastructure**: DigitalOcean Kubernetes with auto-scaling- **Health Check**: `http://159.65.95.83:30001/health`



### 🚧 Frontend (In Development)## 🚀 Quick Start

- **Android App**: Kotlin-based mobile application (`backstage_frontend/`)

- **UI Framework**: Jetpack Compose for modern Android development### For Administrators

- **Integration**: Will connect to the live backend APIs above```bash

# Check deployment status

## 🔌 Backend API Testing./london-deploy.sh status



**Test the live backend (ready for frontend integration):**# Deploy latest changes

./london-deploy.sh update

```bash

# Health checks# Test deployment

curl http://159.65.95.83:30001/health./london-deploy.sh test

curl http://159.65.95.83:30002/health```



# Register a test user### For Developers

curl -X POST http://159.65.95.83:30002/auth/register \```bash

  -H "Content-Type: application/json" \# Local development

  -d '{"name":"Test","lastname":"User","username":"testuser","email":"test@example.com","password":"password123"}'cd backend

npm install

# Login and get JWT tokennpm run dev

curl -X POST http://159.65.95.83:30002/auth/login \

  -H "Content-Type: application/json" \# Build for production

  -d '{"email":"test@example.com","password":"password123"}'./london-deploy.sh build

```

# Access protected endpoint (use JWT from login response)

curl http://159.65.95.83:30001/posts \## 🏗️ Architecture

  -H "Authorization: Bearer YOUR_JWT_TOKEN"

```### Backend Services

- **Server**: Main API (user management, business logic)

## 🚀 Quick Operations- **Auth**: Authentication & JWT token management

- **Database**: PostgreSQL 15 with SSL

```bash

# Check backend health### Infrastructure

curl http://159.65.95.83:30001/health- **Platform**: DigitalOcean Kubernetes (DOKS)

- **Region**: London (lon1) - 37% faster for EU users

# Deploy backend changes  - **Database**: Managed PostgreSQL in London

./london-deploy.sh update- **Registry**: Private container registry



# Monitor system status### Security

./london-deploy.sh status- ✅ SSL/TLS encryption

```- ✅ JWT-based authentication

- ✅ bcrypt password hashing

## 🏗️ Architecture- ✅ Kubernetes secrets management



### Backend Services (Live)# Backstage Application

- **Main Server**: User management, data APIs, business logic

- **Auth Server**: Registration, login, JWT token managementA full-stack application with Node.js/Express backend and Android Kotlin frontend. Currently, the backend is deployed and running in London, while the frontend (Android app) is under development.

- **Database**: PostgreSQL 15 with SSL encryption

- **Infrastructure**: Kubernetes with auto-scaling (London)## 🌍 Live Backend Services



### Frontend App (In Development)**✅ Production Backend**: London Region - Ready for frontend integration

- **Platform**: Android (Kotlin + Jetpack Compose)

- **Package**: `com.example.backstagekotlin`- **User Management API**: http://159.65.95.83:30001 ([Health](http://159.65.95.83:30001/health))

- **API Integration**: Will consume the backend APIs above- **Authentication API**: http://159.65.95.83:30002 ([Health](http://159.65.95.83:30002/health))

- **Database**: PostgreSQL 15 with SSL (ready for app data)

### Infrastructure

- **Platform**: DigitalOcean Kubernetes (DOKS)## � For Application Developers

- **Region**: London (lon1) - Low latency for EU users

- **Database**: Managed PostgreSQL in London**Connect your applications to Backstage for:**

- **Cost**: ~$44/month- **User Management**: Registration, profiles, preferences

- **Auto-scaling**: CPU-based (70% threshold)- **Authentication**: JWT-based login/logout with refresh tokens

- **Database Access**: Secure PostgreSQL backend for your app data

## 📚 Documentation- **Scalable Infrastructure**: Auto-scaling Kubernetes deployment



**Everything you need is in 2 simple files:**```bash

# Test user registration for your app

### 📖 [Complete Guide](docs/COMPLETE_GUIDE.md) curl -X POST http://159.65.95.83:30002/auth/register \

**START HERE** - Comprehensive documentation covering:  -H "Content-Type: application/json" \

- **Getting started** (for newcomers to the project)  -d '{"name":"App","lastname":"User","username":"myapp_user","email":"user@myapp.com","password":"secure123"}'

- **Backend development** (extending APIs, database changes)

- **Frontend development** (Android app development)# Authenticate users from your app

- **Administration** (monitoring, scaling, security)curl -X POST http://159.65.95.83:30002/auth/login \

- **Troubleshooting** (fixing issues and debugging)  -H "Content-Type: application/json" \

- **Deployment** (new regions, infrastructure setup)  -d '{"email":"user@myapp.com","password":"secure123"}'

- **API reference** (all endpoints with examples)

# Access protected data with JWT token

### ⚡ [Quick Reference](docs/QUICK_REFERENCE.md)curl http://159.65.95.83:30001/posts \

**Copy-paste commands** for:  -H "Authorization: Bearer YOUR_JWT_TOKEN"

- **API testing** (registration, authentication, data access)```

- **Daily operations** (health checks, deployments)

- **Emergency procedures** (troubleshooting, scaling)## 📚 Documentation

- **Development workflow** (local setup, testing)

**Everything you need is in 2 files:**

## 📱 Development Workflow

### 📖 [Complete Guide](docs/COMPLETE_GUIDE.md) 

### Backend Development (Ready)**START HERE** - Complete documentation covering:

```bash- Getting started (for newcomers)

# Local backend development- Development (coding, testing, deploying)

cd backend- Administration (monitoring, scaling, security)

npm install- Troubleshooting (fixing issues)

npm run dev          # Main server on localhost:3000- Deployment (new regions, fresh installs)

node authserver.js   # Auth server on localhost:4000 (separate terminal)- API reference



# Test locally### ⚡ [Quick Reference](docs/QUICK_REFERENCE.md)

curl http://localhost:3000/health**Copy-paste commands** for:

curl http://localhost:4000/health- Daily operations

- Emergency procedures  

# Deploy to production- API testing

./london-deploy.sh update- Troubleshooting

```

## 🚀 Quick Operations

### Frontend Development (Android)

```bash```bash

# Android app development# Check backend health

cd backstage_frontendcurl http://159.65.95.83:30001/health

./gradlew build      # Compile Android appcurl http://159.65.95.83:30002/health



# Open in Android Studio for development# Deploy infrastructure changes  

# Configure API endpoints to point to: http://159.65.95.83:30001/30002./london-deploy.sh update

```

# Monitor system status

## 🌐 API Endpoints (Live)./london-deploy.sh status

```

### User Management API (Port 30001)

```bash## 📚 Documentation

GET  /health                    # Health check

GET  /                         # List all users  **Everything you need is in 2 files:**

POST /                         # Create new user

GET  /setup                    # Initialize database### 📖 [Complete Guide](docs/COMPLETE_GUIDE.md) 

GET  /posts                    # Protected endpoint (requires JWT)**START HERE** - Complete documentation covering:

GET  /users/profile            # Get user profile- **API Integration** (how applications connect to Backstage)

PATCH /users/profile           # Update user profile- **Getting started** (for newcomers)

```- **Development** (extending the backend services)

- **Administration** (monitoring, scaling, security)

### Authentication API (Port 30002)- **Troubleshooting** (fixing issues)

```bash- **Deployment** (new regions, fresh installs)

GET  /health                   # Health check- **API reference** (all endpoints and examples)

POST /auth/register            # User registration

POST /auth/login               # User authentication  ### ⚡ [Quick Reference](docs/QUICK_REFERENCE.md)

POST /auth/logout              # Logout (invalidate refresh token)**Copy-paste commands** for:

POST /auth/token               # Refresh access token- **API testing** (user registration, authentication, data access)

```- **Daily operations** (health checks, deployments)

- **Emergency procedures** (troubleshooting, scaling)

## 📊 Performance & Monitoring- **Infrastructure management** (database, scaling)



### Current Metrics---

- **Response Time**: 264ms average (Portugal → London)

- **Availability**: 99.9% target uptime**Architecture**: Microservices Backend + PostgreSQL + Kubernetes  

- **Auto-scaling**: Triggers at 70% CPU usage**Purpose**: Backend-as-a-Service for multiple applications  

- **Resource Usage**: 128-256Mi memory, 100-200m CPU per pod**Location**: London (lon1) - Low latency for EU applications  

**Cost**: ~$44/month  

### Health Monitoring**Status**: ✅ Production Ready

```bash

# Automated health checks**Need help integrating your app?** → [Complete Guide](docs/COMPLETE_GUIDE.md)

curl http://159.65.95.83:30001/health

curl http://159.65.95.83:30002/health## 📊 Performance



# Resource monitoring- **Latency**: 264ms average (Portugal → London)

kubectl top pods -n backstage- **Availability**: 99.9% target uptime

kubectl get hpa -n backstage- **Auto-scaling**: CPU-based (70% threshold)

```- **Resource Limits**: 256Mi memory, 200m CPU per pod



## 🔐 Security Features## 🔧 Management



- ✅ **JWT Authentication**: Secure token-based auth for API access### Daily Operations

- ✅ **bcrypt Password Hashing**: Secure password storageSee [Admin Procedures](docs/ADMIN_PROCEDURES.md) for:

- ✅ **SSL/TLS Encryption**: Database and API connections encrypted- Health monitoring

- ✅ **Kubernetes Secrets**: Secure credential management- Log analysis  

- ✅ **Input Validation**: SQL injection and XSS protection- Scaling operations

- Security management

## 💰 Infrastructure Costs

### Maintenance

**Monthly Costs**: ~$44See [Maintenance Guide](docs/MAINTENANCE.md) for:

- **DOKS Cluster**: $24/month (1 node, s-2vcpu-4gb)- Update procedures

- **PostgreSQL Database**: $15/month (db-s-1vcpu-1gb)- Backup strategies

- **Container Registry**: $5/month- Troubleshooting

- Emergency recovery

## 🆘 Need Help?

### Deployment Details

- **New to the project?** → [Complete Guide](docs/COMPLETE_GUIDE.md)See [London Deployment](docs/LONDON_DEPLOYMENT.md) for:

- **Need quick commands?** → [Quick Reference](docs/QUICK_REFERENCE.md)- Infrastructure overview

- **Emergency issues?** → Check health endpoints first, then restart services- Configuration details

- **API integration help?** → See API examples in the Complete Guide- Network architecture

- Cost analysis

---

## 🌐 API Endpoints

**Current Status**: ✅ Backend Production Ready | 🚧 Frontend In Development  

**Architecture**: Node.js + PostgreSQL + Kubernetes  ### Server API (`http://159.65.95.83:30001`)

**Location**: London (lon1) | **Last Updated**: October 2024- `GET /health` - Health check
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
