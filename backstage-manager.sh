#!/bin/bash

echo "🎛️ BACKSTAGE MINIKUBE MANAGER"
echo "============================="
echo ""

# Function to show current status
show_status() {
    echo "📊 Current Status:"
    echo "=================="
    echo "🖥️ Minikube:"
    minikube status 2>/dev/null || echo "   ❌ Minikube not running"
    echo ""
    
    if minikube status &>/dev/null; then
        echo "🐳 Backstage Pods:"
        kubectl get pods -n backstage 2>/dev/null | grep -E "(NAME|backstage|postgres)" || echo "   ❌ No Backstage pods found"
        echo ""
        
        echo "📈 Auto-scaling:"
        kubectl get hpa -n backstage 2>/dev/null || echo "   ❌ No HPA found"
        echo ""
        
        echo "🔗 Port Forwarding:"
        ps aux | grep -E "kubectl.*port-forward" | grep -v grep || echo "   ❌ No port forwarding active"
    fi
    echo ""
}

# Function to start everything
start_all() {
    echo "🚀 Starting Backstage deployment..."
    echo ""
    
    # Start Minikube if not running
    if ! minikube status &>/dev/null; then
        echo "1️⃣ Starting Minikube..."
        minikube start --driver=docker --memory=3072 --cpus=2
        
        echo "2️⃣ Enabling addons..."
        minikube addons enable ingress
        minikube addons enable metrics-server
        minikube addons enable dashboard
    else
        echo "1️⃣ Minikube already running ✅"
    fi
    
    # Configure Docker environment
    echo "3️⃣ Configuring Docker environment..."
    eval $(minikube docker-env)
    
    # Check if images exist, build if needed
    if ! docker images | grep -q "goncalocruz/backstage-server"; then
        echo "4️⃣ Building Docker images..."
        cd backend
        docker build -t backstage-server -f Dockerfile.server .
        docker build -t backstage-auth -f Dockerfile.auth .
        docker tag backstage-server:latest goncalocruz/backstage-server:latest
        docker tag backstage-auth:latest goncalocruz/backstage-auth:latest
        cd ..
    else
        echo "4️⃣ Docker images already exist ✅"
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace backstage &>/dev/null; then
        echo "5️⃣ Creating namespace and secrets..."
        kubectl create namespace backstage
        
        # Create secrets
        DB_PASSWORD=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 64)
        REFRESH_SECRET=$(openssl rand -base64 64)
        
        kubectl create secret generic backstage-secrets \
            --from-literal=DATABASE_USER="backstage_user" \
            --from-literal=DATABASE_PASSWORD="$DB_PASSWORD" \
            --from-literal=ACCESS_TOKEN_SECRET="$JWT_SECRET" \
            --from-literal=REFRESH_TOKEN_SECRET="$REFRESH_SECRET" \
            --namespace=backstage
            
        kubectl create secret generic postgres-secret \
            --from-literal=POSTGRES_USER="backstage_user" \
            --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
            --from-literal=POSTGRES_DB="backstage" \
            --namespace=backstage
    else
        echo "5️⃣ Namespace already exists ✅"
    fi
    
    # Deploy application
    echo "6️⃣ Deploying application..."
    cd k8s
    kubectl apply -f 01-configmap.yaml
    kubectl apply -f 03-postgres.yaml
    kubectl apply -f 04-server.yaml
    kubectl apply -f 05-auth.yaml
    kubectl apply -f 06-ingress.yaml
    cd ..
    
    # Wait for deployments
    echo "7️⃣ Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n backstage
    kubectl wait --for=condition=available --timeout=300s deployment/backstage-server -n backstage
    kubectl wait --for=condition=available --timeout=300s deployment/backstage-auth -n backstage
    
    # Set up auto-scaling
    echo "8️⃣ Setting up auto-scaling..."
    kubectl autoscale deployment backstage-server --cpu-percent=70 --min=2 --max=5 -n backstage 2>/dev/null || echo "   HPA already exists"
    kubectl autoscale deployment backstage-auth --cpu-percent=70 --min=2 --max=3 -n backstage 2>/dev/null || echo "   HPA already exists"
    
    # Set up port forwarding
    echo "9️⃣ Setting up external access..."
    setup_port_forwarding
    
    echo ""
    echo "✅ Backstage is now running!"
    show_access_info
}

# Function to stop everything
stop_all() {
    echo "🛑 Stopping Backstage deployment..."
    echo ""
    
    # Stop port forwarding
    echo "1️⃣ Stopping port forwarding..."
    pkill -f "kubectl.*port-forward.*backstage" || echo "   No port forwarding to stop"
    
    # Delete deployments but keep data
    echo "2️⃣ Stopping application pods..."
    kubectl delete deployment backstage-server backstage-auth -n backstage 2>/dev/null || echo "   Deployments already stopped"
    
    # Optionally stop Minikube completely
    read -p "🤔 Do you want to stop Minikube completely? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "3️⃣ Stopping Minikube..."
        minikube stop
    else
        echo "3️⃣ Keeping Minikube running (database preserved)"
    fi
    
    echo ""
    echo "✅ Backstage stopped!"
}

# Function to restart just the app (not Minikube)
restart_app() {
    echo "🔄 Restarting Backstage application..."
    echo ""
    
    # Stop port forwarding
    pkill -f "kubectl.*port-forward.*backstage" || echo "No port forwarding to stop"
    
    # Restart deployments
    echo "1️⃣ Restarting deployments..."
    kubectl rollout restart deployment/backstage-server -n backstage
    kubectl rollout restart deployment/backstage-auth -n backstage
    
    # Wait for readiness
    echo "2️⃣ Waiting for pods to be ready..."
    kubectl rollout status deployment/backstage-server -n backstage
    kubectl rollout status deployment/backstage-auth -n backstage
    
    # Restart port forwarding
    echo "3️⃣ Setting up external access..."
    setup_port_forwarding
    
    echo ""
    echo "✅ Backstage application restarted!"
    show_access_info
}

# Function to set up port forwarding
setup_port_forwarding() {
    # Kill existing port forwarding
    pkill -f "kubectl.*port-forward.*backstage" 2>/dev/null || true
    sleep 2
    
    # Start new port forwarding
    kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage &
    kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage &
    
    # Wait a bit for port forwarding to establish
    sleep 3
}

# Function to show access information
show_access_info() {
    HOST_IP=$(hostname -I | awk '{print $1}')
    echo ""
    echo "🌐 Access URLs:"
    echo "   Main Server:  http://$HOST_IP:8080/"
    echo "   Auth Server:  http://$HOST_IP:8081/"
    echo "   Health Check: http://$HOST_IP:8080/health"
}

# Function to clean everything
clean_all() {
    echo "🧹 COMPLETE CLEANUP - This will delete EVERYTHING!"
    echo "⚠️  This includes all data, secrets, and deployments"
    echo ""
    read -p "🤔 Are you sure? Type 'yes' to continue: " -r
    if [[ $REPLY == "yes" ]]; then
        echo ""
        echo "1️⃣ Stopping port forwarding..."
        pkill -f "kubectl.*port-forward" || true
        
        echo "2️⃣ Deleting namespace (this removes everything)..."
        kubectl delete namespace backstage --timeout=60s || true
        
        echo "3️⃣ Stopping and deleting Minikube..."
        minikube stop
        minikube delete --all
        
        echo ""
        echo "✅ Complete cleanup finished!"
        echo "   To start fresh, run: $0 start"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Main menu
case "$1" in
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_app
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_all
        ;;
    "port-forward")
        setup_port_forwarding
        show_access_info
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|clean|port-forward}"
        echo ""
        echo "Commands:"
        echo "  start         - Start complete Backstage deployment"
        echo "  stop          - Stop Backstage (optionally stop Minikube)"
        echo "  restart       - Restart just the application (keep Minikube)"
        echo "  status        - Show current status"
        echo "  clean         - Complete cleanup (deletes everything)"
        echo "  port-forward  - Re-setup external access"
        echo ""
        show_status
        ;;
esac