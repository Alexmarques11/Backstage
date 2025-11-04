#!/bin/bash

# Backstage Minikube Startup Script
# This script starts Minikube and deploys the Backstage application
# Can be run manually or set to run on system boot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check if Minikube is installed
log_info "Checking Minikube installation..."
if ! command -v minikube &> /dev/null; then
    log_error "Minikube is not installed!"
    exit 1
fi
log_success "Minikube is installed"

# Step 2: Check if Docker is running
log_info "Checking Docker status..."
if ! docker ps &> /dev/null; then
    log_error "Docker is not running! Please start Docker first."
    exit 1
fi
log_success "Docker is running"

# Step 3: Start Minikube (if not already running)
log_info "Starting Minikube..."
if minikube status | grep -q "Running"; then
    log_warning "Minikube is already running"
else
    minikube start --driver=docker --memory=3072 --cpus=2
    log_success "Minikube started"
fi

# Step 4: Enable required addons
log_info "Enabling addons..."
minikube addons enable ingress
minikube addons enable metrics-server
log_success "Addons enabled"

# Step 5: Configure Docker environment
log_info "Configuring Docker environment..."
eval $(minikube docker-env)

# Step 6: Build Docker images (if needed)
log_info "Checking Docker images..."
BACKEND_DIR="/home/goncalo/Backstage/backend"
K8S_DIR="/home/goncalo/Backstage/k8s"

# Check if images exist
if ! docker images | grep -q "goncalocruz/backstage-server"; then
    log_info "Building server image..."
    docker build -t goncalocruz/backstage-server:latest -f "$BACKEND_DIR/Dockerfile.server" "$BACKEND_DIR"
else
    log_success "Server image already exists"
fi

if ! docker images | grep -q "goncalocruz/backstage-auth"; then
    log_info "Building auth image..."
    docker build -t goncalocruz/backstage-auth:latest -f "$BACKEND_DIR/Dockerfile.auth" "$BACKEND_DIR"
else
    log_success "Auth image already exists"
fi

# Step 7: Check if deployment already exists
log_info "Checking existing deployment..."
if kubectl get namespace backstage &> /dev/null; then
    log_warning "Backstage namespace already exists"
    
    # Check if pods are running
    if kubectl get pods -n backstage | grep -q "Running"; then
        log_success "Backstage is already deployed and running"
        
        # Show pod status
        echo ""
        log_info "Current pod status:"
        kubectl get pods -n backstage
        
        # Setup port forwards
        log_info "Setting up port forwards..."
        pkill -f "port-forward.*backstage" 2>/dev/null || true
        kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage > /tmp/pf-server.log 2>&1 &
        kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage > /tmp/pf-auth.log 2>&1 &
        
        sleep 2
        log_success "Port forwards active"
        
        echo ""
        log_success "Backstage is ready!"
        echo ""
        echo "Access URLs:"
        echo "  - Server: http://localhost:8080"
        echo "  - Auth:   http://localhost:8081"
        echo ""
        exit 0
    else
        log_warning "Pods are not running, will redeploy..."
        kubectl delete namespace backstage --wait=true
    fi
fi

# Step 8: Deploy application
log_info "Deploying Backstage application..."

cd "$K8S_DIR"

# Apply manifests
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml

# Check if secrets exist
if ! kubectl get secret backstage-secrets -n backstage &> /dev/null; then
    log_info "Creating application secrets..."
    
    # Generate random secrets
    DB_USER="backstageuser"
    DB_PASSWORD=$(openssl rand -hex 32)
    ACCESS_TOKEN=$(openssl rand -hex 32)
    REFRESH_TOKEN=$(openssl rand -hex 32)
    
    kubectl create secret generic backstage-secrets \
        --from-literal=DATABASE_USER=$DB_USER \
        --from-literal=DATABASE_PASSWORD=$DB_PASSWORD \
        --from-literal=ACCESS_TOKEN_SECRET=$ACCESS_TOKEN \
        --from-literal=REFRESH_TOKEN_SECRET=$REFRESH_TOKEN \
        -n backstage
    
    log_success "Application secrets created"
else
    log_warning "Application secrets already exist"
    # Extract existing credentials to use for postgres-secret
    DB_USER=$(kubectl get secret backstage-secrets -n backstage -o jsonpath='{.data.DATABASE_USER}' | base64 -d)
    DB_PASSWORD=$(kubectl get secret backstage-secrets -n backstage -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d)
fi

# Create PostgreSQL secret (using same credentials)
if ! kubectl get secret postgres-secret -n backstage &> /dev/null; then
    log_info "Creating PostgreSQL secret..."
    
    kubectl create secret generic postgres-secret \
        --from-literal=POSTGRES_USER=$DB_USER \
        --from-literal=POSTGRES_PASSWORD=$DB_PASSWORD \
        --from-literal=POSTGRES_DB=backstage \
        -n backstage
    
    log_success "PostgreSQL secret created"
else
    log_warning "PostgreSQL secret already exists"
fi

# Deploy database
log_info "Deploying PostgreSQL..."

# Check if postgres deployment exists
if kubectl get deployment postgres -n backstage &> /dev/null; then
    log_info "PostgreSQL deployment already exists"
    
    # Check if secrets were just created (new deployment scenario)
    if [ ! -z "$DB_PASSWORD" ]; then
        log_warning "New secrets detected but PostgreSQL data exists - cleaning database..."
        
        # Delete postgres to force fresh initialization
        kubectl delete deployment postgres -n backstage
        kubectl delete pvc postgres-pvc -n backstage 2>/dev/null || true
        kubectl delete pv postgres-pv 2>/dev/null || true
        
        # Clean the hostPath data
        log_info "Cleaning PostgreSQL data directory..."
        minikube ssh 'sudo rm -rf /data/postgres/*' 2>/dev/null || true
        
        sleep 2
        log_success "PostgreSQL data cleaned"
    fi
else
    log_info "PostgreSQL deployment does not exist, will create new one"
fi

# Check if PV exists and is in Released state
if kubectl get pv postgres-pv 2>/dev/null | grep -q "Released"; then
    log_warning "PersistentVolume is in Released state, recreating..."
    kubectl delete pv postgres-pv
    sleep 2
fi

kubectl apply -f 03-postgres.yaml

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n backstage --timeout=120s

# Deploy application
log_info "Deploying Backstage Server..."
kubectl apply -f 04-server.yaml

log_info "Deploying Backstage Auth..."
kubectl apply -f 05-auth.yaml

# Wait for deployments to be ready
log_info "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/backstage-server -n backstage --timeout=120s
kubectl wait --for=condition=available deployment/backstage-auth -n backstage --timeout=120s

# Deploy ingress
log_info "Deploying Ingress..."
kubectl apply -f 06-ingress.yaml

# Deploy auto-scaling (HPA)
log_info "Configuring auto-scaling (HPA)..."
kubectl apply -f 07-server-hpa.yaml
kubectl apply -f 08-auth-hpa.yaml
log_success "Auto-scaling configured"

# Step 9: Configure /etc/hosts
MINIKUBE_IP=$(minikube ip)
if ! grep -q "backstage.local" /etc/hosts; then
    log_info "Adding backstage.local to /etc/hosts..."
    echo "$MINIKUBE_IP backstage.local" | sudo tee -a /etc/hosts
    log_success "/etc/hosts updated"
else
    log_warning "backstage.local already in /etc/hosts"
fi

# Step 10: Setup port forwards
log_info "Setting up port forwards..."
pkill -f "port-forward.*backstage" 2>/dev/null || true
kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage > /tmp/pf-server.log 2>&1 &
kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage > /tmp/pf-auth.log 2>&1 &

sleep 3

# Step 11: Verify deployment
log_info "Verifying deployment..."
if curl -s http://localhost:8080/health > /dev/null; then
    log_success "Server is healthy!"
else
    log_warning "Server health check failed"
fi

if curl -s http://localhost:8081/health > /dev/null; then
    log_success "Auth is healthy!"
else
    log_warning "Auth health check failed"
fi

# Step 12: Show status
echo ""
echo "================================================"
log_success "Backstage Kubernetes Deployment Complete!"
echo "================================================"
echo ""
echo "Access Information:"
echo "   - Server API:  http://localhost:8080"
echo "   - Auth API:    http://localhost:8081"
echo "   - Via Ingress: http://backstage.local"
echo ""
echo "Useful Commands:"
echo "   - View pods:        kubectl get pods -n backstage"
echo "   - View logs:        kubectl logs -f deployment/backstage-server -n backstage"
echo "   - View HPA:         kubectl get hpa -n backstage"
echo "   - Dashboard:        minikube dashboard"
echo "   - Stop Minikube:    minikube stop"
echo ""
echo "Auto-scaling:"
echo "   - Test scaling:     ../test-autoscaling.sh"
echo "   - Monitor HPA:      kubectl get hpa -n backstage -w"
echo "   - Resource usage:   kubectl top pods -n backstage"
echo ""
echo "Database Setup:"
echo "   Run: curl http://localhost:8080/setup"
echo ""
