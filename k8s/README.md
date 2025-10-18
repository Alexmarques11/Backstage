# 📋 Manual Kubernetes Deployment# Backstage Kubernetes Deployment



This directory contains Kubernetes manifests for **manual deployment** of the Backstage application.Deploy seguro da aplicação Backstage usando Minikube com PostgreSQL, Server e Auth Server separados.



## 🗂️ Files Overview
## 🏗️ **Arquitetura**



- `00-namespace.yaml` - Creates the backstage namespace```

- `01-configmap.yaml` - Configuration for the applications  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐

- `03-postgres.yaml` - PostgreSQL database deployment│   Ingress       │    │  Backstage       │    │   PostgreSQL    │

- `04-server.yaml` - Main Backstage server (port 3000)│  (backstage.    │───▶│  Server + Auth   │───▶│   Database      │

- `05-auth.yaml` - Authentication server (port 4000)│   local)        │    │  (Microservices) │    │  (Persistent)   │

- `06-services.yaml` - Services and ingress configuration└─────────────────┘    └──────────────────┘    └─────────────────┘

```

## 🔐 Security Notice

## 📁 **Estrutura dos Arquivos**

**NO SECRETS FILES** - This project does not include any secrets files for security reasons. You must create secrets manually using the commands in `SECURITY.md`.

```

## 🚀 Manual Deployment Processk8s/

├── 00-namespace.yaml     # Namespace 'backstage'

### 1. Read Security Guide First├── 01-configmap.yaml     # Configurações não sensíveis

```bash├── 02-secrets.yaml       # Credenciais e JWT secrets

cat SECURITY.md├── 03-postgres.yaml      # PostgreSQL com persistência

```├── 04-server.yaml        # Backstage Server (API principal)

├── 05-auth.yaml          # Auth Server (autenticação)

### 2. Create Namespace├── 06-ingress.yaml       # Ingress + NodePort services

```bash├── deploy.sh             # Script de deployment automatizado

kubectl create namespace backstage├── cleanup.sh            # Script de limpeza

```├── monitor.sh            # Script de monitoramento

├── MINIKUBE_SETUP.md     # Guia detalhado de setup

### 3. Generate Secrets Manually└── README.md             # Esta documentação

```bash```

# Generate strong passwords

openssl rand -hex 32  # Database password## 🚀 **Quick Start**

openssl rand -hex 64  # JWT secrets

```### **Opção 1: Deploy Completo (Recomendado)**

```bash

### 4. Create Kubernetes Secrets# Deploy com menu interativo

```bash./deploy.sh

# Use your generated values

kubectl create secret generic backstage-secrets \# Deploy automático com usuário Docker específico

    --from-literal=DATABASE_USER="backstage_user" \./deploy.sh development goncalocruz

    --from-literal=DATABASE_PASSWORD="<YOUR_GENERATED_PASSWORD>" \```

    --from-literal=ACCESS_TOKEN_SECRET="<YOUR_JWT_SECRET>" \

    --from-literal=REFRESH_TOKEN_SECRET="<YOUR_REFRESH_SECRET>" \### **Opção 2: Deploy Manual**

    --namespace=backstage```bash

```# 1. Verificar pré-requisitos

minikube status

### 5. Deploy Application

```bash# 2. Aplicar manifests

kubectl apply -f 01-configmap.yamlkubectl apply -f 00-namespace.yaml

kubectl apply -f 03-postgres.yamlkubectl apply -f 01-configmap.yaml

kubectl apply -f 04-server.yaml  kubectl apply -f 02-secrets.yaml

kubectl apply -f 05-auth.yamlkubectl apply -f 03-postgres.yaml

kubectl apply -f 06-services.yamlkubectl apply -f 04-server.yaml

```kubectl apply -f 05-auth.yaml

kubectl apply -f 06-ingress.yaml

### 6. Initialize Database

```bash# 3. Aguardar deployments

kubectl port-forward service/backstage-server 13000:3000 -n backstage &kubectl wait --for=condition=available --timeout=300s deployment/postgres -n backstage

curl http://localhost:13000/setupkubectl wait --for=condition=available --timeout=300s deployment/backstage-server -n backstage

kill %1kubectl wait --for=condition=available --timeout=300s deployment/backstage-auth -n backstage

``````



## 📚 Documentation## ⚙️ **Configuration**



- `SECURITY.md` - **Complete manual deployment guide** with security best practices### **External Database Setup**

- `deploy.sh` - Reference script (can be customized for your needs)

- `cleanup.sh` - Remove all deployments1. **Update ConfigMap** (`k8s/backend-configmap.yaml`):

- `monitor.sh` - Check deployment status```yaml

data:

## ⚠️ Important Notes  DATABASE_HOST: "your-db-host.com"

  DATABASE_USER: "your_username"

- **Always generate unique secrets** for each environment  DATABASE_NAME: "backstage"

- **Never commit secrets** to version control  DATABASE_PORT: "5432"

- **Use strong passwords** (32+ bytes) with OpenSSL```

- **Store credentials securely** in a password manager

- **Follow manual steps** - no automatic generation2. **Update Secret** (`k8s/backend-secret.yaml`):
```bash
# Encode your password
echo -n "your_actual_password" | base64

# Update the secret file with the encoded value
```

## 🌐 **Access**

After deployment:

1. **Add to hosts file**:
```bash
echo "$(minikube ip) backstage.local" | sudo tee -a /etc/hosts
```

2. **Initialize database**:
```bash
curl http://backstage.local/setup
```

3. **Test API**:
```bash
# Get users
curl http://backstage.local/

# Create user
curl -X POST http://backstage.local/ \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "lastname": "Doe"}'
```

## 🔧 **Useful Commands**

```bash
# Check pod status
kubectl get pods -n backstage

# View logs
kubectl logs -f deployment/backend -n backstage

# Scale backend
kubectl scale deployment backend --replicas=3 -n backstage

# Port forward for direct access
kubectl port-forward service/backend-service 8080:80 -n backstage

# Delete everything
./cleanup-minikube.sh
```

## 📊 **Production Considerations**

- Use managed databases (AWS RDS, Google Cloud SQL, etc.)
- Set up proper secrets management (Vault, AWS Secrets Manager)
- Configure resource limits and requests
- Set up monitoring and logging
- Use proper ingress with SSL/TLS
- Configure horizontal pod autoscaling
