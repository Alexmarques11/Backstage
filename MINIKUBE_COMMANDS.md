# Minikube Commands Reference

This document explains all Minikube and Kubernetes commands used in the BackstageKotlin project.

## 🎛️ Backstage Manager (Recommended)

### Quick Management Commands
```bash
# Complete setup with auto-scaling
./backstage-manager.sh start

# Check current status  
./backstage-manager.sh status

# Quick app restart (preserves data)
./backstage-manager.sh restart

# Graceful shutdown
./backstage-manager.sh stop

# Re-setup external access
./backstage-manager.sh port-forward

# Complete cleanup (deletes everything)
./backstage-manager.sh clean
```

**What the manager does:**
- **Smart Setup**: Only creates/builds what's needed
- **Auto-scaling**: Configures HPA automatically
- **Data Preservation**: Normal operations preserve database
- **External Access**: Sets up cross-network port forwarding
- **Health Monitoring**: Waits for services to be ready

### Manager vs Manual Commands
| Operation | Manager | Manual |
|-----------|---------|--------|
| **Complete Setup** | `./backstage-manager.sh start` | 15+ commands |
| **Status Check** | `./backstage-manager.sh status` | 5+ commands |
| **Quick Restart** | `./backstage-manager.sh restart` | 8+ commands |
| **External Access** | `./backstage-manager.sh port-forward` | 3+ commands |

## ☸️ Minikube Setup Commands

### Initial Setup

#### Start Minikube
```bash
minikube start --memory=3072 --cpus=2 --driver=docker
```
**What it does:**
- `--memory=3072`: Allocates 3GB RAM to Minikube VM
- `--cpus=2`: Allocates 2 CPU cores
- `--driver=docker`: Uses Docker as the virtualization driver
- Creates a local Kubernetes cluster for development

#### Enable Required Addons
```bash
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```
**What it does:**
- `ingress`: Enables NGINX Ingress Controller for external access
- `metrics-server`: Enables resource monitoring and HPA (Horizontal Pod Autoscaler)
- `dashboard`: Enables Kubernetes web dashboard for cluster management

#### Get Cluster Information
```bash
minikube status
minikube ip
minikube service list
```
**What it does:**
- `status`: Shows current state of Minikube cluster
- `ip`: Returns the IP address of Minikube cluster
- `service list`: Shows all services and their access URLs

### Docker Environment Setup

#### Configure Docker to Use Minikube
```bash
eval $(minikube docker-env)
```
**What it does:**
- Sets environment variables to use Minikube's Docker daemon
- Allows building images directly in Minikube's Docker registry
- Images built this way are immediately available to Kubernetes

#### Build Images in Minikube
```bash
docker build -t backstage-server -f Dockerfile.server .
docker build -t backstage-auth -f Dockerfile.auth .
```
**What it does:**
- Builds images inside Minikube's Docker environment
- Images are tagged for use in Kubernetes manifests
- No need to push to external registry

## 🚀 Kubernetes Deployment Commands

### Namespace Management

#### Create Namespace
```bash
kubectl create namespace backstage
kubectl get namespaces
```
**What it does:**
- Creates isolated environment for Backstage resources
- `get namespaces`: Lists all namespaces in cluster

#### Set Default Namespace
```bash
kubectl config set-context --current --namespace=backstage
```
**What it does:**
- Sets backstage as default namespace for subsequent commands
- Avoids need to specify `-n backstage` in every command

### Secret Management

#### Create Secrets
```bash
kubectl create secret generic backstage-secrets \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=jwt-refresh-secret="$(openssl rand -base64 32)" \
  -n backstage
```
**What it does:**
- `generic`: Creates secret from literal values
- `openssl rand -base64 32`: Generates cryptographically secure random string
- Stores JWT secrets securely in Kubernetes

#### View Secrets (Base64 encoded)
```bash
kubectl get secrets -n backstage
kubectl describe secret backstage-secrets -n backstage
```
**What it does:**
- `get secrets`: Lists all secrets in namespace
- `describe`: Shows secret metadata (not the actual values)

### ConfigMap Management

#### Create ConfigMap
```bash
kubectl apply -f 01-configmap.yaml
kubectl get configmap -n backstage
```
**What it does:**
- Creates configuration data that can be consumed by pods
- Stores non-sensitive configuration like database connection strings
- `get configmap`: Lists all configuration maps

### Database Deployment

#### Deploy PostgreSQL
```bash
kubectl apply -f 03-postgres.yaml
kubectl get statefulset -n backstage
kubectl get pvc -n backstage
```
**What it does:**
- `StatefulSet`: Ensures stable network identity and persistent storage
- `pvc`: Persistent Volume Claim for database data storage
- Database data persists even if pod is deleted/recreated

### Application Deployment

#### Deploy Backstage Services
```bash
kubectl apply -f 04-server.yaml
kubectl apply -f 05-auth.yaml
```
**What it does:**
- Creates Deployments with replica sets for high availability
- Creates Services for internal communication
- Creates NodePort services for external access

#### Check Deployment Status
```bash
kubectl get deployments -n backstage
kubectl get pods -n backstage
kubectl get services -n backstage
```
**What it does:**
- `deployments`: Shows deployment status and replicas
- `pods`: Shows individual container instances
- `services`: Shows service endpoints and ports

### Monitoring and Debugging

#### Pod Management
```bash
kubectl get pods -n backstage -w
kubectl describe pod <pod-name> -n backstage
kubectl logs <pod-name> -n backstage
kubectl logs -f <pod-name> -n backstage
```
**What it does:**
- `-w`: Watches for changes in real-time
- `describe`: Shows detailed pod information including events
- `logs`: Shows container output
- `-f`: Follows logs in real-time

#### Service Debugging
```bash
kubectl get endpoints -n backstage
kubectl describe service backstage-server-service -n backstage
```
**What it does:**
- `endpoints`: Shows which pods are backing each service
- `describe service`: Shows service configuration and endpoints

#### Resource Monitoring
```bash
kubectl top pods -n backstage
kubectl top nodes
```
**What it does:**
- Shows CPU and memory usage for pods and nodes
- Requires metrics-server addon to be enabled

### External Access Commands

#### Port Forwarding
```bash
kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage
kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage
```
**What it does:**
- `--address 0.0.0.0`: Binds to all network interfaces (allows external access)
- `8080:3000`: Maps local port 8080 to service port 3000
- Creates secure tunnel from local machine to Kubernetes service

#### Minikube Service Access
```bash
minikube service backstage-server-nodeport -n backstage
minikube service backstage-auth-nodeport -n backstage
minikube service list -n backstage
```
**What it does:**
- Opens service in default browser with correct URL
- Shows direct access URLs to NodePort services
- `list`: Shows all services and their access methods

#### Get Service URLs
```bash
minikube service backstage-server-nodeport -n backstage --url
minikube service backstage-auth-nodeport -n backstage --url
```
**What it does:**
- `--url`: Returns only the URL without opening browser
- Useful for scripts and automation

### Health Checks and Testing

#### Service Health Checks
```bash
kubectl exec -it deployment/backstage-server -n backstage -- curl localhost:3000/health
kubectl exec -it deployment/backstage-auth -n backstage -- curl localhost:4000/health
```
**What it does:**
- `exec -it`: Executes command inside running container
- Tests health endpoints from within the cluster
- Validates internal service communication

#### Database Connection Test
```bash
kubectl exec -it statefulset/postgres -n backstage -- psql -U backstage -d backstage -c "\l"
```
**What it does:**
- Connects to PostgreSQL container
- Lists all databases to verify connection
- Tests database availability

## 🔧 Advanced Operations

### Scaling Applications

#### Manual Scaling
```bash
kubectl scale deployment backstage-server --replicas=3 -n backstage
kubectl scale deployment backstage-auth --replicas=2 -n backstage
```
**What it does:**
- Changes number of running pod replicas
- Kubernetes automatically load balances between replicas
- Useful for handling increased traffic

### Auto-scaling (HPA)
```bash
kubectl autoscale deployment backstage-server --cpu-percent=70 --min=2 --max=5 -n backstage
kubectl autoscale deployment backstage-auth --cpu-percent=70 --min=2 --max=3 -n backstage
kubectl get hpa -n backstage
kubectl top pods -n backstage
```
**What it does:**
- Automatically scales based on CPU usage
- `--cpu-percent=70`: Triggers scaling when CPU exceeds 70%
- `--min/max`: Sets scaling limits (server: 2-5, auth: 2-3)
- `get hpa`: Shows current auto-scaling status
- `top pods`: Shows CPU/memory usage

**Auto-scaling Testing:**
```bash
# Test auto-scaling with load
./test-autoscaling.sh

# Monitor scaling in real-time
kubectl get hpa -n backstage -w
```

### Rolling Updates

#### Update Deployment
```bash
kubectl set image deployment/backstage-server backstage-server=backstage-server:v2 -n backstage
kubectl rollout status deployment/backstage-server -n backstage
```
**What it does:**
- Updates container image without downtime
- `rollout status`: Monitors update progress
- Performs rolling update (replaces pods gradually)

#### Rollback Deployment
```bash
kubectl rollout history deployment/backstage-server -n backstage
kubectl rollout undo deployment/backstage-server -n backstage
```
**What it does:**
- `history`: Shows previous deployment versions
- `undo`: Rolls back to previous version

### Configuration Updates

#### Update ConfigMap
```bash
kubectl create configmap backstage-config --from-file=config.json -n backstage --dry-run=client -o yaml | kubectl apply -f -
```
**What it does:**
- `--dry-run=client`: Generates YAML without applying
- Allows updating ConfigMap from file
- Pods may need restart to pick up changes

#### Restart Deployment (to pick up config changes)
```bash
kubectl rollout restart deployment/backstage-server -n backstage
kubectl rollout restart deployment/backstage-auth -n backstage
```
**What it does:**
- Forces pods to restart and pick up new configuration
- Performs rolling restart (maintains availability)

### Cleanup Operations

#### Delete Specific Resources
```bash
kubectl delete deployment backstage-server -n backstage
kubectl delete service backstage-server-service -n backstage
kubectl delete pvc postgres-storage -n backstage
```
**What it does:**
- Removes specific Kubernetes resources
- PVC deletion also removes persistent data

#### Delete Entire Namespace
```bash
kubectl delete namespace backstage
```
**What it does:**
- Removes namespace and ALL resources within it
- Equivalent to complete uninstall

#### Minikube Cleanup
```bash
minikube stop
minikube delete
minikube start --memory=3072 --cpus=2 --driver=docker
```
**What it does:**
- `stop`: Pauses Minikube cluster
- `delete`: Completely removes Minikube cluster and data
- Fresh start removes all deployments and data

## 🎯 Project-Specific Workflows

### Complete Deployment with Manager (Recommended)
```bash
# One command setup with auto-scaling
./backstage-manager.sh start

# Check everything is working
./backstage-manager.sh status

# Test auto-scaling
./test-autoscaling.sh
```

### Manual Complete Deployment Workflow
```bash
# 1. Start Minikube
minikube start --memory=3072 --cpus=2 --driver=docker

# 2. Enable addons
minikube addons enable ingress metrics-server dashboard

# 3. Configure Docker environment
eval $(minikube docker-env)

# 4. Build images
docker build -t backstage-server -f backend/Dockerfile.server backend/
docker build -t backstage-auth -f backend/Dockerfile.auth backend/
docker tag backstage-server:latest goncalocruz/backstage-server:latest
docker tag backstage-auth:latest goncalocruz/backstage-auth:latest

# 5. Deploy to Kubernetes
cd k8s
./deploy.sh

# 6. Setup auto-scaling
kubectl autoscale deployment backstage-server --cpu-percent=70 --min=2 --max=5 -n backstage
kubectl autoscale deployment backstage-auth --cpu-percent=70 --min=2 --max=3 -n backstage

# 7. Check deployment
kubectl get pods -n backstage
kubectl get services -n backstage
kubectl get hpa -n backstage

# 8. Setup external access
kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage &
kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage &
```

### Daily Development Workflow with Manager
```bash
# Morning - start everything
./backstage-manager.sh start

# Check status throughout the day
./backstage-manager.sh status

# Quick restart after code changes
./backstage-manager.sh restart

# Evening - stop but keep data
./backstage-manager.sh stop
```

### Troubleshooting Workflow
```bash
# 1. Quick status check with manager
./backstage-manager.sh status

# 2. Check pod status
kubectl get pods -n backstage

# 3. Check pod details if issues found
kubectl describe pod <failing-pod> -n backstage

# 4. Check logs
kubectl logs <failing-pod> -n backstage

# 5. Check service endpoints
kubectl get endpoints -n backstage

# 6. Test internal connectivity
kubectl exec -it deployment/backstage-server -n backstage -- curl backstage-auth-service:4000/health

# 7. Check auto-scaling status
kubectl get hpa -n backstage
kubectl top pods -n backstage

# 8. Test external access
curl http://$(hostname -I | awk '{print $1}'):8080/health

# 9. If port forwarding issues
./backstage-manager.sh port-forward
```

### Development Workflow
```bash
# 1. Make code changes
# 2. Build new image
eval $(minikube docker-env)
docker build -t backstage-server -f backend/Dockerfile.server backend/

# 3. Update deployment
kubectl rollout restart deployment/backstage-server -n backstage

# 4. Monitor rollout
kubectl rollout status deployment/backstage-server -n backstage

# 5. Test changes
curl http://$(minikube ip):30300/health
```

This reference covers all Minikube and Kubernetes commands used in the BackstageKotlin project, with detailed explanations of what each command accomplishes and when to use it.