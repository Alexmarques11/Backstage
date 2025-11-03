#!/bin/bash

# Production deployment script for Backstage Backend
# Usage: ./deploy-prod.sh [docker_username]
# 
# Available Docker Hub users:
# - alexmarques11 (default)
# - goncalo's account: ./deploy-prod.sh goncalocruz
# - ze's account: ./deploy-prod.sh zeaccount

set -e

# Docker username selection (default: alexmarques11)
DOCKER_USERNAME=${1:-"alexmarques11"}
ENV_FILE=".env.prod"

# Validate Docker username
case "$DOCKER_USERNAME" in
    "alexmarques11"|"goncalocruz"|"zeaccount")
        echo " Using Docker Hub account: $DOCKER_USERNAME"
        ;;
    *)
        echo "  Using custom Docker Hub account: $DOCKER_USERNAME"
        echo "    Make sure the images exist in this account"
        ;;
esac

echo " Backstage Backend Production Deployment"
echo "==========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo " Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo " Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Pull latest images from Docker Hub
echo " Pulling latest images from Docker Hub..."
docker pull ${DOCKER_USERNAME}/backstage-server:latest
docker pull ${DOCKER_USERNAME}/backstage-auth:latest
docker pull postgres:15-alpine

# Create production environment file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo " Creating production environment template..."
    cat > $ENV_FILE << EOL
# Production Environment Variables
NODE_ENV=production

# Database Configuration - REPLACE WITH SECURE VALUES!
DATABASE_HOST=database
DATABASE_USER=generate_secure_username
DATABASE_PASSWORD=GENERATE_SECURE_PASSWORD_WITH_openssl_rand_hex_32
DATABASE_NAME=backstage_prod
DATABASE_PORT=5432

# JWT Secrets - GENERATE STRONG SECRETS!
# Use: openssl rand -hex 64
ACCESS_TOKEN_SECRET=GENERATE_STRONG_JWT_SECRET_openssl_rand_hex_64
REFRESH_TOKEN_SECRET=GENERATE_STRONG_REFRESH_SECRET_openssl_rand_hex_64

# Docker Configuration
DOCKER_USERNAME=${DOCKER_USERNAME}

# Security Notice:
# ALL VALUES ABOVE MUST BE CHANGED BEFORE PRODUCTION DEPLOYMENT!
# Generate secure passwords: openssl rand -hex 32
# Generate JWT secrets: openssl rand -hex 64
EOL
    echo " SECURITY WARNING: Template environment file created!"
    echo " Edit $ENV_FILE and replace ALL placeholder values with secure credentials!"
    echo " Generate passwords: openssl rand -hex 32"
    echo "Generate JWT secrets: openssl rand -hex 64"
    echo " NEVER commit this file to version control!"
    exit 1
fi

# Check if environment file still has template values
if grep -q "GENERATE_\|generate_secure" "$ENV_FILE"; then
    echo " CRITICAL SECURITY ERROR: Template values detected in $ENV_FILE"
    echo " Please replace ALL placeholder values with actual secure credentials!"
    echo "Generate passwords: openssl rand -hex 32"
    echo "Generate JWT secrets: openssl rand -hex 64"
    echo " Deployment aborted for security reasons."
    exit 1
fi

# Deploy with Docker Compose
echo " Deploying services..."
export DOCKER_USERNAME=${DOCKER_USERNAME}
docker-compose -f docker-compose.prod.yaml --env-file $ENV_FILE up -d

# Wait for services to be healthy
echo " Waiting for services to start..."
sleep 10

# Check service status
echo " Service Status:"
docker-compose -f docker-compose.prod.yaml ps

# Setup database if needed
echo "  Setting up database..."
sleep 5
curl -f http://localhost:13000/setup || echo "Database setup may have failed or already exists"

echo ""
echo " Deployment completed!"
echo " Services available at:"
echo "   - Main API Server: http://localhost:13000"
echo "   - Auth Server: http://localhost:14000" 
echo "   - Database: localhost:5432"
echo ""
echo " Management commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yaml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.prod.yaml down"
echo "   - Update images: docker-compose -f docker-compose.prod.yaml pull && docker-compose -f docker-compose.prod.yaml up -d"
echo ""
echo "  Remember to:"
echo "   - Configure proper JWT secrets in $ENV_FILE"
echo "   - Set up proper database credentials"
echo "   - Configure reverse proxy/SSL for production use"