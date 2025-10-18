#!/bin/bash
# Script para gerar secrets seguros para o Kubernetes
# Secrets são criados diretamente no cluster - NUNCA salvos em arquivos!

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

# Verificar se namespace existe
if ! kubectl get namespace backstage &> /dev/null; then
    echo "� Creating backstage namespace..."
    kubectl create namespace backstage
fi

# Gerar credenciais seguras
echo "🔑 Generating secure credentials..."
DB_USER="backstage_user"
DB_NAME="backstage"
DB_PASSWORD=$(openssl rand -hex 32)
ACCESS_TOKEN_SECRET=$(openssl rand -hex 64)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 64)

echo " Creating Kubernetes secrets..."

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
echo "  • Secrets stored securely in Kubernetes cluster"
echo "  • NO secrets saved to files or Git repository"
echo ""
echo "🔒 Generated Password: $DB_PASSWORD"
echo "⚠️  Save this password in a secure location!"
echo ""
echo "🎯 You can now deploy with: ./deploy.sh"