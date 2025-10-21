# Backstage Minikube Deployment

This directory contains Kubernetes manifests for deploying the Backstage application on **Minikube**. This is a working, tested deployment that includes external access configuration.

## 🏗️ Architecture

```
External Machine → Host Network → Port Forward/Relay → Minikube → Kubernetes Services → Pods
```

**Components:**
- **PostgreSQL Database**: Persistent storage for user data
- **Backstage Server**: Main API server (port 3000)
- **Auth Server**: Authentication service (port 4000)
- **External Access**: Multiple methods for cross-network connectivity

## 📁 File Structure

```
k8s/
├── 00-namespace.yaml     # Namespace 'backstage'
├── 01-configmap.yaml     # Non-sensitive configuration
├── 03-postgres.yaml      # PostgreSQL with persistent storage
├── 04-server.yaml        # Backstage Server (main API)
├── 05-auth.yaml          # Auth Server (authentication)
├── 06-ingress.yaml       # Ingress + NodePort services
├── deploy.sh             # Automated deployment script
├── README.md             # This file
├── MINIKUBE_SETUP.md     # Minikube installation guide
└── SECURITY.md           # Security and secrets management
```

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)
```bash
cd k8s
./deploy.sh
```

### Option 2: Manual Deployment
Follow the steps in `SECURITY.md` for manual deployment.

## 🔐 Security Notice

**NO SECRETS IN GIT** - This project generates secrets dynamically during deployment. See `SECURITY.md` for details on secure secret management.

```bash├── deploy.sh             # Script de deployment automatizado

## 🌐 External Access Methods

The deployment includes multiple tested methods for external access:

### Method 1: Port Forwarding (Primary)
```bash
kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage
kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage
```
**Access URLs:**
- Main Server: `http://YOUR_HOST_IP:8080/`
- Auth Server: `http://YOUR_HOST_IP:8081/`

### Method 2: NodePort Services
```bash
minikube service backstage-server-nodeport -n backstage --url
minikube service backstage-auth-nodeport -n backstage --url
```
**Direct Minikube Access:**
- Main Server: `http://MINIKUBE_IP:30300/`
- Auth Server: `http://MINIKUBE_IP:30400/`

### Method 3: Additional Relay Methods
For enhanced connectivity, additional relay methods (socat, Python proxy) can be configured. See the main project README for details.

## 🔍 Monitoring and Health Checks

### Check Deployment Status
```bash
kubectl get pods -n backstage
kubectl get services -n backstage
kubectl get endpoints -n backstage
```

### Test Health Endpoints
```bash
# Internal testing
kubectl exec -it deployment/backstage-server -n backstage -- curl localhost:3000/health
kubectl exec -it deployment/backstage-auth -n backstage -- curl localhost:4000/health

# External testing (after port-forward setup)
curl http://localhost:8080/health
curl http://localhost:8081/health
```

## 🛠️ Troubleshooting

### Common Issues
1. **Pods not starting**: Check logs with `kubectl logs <pod-name> -n backstage`
2. **External access failing**: Verify port-forwarding and firewall settings
3. **Database connection issues**: Check PostgreSQL pod status and secrets

### Useful Commands
```bash
# Check all resources
kubectl get all -n backstage

# Describe failing pods
kubectl describe pod <pod-name> -n backstage

# View logs
kubectl logs -f deployment/backstage-server -n backstage

# Restart deployment
kubectl rollout restart deployment/backstage-server -n backstage
```

## 📊 Scaling and Updates

### Scale Services
```bash
kubectl scale deployment backstage-server --replicas=3 -n backstage
kubectl scale deployment backstage-auth --replicas=2 -n backstage
```

### Update Services
```bash
# Rebuild images in Minikube
eval $(minikube docker-env)
docker build -t backstage-server -f ../backend/Dockerfile.server ../backend/

# Restart deployment to use new image
kubectl rollout restart deployment/backstage-server -n backstage
```

This deployment has been tested and confirmed working with external access from different network segments.

## 📊 Scaling and Updates

### Scale Services
```bash
kubectl scale deployment backstage-server --replicas=3 -n backstage
kubectl scale deployment backstage-auth --replicas=2 -n backstage
```

### Update Services
```bash
# Rebuild images in Minikube
eval $(minikube docker-env)
docker build -t backstage-server -f ../backend/Dockerfile.server ../backend/

# Restart deployment to use new image
kubectl rollout restart deployment/backstage-server -n backstage
```

This deployment has been tested and confirmed working with external access from different network segments.├── cleanup.sh            # Script de limpeza

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
