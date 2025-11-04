#!/bin/bash

# Auto-scaling Test Script for Backstage
# This script generates load to test HPA functionality

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

echo ""
echo "========================================"
echo "  Backstage Auto-scaling Test"
echo "========================================"
echo ""

# Check if HPA exists
log_info "Checking HPA configuration..."
if ! kubectl get hpa -n backstage &> /dev/null; then
    log_error "No HPA found in backstage namespace"
    log_info "Run: kubectl apply -f k8s/07-server-hpa.yaml -f k8s/08-auth-hpa.yaml"
    exit 1
fi

log_success "HPA configured"
echo ""

# Show current HPA status
log_info "Current HPA Status:"
kubectl get hpa -n backstage
echo ""

# Show current pod count
log_info "Current Pod Count:"
kubectl get pods -n backstage | grep -E "backstage-server|backstage-auth"
echo ""

# Show current resource usage
log_info "Current Resource Usage:"
kubectl top pods -n backstage 2>/dev/null || log_warning "Metrics not available yet"
echo ""

# Ask user if they want to generate load
read -p "Do you want to generate load to test auto-scaling? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Exiting without generating load"
    exit 0
fi

log_info "Starting load generation..."
log_warning "This will create a load-generator pod. Press Ctrl+C to stop."
echo ""

# Create load generator pod
log_info "Creating load generator pod..."
kubectl run load-generator --rm -it --image=busybox -n backstage -- /bin/sh -c \
  "while true; do wget -q -O- http://backstage-server-service:3000/health; done" &

LOAD_PID=$!

# Monitor auto-scaling
log_info "Monitoring auto-scaling (watch for replica changes)..."
echo ""
log_info "Press Ctrl+C to stop load generation and monitoring"
echo ""

# Watch HPA and pods
while true; do
    clear
    echo "========================================"
    echo "  Auto-scaling Monitor (Ctrl+C to stop)"
    echo "========================================"
    echo ""
    
    echo "HPA Status:"
    kubectl get hpa -n backstage
    echo ""
    
    echo "Pod Status:"
    kubectl get pods -n backstage | grep -E "NAME|backstage-server|backstage-auth"
    echo ""
    
    echo "Resource Usage:"
    kubectl top pods -n backstage 2>/dev/null | grep -E "NAME|backstage-server|backstage-auth" || echo "Metrics not ready yet..."
    echo ""
    
    echo "Recent HPA Events:"
    kubectl get events -n backstage --sort-by='.lastTimestamp' | grep -i "horizontalpodautoscaler" | tail -5
    echo ""
    
    sleep 5
done

# Cleanup on exit
trap "log_info 'Stopping load generator...'; kill $LOAD_PID 2>/dev/null || true; kubectl delete pod load-generator -n backstage 2>/dev/null || true" EXIT
