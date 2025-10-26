#!/bin/bash

echo "🚀 DigitalOcean DOKS Deployment"
echo "==============================="

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install it first."
    exit 1
fi

if ! command -v doctl &> /dev/null; then
    echo "❌ doctl not found. Please install it first."
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to Kubernetes cluster."
    echo "   Run: doctl kubernetes cluster kubeconfig save your-cluster-name"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Get current context
CONTEXT=$(kubectl config current-context)
echo "📋 Current cluster: $CONTEXT"
echo ""

read -p "🤔 Deploy to this cluster? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "1️⃣ Creating namespace..."
kubectl apply -f 01-namespace.yaml

echo ""
echo "2️⃣ Creating ConfigMap..."
kubectl apply -f 03-configmap.yaml

echo ""
echo "⚠️  SECRETS SETUP REQUIRED"
echo "================================"
echo "Before continuing, you need to update 02-secrets.yaml with:"
echo "  • Your database URL (from DigitalOcean managed database)"
echo "  • JWT secrets (generate with: openssl rand -base64 64)"
echo ""
echo "Example commands to create secrets:"
echo "  kubectl create secret generic backstage-secrets \\"
echo "    --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/db' \\"
echo "    --from-literal=ACCESS_TOKEN_SECRET='\$(openssl rand -base64 64)' \\"
echo "    --from-literal=REFRESH_TOKEN_SECRET='\$(openssl rand -base64 64)' \\"
echo "    --namespace=backstage"
echo ""

read -p "🔐 Have you created the secrets? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please create secrets first, then re-run this script"
    exit 1
fi

echo ""
echo "3️⃣ Applying secrets..."
kubectl apply -f 02-secrets.yaml

echo ""
echo "4️⃣ Deploying server..."
kubectl apply -f 04-server-deployment.yaml

echo ""
echo "5️⃣ Deploying auth service..."
kubectl apply -f 05-auth-deployment.yaml

echo ""
echo "6️⃣ Setting up ingress and load balancers..."
kubectl apply -f 06-ingress.yaml

echo ""
echo "7️⃣ Setting up auto-scaling..."
kubectl apply -f 07-hpa.yaml

echo ""
echo "8️⃣ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backstage-server -n backstage
kubectl wait --for=condition=available --timeout=300s deployment/backstage-auth -n backstage

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl get pods -n backstage
echo ""
kubectl get services -n backstage
echo ""
kubectl get ingress -n backstage

echo ""
echo "🌐 Access information:"
echo "=============================="

# Get LoadBalancer IPs
SERVER_LB=$(kubectl get service backstage-server-lb -n backstage -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
AUTH_LB=$(kubectl get service backstage-auth-lb -n backstage -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ ! -z "$SERVER_LB" ]; then
    echo "🔗 Server LoadBalancer: http://$SERVER_LB/"
    echo "🔗 Health Check: http://$SERVER_LB/health"
fi

if [ ! -z "$AUTH_LB" ]; then
    echo "🔗 Auth LoadBalancer: http://$AUTH_LB/"
    echo "🔗 Health Check: http://$AUTH_LB/health"
fi

# Get Ingress info
INGRESS_IP=$(kubectl get ingress backstage-ingress -n backstage -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ ! -z "$INGRESS_IP" ]; then
    echo "🔗 Ingress IP: $INGRESS_IP"
    echo "   Update your DNS to point your domain to this IP"
fi

echo ""
echo "📝 Next steps:"
echo "  1. Initialize database: curl http://[server-ip]/setup"
echo "  2. Test health: curl http://[server-ip]/health"
echo "  3. Configure DNS for your domain (if using ingress)"
echo "  4. Monitor with: kubectl get pods -n backstage -w"

echo ""
echo "🔧 Useful commands:"
echo "  # Check logs"
echo "  kubectl logs -f deployment/backstage-server -n backstage"
echo "  kubectl logs -f deployment/backstage-auth -n backstage"
echo ""
echo "  # Check auto-scaling"
echo "  kubectl get hpa -n backstage"
echo ""
echo "  # Port forward for testing"
echo "  kubectl port-forward service/backstage-server-service 8080:80 -n backstage"