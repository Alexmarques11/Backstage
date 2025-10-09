#!/bin/bash

echo "🧹 Cleaning up BackstageKotlin from Minikube"

# Delete the namespace (this will delete everything in it)
kubectl delete namespace backstage

# Remove from hosts file (optional)
read -p "Remove 'backstage.local' from /etc/hosts? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo sed -i '/backstage.local/d' /etc/hosts
    echo "✅ Removed from /etc/hosts"
fi

echo "✅ Cleanup complete!"