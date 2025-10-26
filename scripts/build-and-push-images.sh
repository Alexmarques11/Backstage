#!/bin/bash

echo "🐳 Building and Pushing Docker Images to DigitalOcean Registry"
echo "=============================================================="

# Check if doctl is installed and authenticated
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl not found. Please install it first."
    exit 1
fi

if ! doctl account get &> /dev/null; then
    echo "❌ Please authenticate with DigitalOcean first: doctl auth init"
    exit 1
fi

# Configuration
REGISTRY_NAME="backstage-registry"
SERVER_IMAGE="registry.digitalocean.com/$REGISTRY_NAME/backstage-server"
AUTH_IMAGE="registry.digitalocean.com/$REGISTRY_NAME/backstage-auth"
TAG="latest"

echo "📋 Configuration:"
echo "   Registry: $REGISTRY_NAME"
echo "   Server Image: $SERVER_IMAGE:$TAG"
echo "   Auth Image: $AUTH_IMAGE:$TAG"
echo ""

# Login to registry
echo "1️⃣ Logging into DigitalOcean Container Registry..."
doctl registry login

if [ $? -ne 0 ]; then
    echo "❌ Failed to login to registry"
    exit 1
fi

echo "✅ Registry login successful"

# Build server image
echo ""
echo "2️⃣ Building server image..."
docker build -t $SERVER_IMAGE:$TAG -f backend/Dockerfile.server backend/

if [ $? -eq 0 ]; then
    echo "✅ Server image built successfully"
else
    echo "❌ Failed to build server image"
    exit 1
fi

# Build auth image
echo ""
echo "3️⃣ Building auth image..."
docker build -t $AUTH_IMAGE:$TAG -f backend/Dockerfile.auth backend/

if [ $? -eq 0 ]; then
    echo "✅ Auth image built successfully"
else
    echo "❌ Failed to build auth image"
    exit 1
fi

# Push server image
echo ""
echo "4️⃣ Pushing server image..."
docker push $SERVER_IMAGE:$TAG

if [ $? -eq 0 ]; then
    echo "✅ Server image pushed successfully"
else
    echo "❌ Failed to push server image"
    exit 1
fi

# Push auth image
echo ""
echo "5️⃣ Pushing auth image..."
docker push $AUTH_IMAGE:$TAG

if [ $? -eq 0 ]; then
    echo "✅ Auth image pushed successfully"
else
    echo "❌ Failed to push auth image"
    exit 1
fi

echo ""
echo "✅ All images built and pushed successfully!"
echo ""
echo "📝 Images available:"
echo "   • $SERVER_IMAGE:$TAG"
echo "   • $AUTH_IMAGE:$TAG"
echo ""
echo "🔧 Next steps:"
echo "   1. Update k8s/digitalocean/ deployment files to use these images"
echo "   2. Run: kubectl apply -f k8s/digitalocean/"