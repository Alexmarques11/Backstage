# Backstage Digital Ocean Deployment

This document contains comprehensive information about the Backstage production deployment on **DigitalOcean Kubernetes Service (DOKS)**. This is a battle-tested, production-ready deployment running in the London region.

## Production Environment Overview

### Current Status
- **Status**: Production Ready
- **Region**: London (lon1) - Optimized for European users
- **Cluster**: backstage-london
- **Database**: Managed PostgreSQL with SSL encryption
- **High Availability**: Auto-scaling enabled with multiple replicas

### Access Information
```
Server API:  http://159.65.95.83:30001
Auth API:    http://159.65.95.83:30002
```

## Architecture

```
Internet → DigitalOcean Load Balancer → NodePort Services → Kubernetes Pods → Managed PostgreSQL
```

**Production Components:**
- **Managed PostgreSQL**: DigitalOcean managed database with automatic backups and SSL
- **Backstage Server**: Main API server (4 replicas for high availability)
- **Auth Server**: Authentication service (2 replicas)
- **Container Registry**: Private DigitalOcean container registry
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) based on CPU/memory metrics
- **Load Balancing**: NodePort services with external IP access
- **SSL/TLS**: Encrypted database connections

## Infrastructure Details

### Cluster Configuration
```yaml
Cluster Name: backstage-london
Region: lon1 (London)
Kubernetes Version: Latest stable
Node Pool: 2 nodes
Node Size: Basic (2 vCPU, 4GB RAM)
IP Address: 159.65.95.83
```

### Database Configuration
```yaml
Database Name: backstage-london-db
Engine: PostgreSQL 15
Connection: SSL enabled (required)
Backup: Automatic daily backups
High Availability: Managed by DigitalOcean
```

### Container Registry
```yaml
Registry: registry.digitalocean.com/backstage-registry-1761508031
Images:
  - backstage-server:latest
  - backstage-auth:latest
Access: Private, authenticated
```

## File Structure

```
/
├── london-deploy.sh              # Main production deployment script (270 lines)
├── k8s/digitalocean/
│   ├── 01-namespace.yaml         # Namespace 'backstage'
│   ├── 02-secrets.yaml           # Secure credentials (never in git)
│   ├── 03-configmap.yaml         # Environment configuration
│   ├── 04-server-deployment.yaml # Server deployment (4 replicas)
│   ├── 05-auth-deployment.yaml   # Auth deployment (2 replicas)
│   ├── 06-ingress.yaml           # NodePort services
│   ├── 07-hpa.yaml               # Auto-scaling configuration
│   └── deploy.sh                 # Alternative deployment script
└── backend/
    ├── Dockerfile.server         # Server container build
    └── Dockerfile.auth           # Auth container build
```

## Deployment Process

### Prerequisites
```bash
# Install doctl (DigitalOcean CLI)
sudo snap install doctl

# Authenticate with DigitalOcean
doctl auth init

# Verify authentication
doctl account get

# Install kubectl
sudo snap install kubectl --classic
```

### Full Production Deployment

#### Method 1: Complete Deployment (Recommended)
```bash
# Run the comprehensive deployment script
./london-deploy.sh

# This script performs:
# 1. Prerequisites verification (doctl, kubectl, docker)
# 2. Cluster creation/verification
# 3. Managed PostgreSQL database setup
# 4. Container registry configuration
# 5. Docker image building and pushing
# 6. Kubernetes manifest deployment
# 7. Auto-scaling configuration
# 8. Health verification
```

#### Method 2: Manual Step-by-Step Deployment
```bash
# 1. Connect to cluster
doctl kubernetes cluster kubeconfig save backstage-london

# 2. Verify connection
kubectl cluster-info

# 3. Create namespace
kubectl apply -f k8s/digitalocean/01-namespace.yaml

# 4. Create secrets (generate secure values first!)
kubectl create secret generic backstage-secrets \
  --from-literal=DATABASE_USER=your_db_user \
  --from-literal=DATABASE_PASSWORD=your_secure_password \
  --from-literal=ACCESS_TOKEN_SECRET=your_jwt_secret \
  --from-literal=REFRESH_TOKEN_SECRET=your_refresh_secret \
  -n backstage

# 5. Apply configuration
kubectl apply -f k8s/digitalocean/03-configmap.yaml

# 6. Deploy applications
kubectl apply -f k8s/digitalocean/04-server-deployment.yaml
kubectl apply -f k8s/digitalocean/05-auth-deployment.yaml

# 7. Create services
kubectl apply -f k8s/digitalocean/06-ingress.yaml

# 8. Enable auto-scaling
kubectl apply -f k8s/digitalocean/07-hpa.yaml
```

### Building and Pushing Images
```bash
# Authenticate with registry
doctl registry login

# Build server image
docker build -t registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest \
  -f backend/Dockerfile.server backend/

# Build auth image
docker build -t registry.digitalocean.com/backstage-registry-1761508031/backstage-auth:latest \
  -f backend/Dockerfile.auth backend/

# Push images to registry
docker push registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest
docker push registry.digitalocean.com/backstage-registry-1761508031/backstage-auth:latest
```

## Monitoring and Management

### Quick Status Check
```bash
# Using london-deploy.sh
./london-deploy.sh status

# Manual checks
kubectl get pods -n backstage
kubectl get services -n backstage
kubectl get hpa -n backstage
kubectl top pods -n backstage
```

### Health Monitoring
```bash
# Check server health
curl http://159.65.95.83:30001/health

# Check auth health
curl http://159.65.95.83:30002/health

# Expected response:
{
  "status": "healthy",
  "service": "backstage-server",
  "timestamp": "2025-11-04T..."
}
```

### View Logs
```bash
# Server logs
kubectl logs -f deployment/backstage-server -n backstage

# Auth logs
kubectl logs -f deployment/backstage-auth -n backstage

# All pods logs
kubectl logs -f -l app=backstage-server -n backstage

# Tail last 100 lines
kubectl logs --tail=100 deployment/backstage-server -n backstage
```

### Resource Monitoring
```bash
# Pod resource usage
kubectl top pods -n backstage

# Node resource usage
kubectl top nodes

# Detailed pod information
kubectl describe pod <pod-name> -n backstage

# Watch auto-scaling in real-time
kubectl get hpa -n backstage -w
```

## Auto-scaling Configuration

### Current HPA Settings

**Server Auto-scaling:**
```yaml
Min Replicas: 2
Max Replicas: 10
Target CPU: 70%
Target Memory: 80%
Scale-up Behavior: Gradual (add 2 pods per 60s)
Scale-down Behavior: Conservative (remove 1 pod per 60s)
```

**Auth Auto-scaling:**
```yaml
Min Replicas: 1
Max Replicas: 5
Target CPU: 70%
Target Memory: 80%
Scale-up Behavior: Gradual (add 1 pod per 60s)
Scale-down Behavior: Conservative (remove 1 pod per 60s)
```

### Monitor Auto-scaling Events
```bash
# Watch HPA status
kubectl get hpa -n backstage -w

# View scaling events
kubectl get events -n backstage --sort-by='.lastTimestamp'

# Describe HPA for detailed info
kubectl describe hpa backstage-server-hpa -n backstage
kubectl describe hpa backstage-auth-hpa -n backstage
```

## Database Management

### Connection Information
```bash
# Database is managed by DigitalOcean
# Connection details stored in Kubernetes secrets
# SSL encryption is REQUIRED

# View connection config (without passwords)
kubectl get configmap backstage-config -n backstage -o yaml
```

### Database Operations
```bash
# Setup database tables
curl -X GET http://159.65.95.83:30001/setup

# Verify database connectivity (from pod)
kubectl exec -it deployment/backstage-server -n backstage -- \
  curl localhost:3000/health
```

### Backup and Recovery
- **Automatic Backups**: Daily backups managed by DigitalOcean
- **Point-in-Time Recovery**: Available through DO console
- **Backup Retention**: Configurable in DigitalOcean dashboard
- **Manual Backup**: Use DigitalOcean console or doctl CLI

## Security Features

### Network Security
- **SSL/TLS**: All database connections encrypted
- **Private Registry**: Container images in private DO registry
- **Secrets Management**: Kubernetes secrets for sensitive data
- **Network Policies**: Pod-to-pod communication controlled

### Application Security
- **JWT Authentication**: Secure token-based authentication
- **bcrypt Password Hashing**: Industry-standard password encryption
- **Input Validation**: SQL injection and XSS protection
- **Environment Variables**: No hardcoded credentials

### Access Control
- **RBAC**: Kubernetes role-based access control
- **Service Accounts**: Dedicated service accounts per service
- **API Keys**: Secure API key management
- **Audit Logs**: Available through DigitalOcean

## API Endpoints

### Server Endpoints (Port 30001)
```bash
# Health check
GET http://159.65.95.83:30001/health

# Database setup
GET http://159.65.95.83:30001/setup

# List users
GET http://159.65.95.83:30001/

# Create user
POST http://159.65.95.83:30001/
Content-Type: application/json
{
  "name": "John",
  "lastname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}

# Get user profile
GET http://159.65.95.83:30001/users/profile
Content-Type: application/json
{
  "username": "johndoe"
}

# Update user profile
PATCH http://159.65.95.83:30001/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json
{
  "username": "johndoe",
  "age": 25,
  "musical_genre": ["Rock", "Jazz"]
}

# Protected endpoint (requires JWT)
GET http://159.65.95.83:30001/posts
Authorization: Bearer <jwt_token>
```

### Auth Endpoints (Port 30002)
```bash
# Health check
GET http://159.65.95.83:30002/health

# Register new user
POST http://159.65.95.83:30002/auth/register
Content-Type: application/json
{
  "name": "John",
  "lastname": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}

# Login
POST http://159.65.95.83:30002/auth/login
Content-Type: application/json
{
  "username": "johndoe",
  "password": "securepass123"
}

# Refresh token
POST http://159.65.95.83:30002/auth/token
Content-Type: application/json
{
  "token": "<refresh_token>"
}

# Logout
POST http://159.65.95.83:30002/auth/logout
Content-Type: application/json
{
  "token": "<refresh_token>"
}
```

## Updates and Rollbacks

### Update Application
```bash
# 1. Build new images
docker build -t registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest \
  -f backend/Dockerfile.server backend/
docker push registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest

# 2. Restart deployment (pulls new image)
kubectl rollout restart deployment/backstage-server -n backstage

# 3. Monitor rollout
kubectl rollout status deployment/backstage-server -n backstage

# 4. Verify new pods
kubectl get pods -n backstage
```

### Rollback Deployment
```bash
# View rollout history
kubectl rollout history deployment/backstage-server -n backstage

# Rollback to previous version
kubectl rollout undo deployment/backstage-server -n backstage

# Rollback to specific revision
kubectl rollout undo deployment/backstage-server --to-revision=2 -n backstage

# Monitor rollback
kubectl rollout status deployment/backstage-server -n backstage
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting
```bash
# Check pod status
kubectl get pods -n backstage

# Describe pod for events
kubectl describe pod <pod-name> -n backstage

# Check logs
kubectl logs <pod-name> -n backstage

# Common causes:
# - Image pull errors: Check registry authentication
# - Resource limits: Check node resources
# - Database connection: Verify DATABASE_SSL and credentials
```

#### 2. Database Connection Errors
```bash
# Verify secrets exist
kubectl get secrets -n backstage

# Check database configuration
kubectl get configmap backstage-config -n backstage -o yaml

# Test database from pod
kubectl exec -it deployment/backstage-server -n backstage -- sh
# Inside pod:
curl localhost:3000/health

# Common fixes:
# - Ensure DATABASE_SSL is NOT set to 'false' (managed DB requires SSL)
# - Verify DATABASE_USER and DATABASE_PASSWORD in secrets
# - Check database host in configmap
```

#### 3. External Access Issues
```bash
# Check services
kubectl get services -n backstage

# Verify NodePort services
kubectl describe service backstage-server-nodeport -n backstage

# Check firewall rules
doctl compute firewall list

# Test from server
curl http://159.65.95.83:30001/health

# Common fixes:
# - Add firewall rule for ports 30001-30002
# - Verify NodePort range (30000-32767)
# - Check cluster external IP
```

#### 4. Auto-scaling Not Working
```bash
# Check HPA status
kubectl get hpa -n backstage

# Describe HPA for issues
kubectl describe hpa backstage-server-hpa -n backstage

# Verify metrics-server
kubectl get apiservice v1beta1.metrics.k8s.io

# Common fixes:
# - Ensure metrics-server is running
# - Check resource requests are set in deployment
# - Verify CPU/memory thresholds are appropriate
```

#### 5. High Resource Usage
```bash
# Check resource consumption
kubectl top pods -n backstage
kubectl top nodes

# Check for memory leaks
kubectl logs --tail=200 deployment/backstage-server -n backstage | grep -i error

# Increase resource limits
kubectl edit deployment backstage-server -n backstage

# Scale manually if needed
kubectl scale deployment backstage-server --replicas=6 -n backstage
```

### Emergency Procedures

#### Complete Restart
```bash
# Restart all deployments
kubectl rollout restart deployment/backstage-server -n backstage
kubectl rollout restart deployment/backstage-auth -n backstage

# Wait for rollout to complete
kubectl rollout status deployment/backstage-server -n backstage
kubectl rollout status deployment/backstage-auth -n backstage
```

#### Delete and Redeploy
```bash
# WARNING: This will cause downtime
kubectl delete namespace backstage

# Redeploy using script
./london-deploy.sh
```

#### Database Recovery
```bash
# Access DigitalOcean console
# Navigate to Databases → backstage-london-db
# Use "Restore from Backup" feature
# Update connection string if database host changed
```

## Performance Optimization

### Resource Tuning
```yaml
# Current resource settings (server)
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# Adjust based on metrics:
kubectl edit deployment backstage-server -n backstage
```

### Connection Pooling
```javascript
// database.js already configured with connection pooling
const pool = new Pool({
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Strategies
- Implement Redis for session caching (future enhancement)
- Use CDN for static assets
- Database query optimization with indexes

## Cost Management

### Current Costs (Approximate)
```
DOKS Cluster (2 nodes):     $24/month
Managed PostgreSQL:         $15/month
Container Registry:         $5/month
Load Balancer:              $12/month
Bandwidth:                  Variable
-----------------------------------------
Total (estimated):          ~$56/month
```

### Cost Optimization Tips
1. **Right-size nodes**: Adjust based on actual usage
2. **Auto-scaling**: Reduces unnecessary replicas during low traffic
3. **Database optimization**: Use connection pooling, optimize queries
4. **Image cleanup**: Remove unused images from registry
5. **Monitoring**: Set up alerts for unexpected usage spikes

## CI/CD Integration

### GitHub Actions Workflows

**Backend CI** (`.github/workflows/backend-ci.yml`):
- Runs on push to `main` or `develop`
- Tests API endpoints with PostgreSQL
- Builds and tests Docker images
- Validates deployment configuration

**Docker Deploy** (`.github/workflows/docker-deploy.yml`):
- Triggered on push to `main` and releases
- Builds Docker images for server and auth
- Pushes to Docker Hub (goncalocruz/backstage-server, goncalocruz/backstage-auth)
- Images can be pulled for deployment

### Deployment Workflow
```bash
# 1. Code changes pushed to GitHub
# 2. GitHub Actions runs tests
# 3. Docker images built and pushed
# 4. Manual deployment to production:
./london-deploy.sh

# Or update specific service:
kubectl set image deployment/backstage-server \
  backstage-server=registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest \
  -n backstage
```

## Maintenance Schedule

### Regular Tasks

**Daily:**
- Monitor health endpoints
- Check auto-scaling metrics
- Review error logs

**Weekly:**
- Review resource usage
- Check database performance
- Update security patches

**Monthly:**
- Database backup verification
- Cost analysis
- Performance optimization review

**Quarterly:**
- Kubernetes version updates
- Dependency updates
- Security audit

## Support and Documentation

### Additional Resources
- **Kubernetes Docs**: `/k8s/README.md`
- **Security Guide**: `/k8s/SECURITY.md`
- **Minikube Setup**: `/k8s/MINIKUBE_SETUP.md`
- **Docker Guide**: `/docs/DOCKER_KUBERNETES_EXPLAINED.md`
- **Complete Guide**: `/docs/COMPLETE_GUIDE.md`

### Useful Commands Reference
```bash
# Quick status
./london-deploy.sh status

# View all resources
kubectl get all -n backstage

# Port forward for debugging
kubectl port-forward deployment/backstage-server 3000:3000 -n backstage

# Execute command in pod
kubectl exec -it deployment/backstage-server -n backstage -- sh

# View resource usage
kubectl top pods -n backstage

# Get cluster info
kubectl cluster-info

# List all contexts
kubectl config get-contexts

# Switch context
kubectl config use-context do-lon1-backstage-london
```

## Production Checklist

Before going live:
- [ ] Database backups configured
- [ ] SSL certificates valid
- [ ] Secrets properly secured
- [ ] Auto-scaling tested
- [ ] Health monitoring setup
- [ ] Logging configured
- [ ] Resource limits appropriate
- [ ] Firewall rules configured
- [ ] Load testing completed
- [ ] Rollback procedure documented
- [ ] Team trained on operations
- [ ] Emergency contacts established

---

**Last Updated**: November 4, 2025  
**Status**: Production Ready  
**Location**: London (lon1)  
**Cluster**: backstage-london  
**Maintainer**: Backstage Team
