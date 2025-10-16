# Backstage Kubernetes Deployment

Deploy seguro da aplicação Backstage usando Minikube com PostgreSQL, Server e Auth Server separados.

## 🏗️ **Arquitetura**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Ingress       │    │  Backstage       │    │   PostgreSQL    │
│  (backstage.    │───▶│  Server + Auth   │───▶│   Database      │
│   local)        │    │  (Microservices) │    │  (Persistent)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 **Estrutura dos Arquivos**

```
k8s/
├── 00-namespace.yaml     # Namespace 'backstage'
├── 01-configmap.yaml     # Configurações não sensíveis
├── 02-secrets.yaml       # Credenciais e JWT secrets
├── 03-postgres.yaml      # PostgreSQL com persistência
├── 04-server.yaml        # Backstage Server (API principal)
├── 05-auth.yaml          # Auth Server (autenticação)
├── 06-ingress.yaml       # Ingress + NodePort services
├── deploy.sh             # Script de deployment automatizado
├── cleanup.sh            # Script de limpeza
├── monitor.sh            # Script de monitoramento
├── MINIKUBE_SETUP.md     # Guia detalhado de setup
└── README.md             # Esta documentação
```

## 🚀 **Quick Start**

### **Opção 1: Deploy Completo (Recomendado)**
```bash
# Deploy com menu interativo
./deploy.sh

# Deploy automático com usuário Docker específico
./deploy.sh development goncalocruz
```

### **Opção 2: Deploy Manual**
```bash
# 1. Verificar pré-requisitos
minikube status

# 2. Aplicar manifests
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secrets.yaml
kubectl apply -f 03-postgres.yaml
kubectl apply -f 04-server.yaml
kubectl apply -f 05-auth.yaml
kubectl apply -f 06-ingress.yaml

# 3. Aguardar deployments
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n backstage
kubectl wait --for=condition=available --timeout=300s deployment/backstage-server -n backstage
kubectl wait --for=condition=available --timeout=300s deployment/backstage-auth -n backstage
```

## ⚙️ **Configuration**

### **External Database Setup**

1. **Update ConfigMap** (`k8s/backend-configmap.yaml`):
```yaml
data:
  DATABASE_HOST: "your-db-host.com"
  DATABASE_USER: "your_username"
  DATABASE_NAME: "backstage"
  DATABASE_PORT: "5432"
```

2. **Update Secret** (`k8s/backend-secret.yaml`):
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