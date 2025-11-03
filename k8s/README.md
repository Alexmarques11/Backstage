# Backstage Minikube Deployment

This directory contains Kubernetes manifests for deploying the Backstage application on **Minikube**. This is a working, tested deployment that includes external access configuration and auto-scaling.

## 🎛 Backstage Manager (Recommended)

### Quick Management
```bash
# Complete setup with auto-scaling
cd .. && ./backstage-manager.sh start

# Check status
./backstage-manager.sh status

# Quick restart (preserves data)  
./backstage-manager.sh restart

# Graceful shutdown
./backstage-manager.sh stop

# Test auto-scaling
./test-autoscaling.sh
```

**Manager Features:**
-  Complete Minikube setup and configuration
-  Docker image building and tagging  
-  Kubernetes deployment with health checks
-  Auto-scaling configuration (HPA)
-  External access setup
-  Data preservation on normal operations
-  Comprehensive status monitoring

##  Architecture

```
External Machine → Host Network → Port Forward/Relay → Minikube → Kubernetes Services → Pods
```

**Components:**
- **PostgreSQL Database**: Persistent storage for user data
- **Backstage Server**: Main API server (port 3000) with auto-scaling (2-5 replicas)
- **Auth Server**: Authentication service (port 4000) with auto-scaling (2-3 replicas)
- **External Access**: Multiple methods for cross-network connectivity
- **Auto-scaling**: HPA based on 70% CPU threshold
- **Monitoring**: Metrics-server for resource monitoring

##  File Structure

```
k8s/
├── 00-namespace.yaml     # Namespace 'backstage'
├── 01-configmap.yaml     # Non-sensitive configuration
├── 03-postgres.yaml      # PostgreSQL with persistent storage
├── 04-server.yaml        # Backstage Server (main API)
├── 05-auth.yaml          # Auth Server (authentication)
├── 06-ingress.yaml       # Ingress + NodePort services
├── deploy.sh             # Automated deployment script
├── README.md             # This file
├── MINIKUBE_SETUP.md     # Minikube installation guide
└── SECURITY.md           # Security and secrets management
../backstage-manager.sh   # Complete lifecycle management
../test-autoscaling.sh    # Auto-scaling testing
```

##  Quick Deployment

### Option 1: Backstage Manager (Recommended)
```bash
cd .. && ./backstage-manager.sh start
```
**Features:**
- Complete Minikube setup and configuration
- Docker image building in Minikube
- Kubernetes deployment with health checks
- Auto-scaling setup (HPA)
- External access configuration
- Status monitoring and management

### Option 2: Automated Deployment Script
```bash
cd k8s
./deploy.sh
```

### Option 3: Manual Deployment
Follow the steps in `SECURITY.md` for manual deployment.

## Security Notice

**NO SECRETS IN GIT** - This project generates secrets dynamically during deployment. See `SECURITY.md` for details on secure secret management.

```bash├── deploy.sh             # Script de deployment automatizado

##  External Access Methods

The deployment includes multiple tested methods for external access:

### Method 1: Port Forwarding (Primary)
```bash
kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage
kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage
```
**Access URLs:**
- Main Server: `http://YOUR_HOST_IP:8080/`
- Auth Server: `http://YOUR_HOST_IP:8081/`

### Method 2: NodePort Services
```bash
minikube service backstage-server-nodeport -n backstage --url
minikube service backstage-auth-nodeport -n backstage --url
```
**Direct Minikube Access:**
- Main Server: `http://MINIKUBE_IP:30300/`
- Auth Server: `http://MINIKUBE_IP:30400/`

### Method 3: Additional Relay Methods
For enhanced connectivity, additional relay methods (socat, Python proxy) can be configured. See the main project README for details.

##  Monitoring and Health Checks

### Quick Status Check
```bash
# Complete status with manager
../backstage-manager.sh status

# Manual status checks
kubectl get pods -n backstage
kubectl get services -n backstage
kubectl get hpa -n backstage
kubectl top pods -n backstage
```

### Test Health Endpoints
```bash
# Internal testing
kubectl exec -it deployment/backstage-server -n backstage -- curl localhost:3000/health
kubectl exec -it deployment/backstage-auth -n backstage -- curl localhost:4000/health

# External testing (after port-forward setup)
HOST_IP=$(hostname -I | awk '{print $1}')
curl http://$HOST_IP:8080/health
curl http://$HOST_IP:8081/health
```

### Monitor Auto-scaling
```bash
# Watch auto-scaling in real-time
kubectl get hpa -n backstage -w

# Test auto-scaling with load
../test-autoscaling.sh

# Monitor resource usage
kubectl top pods -n backstage
```

##  Troubleshooting

### Quick Diagnostics with Manager
```bash
# Complete status overview
../backstage-manager.sh status

# Re-setup external access if needed
../backstage-manager.sh port-forward

# Quick restart to resolve issues
../backstage-manager.sh restart
```

### Manual Troubleshooting
```bash
# Check all resources
kubectl get all -n backstage

# Describe failing pods
kubectl describe pod <pod-name> -n backstage

# View logs
kubectl logs -f deployment/backstage-server -n backstage

# Check auto-scaling issues
kubectl describe hpa -n backstage

# Restart deployment
kubectl rollout restart deployment/backstage-server -n backstage
```

### Common Issues
1. **Pods not starting**: Check logs with `kubectl logs <pod-name> -n backstage`
2. **External access failing**: Use `./backstage-manager.sh port-forward`
3. **Database connection issues**: Check PostgreSQL pod status and secrets
4. **Auto-scaling not working**: Verify metrics-server addon is enabled
5. **Port forwarding broken**: Use manager to re-establish connections

##  Scaling and Updates

### Auto-scaling (Managed Automatically)
The manager automatically configures:
- **Server**: 2-5 replicas based on 70% CPU threshold
- **Auth**: 2-3 replicas based on 70% CPU threshold

```bash
# Test auto-scaling
../test-autoscaling.sh

# Monitor scaling
kubectl get hpa -n backstage -w
```

### Manual Scaling
```bash
kubectl scale deployment backstage-server --replicas=3 -n backstage
kubectl scale deployment backstage-auth --replicas=2 -n backstage
```

### Update Services
```bash
# With manager (recommended)
../backstage-manager.sh restart

# Manual updates
eval $(minikube docker-env)
docker build -t goncalocruz/backstage-server:latest -f ../backend/Dockerfile.server ../backend/
kubectl rollout restart deployment/backstage-server -n backstage
```

This deployment has been tested and confirmed working with external access from different network segments and includes comprehensive auto-scaling capabilities.
