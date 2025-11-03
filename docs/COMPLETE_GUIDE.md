# Backstage Complete Guide

Welcome! This is the **complete guide** for the Backstage application. Everything you need to know about developing, integrating, and managing this full-stack application is in this one document.

##  What is Backstage?

Backstage is a **full-stack application** consisting of:
- **Backend**: Production-ready Node.js APIs with PostgreSQL database
- **Frontend**: Android mobile app (Kotlin + Jetpack Compose) - *currently in development*
- **Infrastructure**: Auto-scaling Kubernetes deployment in London

**Current Status:**
-  **Backend**: Fully deployed and operational in London
-  **Frontend**: Android app under development (`backstage_frontend/`)

**Think of the architecture:**
- **Backend APIs** = The engine (user management, authentication)
- **PostgreSQL Database** = The storage (user data, app data)
- **Android App** = The interface (users will interact with this)
- **Kubernetes** = The foundation (infrastructure hosting everything)

**Currently serving from London**: http://159.65.95.83:30001 

---

## 📍 Quick Access (Most Common Tasks)

### Frontend Integration Testing
```bash
# Test if backend is ready for your Android app
curl http://159.65.95.83:30001/health    # Should say "Server is healthy"
curl http://159.65.95.83:30002/health    # Should say "Auth server is healthy"

# Register a user from your Android app
curl -X POST http://159.65.95.83:30002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Android","lastname":"User","username":"android_user1","email":"user@android.app","password":"secure123"}'

# Authenticate user and get JWT token for app
curl -X POST http://159.65.95.83:30002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@android.app","password":"secure123"}'
```

### Deploy Code Changes
```bash
./london-deploy.sh update
```

### Check System Status  
```bash
./london-deploy.sh status
```

### Emergency Restart
```bash
kubectl rollout restart deployment/backstage-server deployment/backstage-auth -n backstage
```

---

## 👥 Choose Your Path

###  I'm New Here → [Jump to Getting Started](#getting-started)
###  I'm Developing the Backend → [Jump to Backend Development](#backend-development)  
###  I'm Building the Android App → [Jump to Frontend Development](#frontend-development)
###  I'm an Admin → [Jump to Administration](#administration)
###  Something is Broken → [Jump to Troubleshooting](#troubleshooting)
###  I Need to Deploy → [Jump to Deployment](#deployment)

---

# Getting Started

## What You're Looking At

Backstage is a **full-stack application** with two main parts:

```
[Android App] → [Internet] → [London Backend] → [Database]
   (Building)              ( Running)       ( Ready)
```

1. **Android App**: Mobile interface users will interact with (*in development*)
2. **Internet**: Carries requests from app to backend
3. **London Backend**: Two Node.js servers processing requests (*live now*)
4. **Database**: PostgreSQL storing all user and application data (*live now*)

## Current Live Backend

- **User Management**: http://159.65.95.83:30001 (create users, manage profiles)
- **Authentication**: http://159.65.95.83:30002 (login, registration, JWT tokens)
- **Database**: PostgreSQL in London (user data, secure storage)
- **Location**: DigitalOcean London data center
- **Status**:  Production ready, waiting for Android app

## Frontend Development Status

The Android app (`backstage_frontend/`) will:
- Connect to the backend APIs above
- Handle user registration and login
- Display user data and manage profiles
- Use Jetpack Compose for modern Android UI

## Test the Backend (Ready Now)

```bash
# Check if backend is running
curl http://159.65.95.83:30001/health
curl http://159.65.95.83:30002/health

# Create a test user (what the Android app will do)
curl -X POST http://159.65.95.83:30002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","lastname":"User","username":"test123","email":"test123@example.com","password":"password123"}'

# Login test user (what the Android app will do)
curl -X POST http://159.65.95.83:30002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test123@example.com","password":"password123"}'
```

---

# Development

## Local Setup

### Prerequisites
```bash
# Check if you have these installed
node --version    # Need v18+
npm --version     # For backend
docker --version  # For containers
```

### Start Developing

**1. Get the code:**
```bash
git clone https://github.com/Alexmarques11/Backstage.git
cd Backstage
```

**2. Start backend locally:**
```bash
cd backend
npm install
npm run dev    # Server runs on http://localhost:3000
```

**3. Start auth server (new terminal):**
```bash
cd backend  
node authserver.js    # Auth runs on http://localhost:4000
```

**4. Start database (new terminal):**
```bash
cd backend
docker-compose up -d database    # PostgreSQL on localhost:5432
```

### Making Changes

**Backend files you'll edit:**
- `backend/server.js` - Main API (users, posts, data)
- `backend/authserver.js` - Login/registration  
- `backend/database.js` - Database connection

**Test your changes:**
```bash
# Test locally first
curl http://localhost:3000/health
curl http://localhost:4000/health

# Deploy to production
./london-deploy.sh update

# Verify production
curl http://159.65.95.83:30001/health
```

### Common Development Tasks

**Add new API endpoint:**
```javascript
// In backend/server.js
app.get('/api/my-endpoint', (req, res) => {
    res.json({ message: 'Hello World!' });
});
```

**Add authentication to endpoint:**
```javascript
// In backend/server.js
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ user: req.user, message: 'Protected data' });
});
```

**Add new user field:**
```javascript
// Update the user creation query in server.js
const query = 'INSERT INTO users (name, lastname, username, email, password, new_field) VALUES ($1, $2, $3, $4, $5, $6)';
```

### Android Development

```bash
cd backstage_frontend
./gradlew build    # Compile Android app
```

Open in Android Studio to run on device/emulator.

---

# Administration

## Daily Checks (2 minutes)

```bash
# Morning health check
curl http://159.65.95.83:30001/health && echo "  Server OK"
curl http://159.65.95.83:30002/health && echo "  Auth OK"

# Check pod status
kubectl get pods -n backstage

# Check resource usage
kubectl top pods -n backstage
```

**What good looks like:**
- Both health checks return "healthy"
- All pods show "Running" status
- CPU < 200m, Memory < 256Mi per pod

## Weekly Tasks (15 minutes)

```bash
# Check auto-scaling
kubectl get hpa -n backstage

# Check recent errors
kubectl logs deployment/backstage-server -n backstage --tail=50 | grep -i error
kubectl logs deployment/backstage-auth -n backstage --tail=50 | grep -i error

# Backup database
pg_dump "$(doctl databases connection backstage-london-db --format URI --no-header)" > backup-$(date +%Y%m%d).sql
```

## Monthly Tasks (30 minutes)

**Security updates:**
```bash
# Rotate JWT secrets
NEW_ACCESS=$(openssl rand -base64 64)
NEW_REFRESH=$(openssl rand -base64 64)

kubectl create secret generic backstage-secrets \
  --from-literal=ACCESS_TOKEN_SECRET="$NEW_ACCESS" \
  --from-literal=REFRESH_TOKEN_SECRET="$NEW_REFRESH" \
  --from-literal=DATABASE_HOST="your-database-host" \
  --from-literal=DATABASE_PORT="25060" \
  --from-literal=DATABASE_USER="doadmin" \
  --from-literal=DATABASE_PASSWORD="your-database-password" \
  --from-literal=DATABASE_NAME="defaultdb" \
  --namespace=backstage \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/backstage-server deployment/backstage-auth -n backstage
```

## User Management

**Can't log in issues:**
```bash
# Check auth server
curl http://159.65.95.83:30002/health
kubectl logs deployment/backstage-auth -n backstage --tail=20

# Restart auth if needed
kubectl rollout restart deployment/backstage-auth -n backstage
```

**Reset user password (manual):**
```bash
kubectl exec -it deployment/backstage-server -n backstage -- node -e "
  const bcrypt = require('bcrypt');
  const pool = require('./database.js');
  bcrypt.hash('newPassword123', 10).then(hash => {
    pool.query('UPDATE users SET password = \$1 WHERE email = \$2', [hash, 'user@example.com'])
      .then(() => console.log('Password updated'))
      .finally(() => process.exit());
  });
"
```

## Scaling

**If performance is slow:**
```bash
# Scale up servers
kubectl scale deployment backstage-server --replicas=2 -n backstage
kubectl scale deployment backstage-auth --replicas=2 -n backstage

# Check auto-scaling status
kubectl get hpa -n backstage
```

**If database is slow:**
- Check DigitalOcean database dashboard
- Consider upgrading database plan
- Check for slow queries

---

# Troubleshooting

##  Complete Outage

**Symptoms:** Health checks fail, users can't access app

**Fix:**
```bash
# 1. Quick restart
kubectl rollout restart deployment/backstage-server deployment/backstage-auth -n backstage

# 2. Check if working
curl http://159.65.95.83:30001/health
curl http://159.65.95.83:30002/health

# 3. If still broken, check pods
kubectl get pods -n backstage
kubectl describe pod <failing-pod> -n backstage
```

##  App is Slow

**Symptoms:** Long response times, timeouts

**Fix:**
```bash
# 1. Check resource usage
kubectl top pods -n backstage

# 2. Scale up if needed
kubectl scale deployment backstage-server --replicas=2 -n backstage

# 3. Check database performance
doctl databases get backstage-london-db
```

##  Users Can't Log In

**Symptoms:** Login fails, authentication errors

**Fix:**
```bash
# 1. Check auth server
curl http://159.65.95.83:30002/health
kubectl logs deployment/backstage-auth -n backstage --tail=20

# 2. Restart auth server
kubectl rollout restart deployment/backstage-auth -n backstage

# 3. Test login
curl -X POST http://159.65.95.83:30002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

##  Database Issues

**Symptoms:** 500 errors, "cannot connect to database"

**Fix:**
```bash
# 1. Check database status
doctl databases get backstage-london-db

# 2. Test connection from pod
kubectl exec -it deployment/backstage-server -n backstage -- nc -zv your-database-host.db.ondigitalocean.com 25060

# 3. Check secrets
kubectl get secret backstage-secrets -n backstage -o yaml
```

## Emergency Procedures

**Data loss:**
```bash
# Restore from backup
psql "$(doctl databases connection backstage-london-db --format URI --no-header)" < latest-backup.sql

# If no backup, reinitialize
curl http://159.65.95.83:30001/setup
```

**Security breach:**
```bash
# 1. Rotate all secrets (see Monthly Tasks above)
# 2. Reset database password
doctl databases user reset backstage-london-db doadmin
# 3. Check logs for suspicious activity
kubectl logs deployment/backstage-auth -n backstage --tail=100 | grep -i "failed\|error"
```

---

# Deployment

## Deploy to New Region

### Quick Migration

**If you need to move from London to another region:**

**1. Backup current data:**
```bash
pg_dump "$(doctl databases connection backstage-london-db --format URI --no-header)" > migration-backup.sql
```

**2. Create new infrastructure:**
```bash
# Choose your region (nyc1, fra1, sfo2, etc.)
TARGET_REGION="fra1"

# Create cluster
doctl kubernetes cluster create backstage-$TARGET_REGION \
  --region $TARGET_REGION \
  --size s-2vcpu-4gb \
  --count 1

# Create database
doctl databases create backstage-$TARGET_REGION-db \
  --engine pg \
  --version 15 \
  --size db-s-1vcpu-1gb \
  --region $TARGET_REGION
```

**3. Deploy application:**
```bash
# Get credentials
doctl kubernetes cluster kubeconfig save backstage-$TARGET_REGION

# Build and push images to registry
doctl registry login
docker build -t registry.digitalocean.com/YOUR_REGISTRY/backstage-server:latest -f backend/Dockerfile.server backend/
docker build -t registry.digitalocean.com/YOUR_REGISTRY/backstage-auth:latest -f backend/Dockerfile.auth backend/
docker push registry.digitalocean.com/YOUR_REGISTRY/backstage-server:latest
docker push registry.digitalocean.com/YOUR_REGISTRY/backstage-auth:latest

# Deploy to Kubernetes
cd k8s/digitalocean
kubectl apply -f 01-namespace.yaml
kubectl apply -f 03-configmap.yaml

# Create secrets with new database info
kubectl create secret generic backstage-secrets \
  --from-literal=DATABASE_HOST="new-db-host" \
  --from-literal=DATABASE_PASSWORD="new-db-password" \
  --from-literal=ACCESS_TOKEN_SECRET="$(openssl rand -base64 64)" \
  --from-literal=REFRESH_TOKEN_SECRET="$(openssl rand -base64 64)" \
  --namespace=backstage

# Deploy apps
kubectl apply -f 04-server-deployment.yaml
kubectl apply -f 05-auth-deployment.yaml
kubectl apply -f 06-services-nodeport.yaml
kubectl apply -f 07-hpa.yaml
```

**4. Migrate data:**
```bash
psql "$(doctl databases connection backstage-$TARGET_REGION-db --format URI --no-header)" < migration-backup.sql
```

**5. Test and switch:**
```bash
# Get new IP
kubectl get nodes -o wide

# Test new deployment
curl http://NEW_IP:30001/health
curl http://NEW_IP:30002/health

# Update DNS/references to point to new IP
```

### Fresh Deployment

**For completely new setup:**

**1. Prerequisites:**
```bash
# Install tools
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz && sudo mv doctl /usr/local/bin/

# Authenticate
doctl auth init
```

**2. Create infrastructure:**
```bash
# Create cluster
doctl kubernetes cluster create backstage-cluster \
  --region lon1 \
  --size s-2vcpu-4gb \
  --count 1

# Create database  
doctl databases create backstage-db \
  --engine pg \
  --version 15 \
  --size db-s-1vcpu-1gb \
  --region lon1

# Create registry
doctl registry create backstage-registry-$(date +%s)
```

**3. Follow deployment steps above**

## Local Development Setup

**Docker Compose (Easiest):**
```bash
cd backend
docker-compose up
# Access: http://localhost:13000 (server), http://localhost:14000 (auth)
```

**Minikube (Kubernetes locally):**
```bash
# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start and deploy
minikube start
cd k8s && ./deploy.sh
minikube tunnel  # For external access
```

---

# API Reference

## Server API (Port 30001)

```bash
# Health check
GET http://159.65.95.83:30001/health

# List users  
GET http://159.65.95.83:30001/

# Create user
POST http://159.65.95.83:30001/
{
  "name": "John",
  "lastname": "Doe",
  "username": "johndoe", 
  "email": "john@example.com",
  "password": "password123"
}

# Get user profile
GET http://159.65.95.83:30001/users/profile?username=johndoe

# Protected endpoint (needs JWT)
GET http://159.65.95.83:30001/posts
Authorization: Bearer <token>

# Initialize database
GET http://159.65.95.83:30001/setup
```

## Auth API (Port 30002)

```bash
# Health check
GET http://159.65.95.83:30002/health

# Register
POST http://159.65.95.83:30002/auth/register
{
  "name": "John",
  "lastname": "Doe",
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "password123"
}

# Login
POST http://159.65.95.83:30002/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Refresh token
POST http://159.65.95.83:30002/auth/token
{
  "token": "refresh_token_here"
}

# Logout
POST http://159.65.95.83:30002/auth/logout
{
  "token": "refresh_token_here"
}
```

---

# Quick Reference

## Essential Commands

```bash
# Health checks
curl http://159.65.95.83:30001/health
curl http://159.65.95.83:30002/health

# Deployment
./london-deploy.sh status|update|test

# Pod management
kubectl get pods -n backstage
kubectl logs deployment/backstage-server -n backstage
kubectl rollout restart deployment/backstage-server -n backstage

# Database
doctl databases get backstage-london-db
pg_dump "$(doctl databases connection backstage-london-db --format URI --no-header)" > backup.sql

# Scaling
kubectl scale deployment backstage-server --replicas=2 -n backstage
kubectl get hpa -n backstage
```

## File Structure

```
backstage/
├── README.md                  # Points here
├── docs/COMPLETE_GUIDE.md     # This file (everything you need)
├── docs/QUICK_REFERENCE.md    # Commands only (created below)
├── backend/                   # Node.js servers
│   ├── server.js             # Main API
│   ├── authserver.js         # Auth API  
│   └── database.js           # DB config
├── k8s/digitalocean/         # Kubernetes configs
├── london-deploy.sh          # Main deployment script
└── backstage_frontend/       # Android app
```

## Current Infrastructure

- **Cluster**: backstage-london (DigitalOcean London)
- **Database**: backstage-london-db (PostgreSQL 15)
- **Registry**: backstage-registry-1761508031
- **External IP**: 159.65.95.83
- **Ports**: 30001 (server), 30002 (auth)
- **Cost**: ~$44/month

## Support

- **Emergency**: Restart everything and check logs
- **Performance**: Scale up pods and check database
- **Security**: Rotate secrets and check for suspicious activity
- **Deployment**: Use `./london-deploy.sh` for updates

---

**Last Updated**: October 2024 | **Status**:  Production Ready | **Location**: London