#!/bin/bash

echo "🔄 NETWORK RESTART - Updated Connection Guide"
echo "============================================="
echo ""

# Get current network information
NEW_HOST_IP=$(hostname -I | awk '{print $1}')
MINIKUBE_IP=$(minikube ip)

echo "📍 UPDATED Network Information:"
echo "   NEW Host IP: $NEW_HOST_IP (was 172.16.6.89)"
echo "   Minikube IP: $MINIKUBE_IP (unchanged)"
echo ""

echo "🎯 UPDATED CONNECTION URLS FOR EXTERNAL MACHINE:"
echo "================================================"
echo ""

echo "🥇 METHOD 1 - Direct Minikube Access (UNCHANGED - STILL BEST):"
echo "curl -v http://$MINIKUBE_IP:30300/health    # Main server health"
echo "curl -v http://$MINIKUBE_IP:30400/health    # Auth server health"
echo ""

echo "🥈 METHOD 2 - Port Forward Access (UPDATED IP):"
echo "curl -v http://$NEW_HOST_IP:8080/health     # Main server health"
echo "curl -v http://$NEW_HOST_IP:8081/health     # Auth server health"
echo ""

echo "🥉 METHOD 3 - Socat Relay Access (UPDATED IP):"
echo "curl -v http://$NEW_HOST_IP:9300/health     # Main server health"
echo "curl -v http://$NEW_HOST_IP:9301/health     # Auth server health"
echo ""

echo "🔧 METHOD 4 - Python Proxy Access (UPDATED IP):"
echo "curl -v http://$NEW_HOST_IP:9090/health     # Health check"
echo ""

echo "🌐 UPDATED BROWSER URLS:"
echo "========================"
echo ""
echo "Direct Minikube (UNCHANGED):"
echo "  http://$MINIKUBE_IP:30300/     # Main Backstage app"
echo "  http://$MINIKUBE_IP:30400/     # Auth server"
echo ""
echo "Port Forward (NEW IP):"
echo "  http://$NEW_HOST_IP:8080/      # Main Backstage app"
echo "  http://$NEW_HOST_IP:8081/      # Auth server"
echo ""
echo "Socat Relay (NEW IP):"
echo "  http://$NEW_HOST_IP:9300/      # Main Backstage app"
echo "  http://$NEW_HOST_IP:9301/      # Auth server"
echo ""
echo "Python Proxy (NEW IP):"
echo "  http://$NEW_HOST_IP:9090/      # Unified access"
echo ""

echo "📋 WHAT TO TELL THE EXTERNAL MACHINE:"
echo "====================================="
echo ""
echo "The host IP changed from 172.16.6.89 to $NEW_HOST_IP"
echo ""
echo "Try these URLs from your external machine (172.16.9.12):"
echo ""
echo "1. FIRST TRY (most likely to work):"
echo "   curl -v http://$MINIKUBE_IP:30300/health"
echo "   curl -v http://$MINIKUBE_IP:30400/health"
echo ""
echo "2. IF THAT FAILS, try with new host IP:"
echo "   curl -v http://$NEW_HOST_IP:8080/health"
echo "   curl -v http://$NEW_HOST_IP:8081/health"
echo "   curl -v http://$NEW_HOST_IP:9300/health"
echo "   curl -v http://$NEW_HOST_IP:9301/health"
echo "   curl -v http://$NEW_HOST_IP:9090/health"
echo ""

echo "🔍 Current Service Status:"
echo "=========================="
echo ""

# Test all services with current IPs
echo "✅ Direct Minikube (unchanged):"
curl -s http://$MINIKUBE_IP:30300/health | head -1
echo ""

echo "✅ Port Forward (should work with new IP):"
curl -s http://localhost:8080/health | head -1
echo ""

echo "✅ Socat Relay (should work with new IP):"
curl -s http://localhost:9300/health | head -1
echo ""

echo "✅ Python Proxy (should work with new IP):"
curl -s http://localhost:9090/health 2>/dev/null | head -1
echo ""

echo "🎉 All services are still running after network change!"
echo "The Direct Minikube URLs ($MINIKUBE_IP) should still work."
echo "Use the new host IP ($NEW_HOST_IP) for other methods."