#!/bin/bash

echo "🌊 DigitalOcean Kubernetes Cluster Setup"
echo "========================================"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl not found. Installing..."
    curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
    sudo mv doctl /usr/local/bin
    echo "✅ doctl installed"
fi

# Check authentication
if ! doctl account get &> /dev/null; then
    echo "❌ Please authenticate with DigitalOcean first:"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ DigitalOcean authentication verified"

# Configuration
CLUSTER_NAME="backstage-cluster"
REGION="nyc1"
NODE_SIZE="s-2vcpu-4gb"
NODE_COUNT="2"
K8S_VERSION="1.31.9-do.5"  # Updated to latest stable version
DB_NAME="backstage-db"
DB_SIZE="db-s-1vcpu-1gb"

echo ""
echo "📋 Configuration:"
echo "   Cluster: $CLUSTER_NAME"
echo "   Region: $REGION" 
echo "   Kubernetes: $K8S_VERSION"
echo "   Node Size: $NODE_SIZE"
echo "   Node Count: $NODE_COUNT"
echo "   Database: $DB_NAME ($DB_SIZE)"
echo ""

read -p "🤔 Continue with this configuration? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "1️⃣ Creating Kubernetes cluster..."
doctl kubernetes cluster create $CLUSTER_NAME \
  --region $REGION \
  --version $K8S_VERSION \
  --node-pool "name=backstage-pool;size=$NODE_SIZE;count=$NODE_COUNT;auto-scale=true;min-nodes=1;max-nodes=5"

if [ $? -eq 0 ]; then
    echo "✅ Cluster created successfully"
else
    echo "❌ Failed to create cluster"
    exit 1
fi

echo ""
echo "2️⃣ Configuring kubectl..."
doctl kubernetes cluster kubeconfig save $CLUSTER_NAME

echo ""
echo "3️⃣ Creating managed PostgreSQL database..."
doctl databases create $DB_NAME \
  --engine postgres \
  --region $REGION \
  --size $DB_SIZE \
  --version 15

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

echo ""
echo "4️⃣ Waiting for database to be ready..."
while true; do
    STATUS=$(doctl databases get $DB_NAME --format Status --no-header)
    if [ "$STATUS" = "online" ]; then
        break
    fi
    echo "   Database status: $STATUS (waiting...)"
    sleep 30
done

echo "✅ Database is online"

echo ""
echo "5️⃣ Getting database connection details..."
DB_URI=$(doctl databases connection $DB_NAME --format URI --no-header)
echo "   Database URI: $DB_URI"

echo ""
echo "6️⃣ Creating container registry..."
doctl registry create backstage-registry 2>/dev/null || echo "   Registry already exists"

echo ""
echo "7️⃣ Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/do/deploy.yaml

echo ""
echo "8️⃣ Installing cert-manager for SSL..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update k8s/digitalocean/secrets.yaml with database URI"
echo "   2. Run: ./build-and-push-images.sh"
echo "   3. Run: kubectl apply -f k8s/digitalocean/"
echo ""
echo "🔗 Resources created:"
echo "   • Kubernetes cluster: $CLUSTER_NAME"
echo "   • Database: $DB_NAME"
echo "   • Container registry: backstage-registry"
echo "   • Database URI: $DB_URI"