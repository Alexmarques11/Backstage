#!/bin/bash

echo " BACKSTAGE LONDON DEPLOYMENT SCRIPT"
echo "======================================"
echo ""

# Configuration
CLUSTER_NAME="backstage-london"
REGION="lon1"
DB_NAME="backstage-london-db"
REGISTRY_NAME="backstage-registry-2026"
NAMESPACE="backstage"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
log_info() { echo -e "${BLUE}ℹ  $1${NC}"; }
log_success() { echo -e "${GREEN} $1${NC}"; }
log_warning() { echo -e "${YELLOW}  $1${NC}"; }
log_error() { echo -e "${RED} $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v doctl &> /dev/null; then
        log_error "doctl not found. Please install DigitalOcean CLI."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "docker not found. Please install Docker."
        exit 1
    fi
    
    if ! doctl account get &> /dev/null; then
        log_error "Not authenticated with DigitalOcean. Run: doctl auth init"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Get cluster status
get_cluster_status() {
    log_info "Checking current deployment status..."
    
    # Check cluster
    if doctl kubernetes cluster get $CLUSTER_NAME &> /dev/null; then
        CLUSTER_STATUS=$(doctl kubernetes cluster get $CLUSTER_NAME --format Status --no-header)
        log_info "Cluster $CLUSTER_NAME status: $CLUSTER_STATUS"
    else
        log_warning "Cluster $CLUSTER_NAME not found"
        CLUSTER_STATUS="not-found"
    fi
    
    # Check database
    if doctl databases list | grep -q $DB_NAME; then
        DB_STATUS=$(doctl databases list | grep $DB_NAME | awk '{print $7}')
        log_info "Database $DB_NAME status: $DB_STATUS"
    else
        log_warning "Database $DB_NAME not found"
        DB_STATUS="not-found"
    fi
    
    # Check if kubectl is connected
    if kubectl cluster-info &> /dev/null; then
        KUBECTL_CONTEXT=$(kubectl config current-context)
        log_info "kubectl connected to: $KUBECTL_CONTEXT"
    else
        log_warning "kubectl not connected to any cluster"
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application to London cluster..."
    
    # Ensure we're connected to the right cluster
    doctl kubernetes cluster kubeconfig save $CLUSTER_NAME
    kubectl config use-context do-$REGION-$CLUSTER_NAME
    
    # Create namespace
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Create registry secret
    log_info "Creating registry secret..."
    doctl registry kubernetes-manifest --namespace $NAMESPACE | kubectl apply -f -
    
    # Create application secrets
    log_info "Creating application secrets..."
    log_warning "Using existing secrets - update if database credentials changed"
    
    # Apply configurations
    log_info "Applying Kubernetes configurations..."
    kubectl apply -f k8s/digitalocean/03-configmap.yaml
    kubectl apply -f k8s/digitalocean/04-server-deployment.yaml  
    kubectl apply -f k8s/digitalocean/05-auth-deployment.yaml
    kubectl apply -f k8s/digitalocean/06-services-nodeport.yaml
    kubectl apply -f k8s/digitalocean/07-hpa.yaml
    
    # Wait for deployments
    log_info "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/backstage-server deployment/backstage-auth -n $NAMESPACE
    
    log_success "Application deployed successfully"
}

# Show access information
show_access_info() {
    log_info "Getting access information..."
    
    # Get node external IP
    EXTERNAL_IP=$(kubectl get nodes -o wide | grep -v NAME | awk '{print $7}' | head -1)
    
    if [ -z "$EXTERNAL_IP" ]; then
        log_warning "Could not get external IP"
        return
    fi
    
    echo ""
    log_success "BACKSTAGE LONDON DEPLOYMENT READY!"
    echo ""
    echo " Access URLs:"
    echo "   Server API:  http://$EXTERNAL_IP:30001"
    echo "   Auth API:    http://$EXTERNAL_IP:30002"
    echo "   Health:      http://$EXTERNAL_IP:30001/health"
    echo ""
    echo " Management Commands:"
    echo "   Status:      kubectl get pods -n $NAMESPACE"
    echo "   Logs:        kubectl logs -f deployment/backstage-server -n $NAMESPACE"
    echo "   Scale:       kubectl scale deployment backstage-server --replicas=2 -n $NAMESPACE"
    echo ""
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    EXTERNAL_IP=$(kubectl get nodes -o wide | grep -v NAME | awk '{print $7}' | head -1)
    
    if [ -z "$EXTERNAL_IP" ]; then
        log_error "Could not get external IP for testing"
        return 1
    fi
    
    # Test server health
    log_info "Testing server health..."
    if curl -sf http://$EXTERNAL_IP:30001/health > /dev/null; then
        log_success "Server health check passed"
    else
        log_error "Server health check failed"
        return 1
    fi
    
    # Test auth health
    log_info "Testing auth health..."
    if curl -sf http://$EXTERNAL_IP:30002/health > /dev/null; then
        log_success "Auth health check passed"
    else
        log_error "Auth health check failed"
        return 1
    fi
    
    log_success "All tests passed!"
}

# Build and push images
build_and_push() {
    log_info "Building and pushing Docker images..."
    
    # Login to registry
    doctl registry login
    
    # Build images
    log_info "Building server image..."
    docker build -t registry.digitalocean.com/$REGISTRY_NAME/backstage-server:latest -f backend/Dockerfile.server backend/
    
    log_info "Building auth image..."
    docker build -t registry.digitalocean.com/$REGISTRY_NAME/backstage-auth:latest -f backend/Dockerfile.auth backend/
    
    # Push images
    log_info "Pushing server image..."
    docker push registry.digitalocean.com/$REGISTRY_NAME/backstage-server:latest
    
    log_info "Pushing auth image..."
    docker push registry.digitalocean.com/$REGISTRY_NAME/backstage-auth:latest
    
    log_success "Images built and pushed successfully"
}

# Update deployment
update_deployment() {
    log_info "Updating deployment with latest images..."
    
    # Build and push new images
    build_and_push
    
    # Rolling update
    log_info "Performing rolling update..."
    kubectl rollout restart deployment/backstage-server deployment/backstage-auth -n $NAMESPACE
    
    # Wait for rollout
    kubectl rollout status deployment/backstage-server -n $NAMESPACE
    kubectl rollout status deployment/backstage-auth -n $NAMESPACE
    
    log_success "Deployment updated successfully"
}

# Main menu
case "$1" in
    "status")
        check_prerequisites
        get_cluster_status
        ;;
    "deploy")
        check_prerequisites
        get_cluster_status
        if [ "$CLUSTER_STATUS" = "running" ]; then
            deploy_application
            show_access_info
            test_deployment
        else
            log_error "Cluster not running. Please create cluster first."
        fi
        ;;
    "update")
        check_prerequisites
        update_deployment
        test_deployment
        ;;
    "test")
        check_prerequisites
        test_deployment
        ;;
    "info")
        check_prerequisites
        show_access_info
        ;;
    "build")
        check_prerequisites
        build_and_push
        ;;
    *)
        echo "Usage: $0 {status|deploy|update|test|info|build}"
        echo ""
        echo "Commands:"
        echo "  status  - Check current deployment status"
        echo "  deploy  - Deploy application to existing London cluster"
        echo "  update  - Build and deploy latest changes"
        echo "  test    - Test deployment health"
        echo "  info    - Show access information"
        echo "  build   - Build and push Docker images only"
        echo ""
        echo "Current deployment: London region (lon1)"
        echo "Cluster: $CLUSTER_NAME"
        echo "Database: $DB_NAME"
        echo ""
        get_cluster_status 2>/dev/null || true
        ;;
esac