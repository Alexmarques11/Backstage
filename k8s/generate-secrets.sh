#!/bin/bash
# Script para gerar secrets seguros para o Kubernetes
# Este script NÃO deve ser commitado com valores reais!

set -e

echo "🔐 Generating secure secrets for Backstage deployment..."

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Verificar se openssl está disponível
if ! command -v openssl &> /dev/null; then
    echo "❌ openssl not found. Please install openssl first."
    exit 1
fi

# Prompt para credenciais do banco (ou usar defaults seguros)
echo ""
echo "📊 Database Configuration:"
read -p "Database username (default: backstage_user): " DB_USER
DB_USER=${DB_USER:-backstage_user}

read -s -p "Database password (will generate secure one if empty): " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -hex 32)
    echo "✅ Generated secure database password"
fi

read -p "Database name (default: backstage): " DB_NAME
DB_NAME=${DB_NAME:-backstage}

# Gerar JWT secrets seguros
echo ""
echo "🔑 Generating JWT secrets..."
ACCESS_TOKEN_SECRET=$(openssl rand -hex 64)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 64)
echo "✅ Generated secure JWT secrets"

# Verificar se namespace existe
if ! kubectl get namespace backstage &> /dev/null; then
    echo "📁 Creating backstage namespace..."
    kubectl create namespace backstage
fi

echo ""
echo "🚀 Creating Kubernetes secrets..."

# Criar secret para a aplicação
kubectl create secret generic backstage-secrets \
    --from-literal=DATABASE_USER="$DB_USER" \
    --from-literal=DATABASE_PASSWORD="$DB_PASSWORD" \
    --from-literal=ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
    --from-literal=REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
    --namespace=backstage \
    --dry-run=client -o yaml | kubectl apply -f -

# Criar secret para PostgreSQL
kubectl create secret generic postgres-secret \
    --from-literal=POSTGRES_USER="$DB_USER" \
    --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
    --from-literal=POSTGRES_DB="$DB_NAME" \
    --namespace=backstage \
    --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✅ Secrets created successfully!"
echo ""
echo "📋 Summary:"
echo "  • Database User: $DB_USER"
echo "  • Database Name: $DB_NAME"
echo "  • JWT Secrets: Generated securely"
echo ""
echo "⚠️  IMPORTANT: Save these credentials in a secure location!"
echo "🔒 Database Password: $DB_PASSWORD"
echo ""
echo "🎯 You can now deploy your application with: ./deploy.sh"