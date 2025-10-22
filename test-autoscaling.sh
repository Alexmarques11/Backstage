#!/bin/bash

echo "🧪 BACKSTAGE AUTO-SCALING TEST"
echo "=============================="
echo ""

echo "📊 Current Status:"
echo "=================="
kubectl get hpa -n backstage
echo ""
kubectl get pods -n backstage | grep -E "(backstage-server|backstage-auth)"
echo ""

echo "🔥 Generating CPU load to trigger scaling..."
echo ""
echo "Starting load test - this will make multiple concurrent requests to trigger auto-scaling"
echo "Watch for additional pods to appear..."
echo ""

# Function to generate load
generate_load() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    
    echo "🚀 Starting load generation for $service_name..."
    
    for i in {1..100}; do
        for j in {1..10}; do
            curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1 &
        done
        sleep 0.1
    done
    
    # Wait for background jobs to complete
    wait
    echo "✅ Load generation completed for $service_name"
}

# Generate load for both services
generate_load "server" "8080" "/health" &
generate_load "auth" "8081" "/health" &

echo ""
echo "⏳ Monitoring scaling behavior (this may take 1-2 minutes)..."
echo ""

# Monitor for 3 minutes
for i in {1..18}; do
    echo "📊 Check $i/18 (every 10 seconds):"
    kubectl get hpa -n backstage
    echo ""
    kubectl get pods -n backstage | grep -E "(backstage-server|backstage-auth)" | grep Running
    echo ""
    sleep 10
done

echo "🎯 Final Status:"
echo "================"
kubectl get hpa -n backstage
echo ""
kubectl get pods -n backstage | grep -E "(backstage-server|backstage-auth)"
echo ""

echo "📋 Auto-scaling Summary:"
echo "======================="
echo "✅ Minimum replicas: 2 for each service"
echo "📈 Maximum replicas: 5 for server, 3 for auth"
echo "🎯 CPU threshold: 70% utilization"
echo "⚡ Scaling triggers: High CPU usage from requests"
echo ""
echo "To manually scale back down:"
echo "kubectl scale deployment backstage-server --replicas=2 -n backstage"
echo "kubectl scale deployment backstage-auth --replicas=2 -n backstage"