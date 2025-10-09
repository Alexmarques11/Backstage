#!/bin/bash

set -e

echo "🚀 Deploying BackstageKotlin to Minikube (External Database)"

# Check if minikube is running
if ! minikube status &> /dev/null; then
    echo "❌ Minikube is not running. Please start it with: minikube start"
    exit 1
fi

echo "⚠️  IMPORTANT: Configure your external database connection"
echo "   Edit k8s/backend-configmap.yaml with your database details"
echo "   Edit k8s/backend-secret.yaml with your database password"
echo ""

# Build Docker image in Minikube's Docker environment
echo "📦 Building Docker image..."
eval $(minikube docker-env)
cd backend && docker build -t backstage-backend:latest . && cd ..

# Apply Kubernetes manifests (no PostgreSQL)
echo "🔧 Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-deployment.yaml

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n backstage --timeout=300s

# Apply ingress
kubectl apply -f k8s/ingress.yaml

# Get Minikube IP and setup hosts
MINIKUBE_IP=$(minikube ip)
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Add this to your /etc/hosts file:"
echo "$MINIKUBE_IP backstage.local"
echo ""
echo "Or run this command:"
echo "echo '$MINIKUBE_IP backstage.local' | sudo tee -a /etc/hosts"
echo ""
echo "🔗 Access your app at: http://backstage.local"
echo "📊 Check status: kubectl get pods -n backstage"
echo ""
echo "🔧 Initialize database (make sure your external DB is accessible):"
echo "curl http://backstage.local/setup"
echo ""
echo "💡 If you want to deploy PostgreSQL in Kubernetes for testing:"
echo "   kubectl apply -f k8s/optional/