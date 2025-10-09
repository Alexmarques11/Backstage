#!/bin/bash

set -e

echo "🚀 Deploying BackstageKotlin to Minikube (WITH PostgreSQL for testing)"

# Check if minikube is running
if ! minikube status &> /dev/null; then
    echo "❌ Minikube is not running. Please start it with: minikube start"
    exit 1
fi

# Build Docker image in Minikube's Docker environment
echo "📦 Building Docker image..."
eval $(minikube docker-env)
cd backend && docker build -t backstage-backend:latest . && cd ..

# Apply Kubernetes manifests (including PostgreSQL)
echo "🔧 Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml

# Deploy PostgreSQL for testing
kubectl apply -f k8s/optional/postgres-configmap.yaml
kubectl apply -f k8s/optional/postgres-secret.yaml
kubectl apply -f k8s/optional/postgres-pvc.yaml
kubectl apply -f k8s/optional/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n backstage --timeout=300s

# Update backend config to use internal PostgreSQL
kubectl create configmap backend-config --from-literal=NODE_ENV=production \
  --from-literal=DATABASE_HOST=postgres-service \
  --from-literal=DATABASE_USER=user123 \
  --from-literal=DATABASE_NAME=backstage \
  --from-literal=DATABASE_PORT=5432 \
  -n backstage --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic backend-secret --from-literal=DATABASE_PASSWORD=123456 \
  -n backstage --dry-run=client -o yaml | kubectl apply -f -

# Deploy backend
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
echo "🔧 Initialize database:"
echo "curl http://backstage.local/setup"