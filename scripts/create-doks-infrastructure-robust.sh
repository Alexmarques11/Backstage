#!/bin/bash

echo "🌊 DigitalOcean Kubernetes Cluster Setup (Robust Version)"
echo "========================================================"

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

# Get account info
ACCOUNT_INFO=$(doctl account get --format Email,Status,Team --no-header)
echo "📧 Account: $ACCOUNT_INFO"

# Check droplet limit
DROPLET_LIMIT=$(doctl account get --format "Droplet Limit" --no-header)
echo "💾 Droplet Limit: $DROPLET_LIMIT"

# Configuration
CLUSTER_NAME="backstage-cluster"
REGION="nyc1"
NODE_SIZE="s-2vcpu-4gb"
NODE_COUNT="2"
K8S_VERSION="1.31.9-do.5"
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

# Check if cluster already exists
if doctl kubernetes cluster list --format Name --no-header | grep -q "^$CLUSTER_NAME$"; then
    echo "⚠️  Cluster '$CLUSTER_NAME' already exists!"
    read -p "🤔 Delete existing cluster and recreate? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️ Deleting existing cluster..."
        doctl kubernetes cluster delete $CLUSTER_NAME --force
        sleep 10
    else
        echo "❌ Please choose a different cluster name or delete the existing one"
        exit 1
    fi
fi

read -p "🤔 Continue with this configuration? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "1️⃣ Creating Kubernetes cluster..."
echo "   This may take 5-10 minutes..."

# Try creating cluster with detailed error handling
if ! doctl kubernetes cluster create $CLUSTER_NAME \
  --region $REGION \
  --version $K8S_VERSION \
  --node-pool "name=backstage-pool;size=$NODE_SIZE;count=$NODE_COUNT;auto-scale=true;min-nodes=1;max-nodes=5" \
  --wait; then
    
    echo ""
    echo "❌ Failed to create cluster. Common issues:"
    echo ""
    echo "1. **Account Limits**"
    echo "   • Droplet limit: $DROPLET_LIMIT"
    echo "   • You need $NODE_COUNT droplets for the cluster"
    echo "   • Contact support to increase limits if needed"
    echo ""
    echo "2. **Region Availability**"
    echo "   • $NODE_SIZE might not be available in $REGION"
    echo "   • Try a different region or node size"
    echo ""
    echo "3. **Billing Issues**"
    echo "   • Make sure billing information is set up"
    echo "   • Check if there are any payment issues"
    echo ""
    echo "🔧 Try these alternatives:"
    echo "   1. Smaller nodes: s-1vcpu-2gb instead of s-2vcpu-4gb"
    echo "   2. Different region: sfo3, fra1, or lon1"
    echo "   3. Single node: count=1 instead of 2"
    echo ""
    
    # Offer to try with smaller configuration
    read -p "🤔 Try with smaller configuration (s-1vcpu-2gb, 1 node)? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Trying with smaller configuration..."
        
        if doctl kubernetes cluster create "${CLUSTER_NAME}-small" \
          --region $REGION \
          --version $K8S_VERSION \
          --node-pool "name=backstage-pool;size=s-1vcpu-2gb;count=1;auto-scale=true;min-nodes=1;max-nodes=3" \
          --wait; then
            
            CLUSTER_NAME="${CLUSTER_NAME}-small"
            echo "✅ Cluster created successfully with smaller configuration"
        else
            echo "❌ Failed even with smaller configuration. Please check:"
            echo "   • DigitalOcean dashboard for any error messages"
            echo "   • Account billing status"
            echo "   • Contact DigitalOcean support if needed"
            exit 1
        fi
    else
        exit 1
    fi
else
    echo "✅ Cluster created successfully"
fi

echo ""
echo "2️⃣ Configuring kubectl..."
if doctl kubernetes cluster kubeconfig save $CLUSTER_NAME; then
    echo "✅ kubectl configured successfully"
else
    echo "❌ Failed to configure kubectl"
    exit 1
fi

echo ""
echo "3️⃣ Creating managed PostgreSQL database..."
if doctl databases create $DB_NAME \
  --engine postgres \
  --region $REGION \
  --size $DB_SIZE \
  --version 15; then
    echo "✅ Database creation started"
else
    echo "❌ Failed to create database"
    echo "   • Database with name '$DB_NAME' might already exist"
    echo "   • Check your account limits"
    exit 1
fi

echo ""
echo "4️⃣ Waiting for database to be ready..."
TIMEOUT=300
ELAPSED=0
while true; do
    STATUS=$(doctl databases get $DB_NAME --format Status --no-header 2>/dev/null)
    if [ "$STATUS" = "online" ]; then
        break
    elif [ $ELAPSED -ge $TIMEOUT ]; then
        echo "⏰ Database creation timed out. Check manually:"
        echo "   doctl databases get $DB_NAME"
        break
    fi
    echo "   Database status: $STATUS (waiting... ${ELAPSED}s)"
    sleep 30
    ELAPSED=$((ELAPSED + 30))
done

if [ "$STATUS" = "online" ]; then
    echo "✅ Database is online"
    
    echo ""
    echo "5️⃣ Getting database connection details..."
    DB_URI=$(doctl databases connection $DB_NAME --format URI --no-header)
    echo "   Database URI: $DB_URI"
else
    echo "⚠️  Database might still be starting. Check status manually:"
    echo "   doctl databases get $DB_NAME"
fi

echo ""
echo "6️⃣ Creating container registry..."
if doctl registry create backstage-registry 2>/dev/null; then
    echo "✅ Container registry created"
else
    echo "✅ Container registry already exists or created"
fi

echo ""
echo "7️⃣ Installing NGINX Ingress Controller..."
if kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/do/deploy.yaml; then
    echo "✅ NGINX Ingress Controller installed"
else
    echo "⚠️  NGINX Ingress Controller installation might have issues"
fi

echo ""
echo "8️⃣ Installing cert-manager for SSL..."
if kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml; then
    echo "✅ cert-manager installed"
else
    echo "⚠️  cert-manager installation might have issues"
fi

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update k8s/digitalocean/02-secrets.yaml with database URI"
echo "   2. Run: ./scripts/build-and-push-images.sh"
echo "   3. Run: cd k8s/digitalocean && ./deploy.sh"
echo ""
echo "🔗 Resources created:"
echo "   • Kubernetes cluster: $CLUSTER_NAME"
echo "   • Database: $DB_NAME"
echo "   • Container registry: backstage-registry"
if [ ! -z "$DB_URI" ]; then
    echo "   • Database URI: $DB_URI"
fi

echo ""
echo "🔧 Useful commands:"
echo "   • Check cluster: kubectl get nodes"
echo "   • Check database: doctl databases get $DB_NAME"
echo "   • Check registry: doctl registry list"