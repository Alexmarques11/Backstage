#!/bin/bash

# Quick restart script for existing Minikube deployment
# Use this when your PC restarts and you just want to start the services

set -e

echo "========================================"
echo "  Quick Restart Backstage on Minikube"
echo "========================================"
echo ""

# Start Minikube if not running
echo "[INFO] Starting Minikube..."
if minikube status | grep -q "host: Running"; then
    echo "[INFO] Minikube already running"
else
    minikube start --driver=docker --memory=3072 --cpus=2
    echo "[SUCCESS] Minikube started"
fi

# Set default namespace
echo "[INFO] Setting default namespace to backstage..."
kubectl config set-context --current --namespace=backstage

# Wait for pods to be ready
echo "[INFO] Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl wait --for=condition=ready pod -l app=backstage-server --timeout=120s
kubectl wait --for=condition=ready pod -l app=backstage-auth --timeout=120s

echo "[SUCCESS] All pods are ready!"

# Show pod status
echo ""
echo "[INFO] Current pod status:"
kubectl get pods

# Setup port forwarding
echo ""
echo "[INFO] Setting up port forwarding..."

# Kill any existing port forwards
pkill -f "kubectl port-forward.*backstage" || true
sleep 2

# Start port forwards in background
kubectl port-forward service/backstage-server-service 8080:3000 > /dev/null 2>&1 &
SERVER_PF_PID=$!
echo "[SUCCESS] Server port-forward started (PID: $SERVER_PF_PID)"

kubectl port-forward service/backstage-auth-service 8081:4000 > /dev/null 2>&1 &
AUTH_PF_PID=$!
echo "[SUCCESS] Auth port-forward started (PID: $AUTH_PF_PID)"

sleep 2

echo ""
echo "========================================"
echo "  Backstage is Ready!"
echo "========================================"
echo ""
echo "Services:"
echo "   - Server API:  http://localhost:8080"
echo "   - Auth API:    http://localhost:8081"
echo ""
echo "Useful commands:"
echo "   - Check pods:       kubectl get pods"
echo "   - Check HPA:        kubectl get hpa"
echo "   - View logs:        kubectl logs -f <pod-name>"
echo "   - Resource usage:   kubectl top pods"
echo "   - Test scaling:     ../test-autoscaling.sh"
echo ""
echo "To stop port forwarding:"
echo "   kill $SERVER_PF_PID $AUTH_PF_PID"
echo ""
echo "To stop Minikube:"
echo "   minikube stop"
echo ""
