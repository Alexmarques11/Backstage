# Kubernetes Deployment for BackstageKotlin

This directory contains Kubernetes manifests for deploying the BackstageKotlin application.

## 🏗️ **Architecture**

The default setup assumes you have an **external PostgreSQL database** (recommended for production).

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Ingress       │    │   Backend Pod    │    │  External       │
│  (backstage.    │───▶│   (Node.js)      │───▶│  PostgreSQL     │
│   local)        │    │                  │    │  Database       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 **File Structure**

```
k8s/
├── namespace.yaml           # Creates 'backstage' namespace
├── backend-configmap.yaml   # Backend environment variables
├── backend-secret.yaml      # Database password (base64 encoded)
├── backend-deployment.yaml  # Backend deployment & service
├── ingress.yaml            # Exposes app via backstage.local
└── optional/               # PostgreSQL for testing only
    ├── postgres-configmap.yaml
    ├── postgres-secret.yaml
    ├── postgres-pvc.yaml
    └── postgres-deployment.yaml
```

## 🚀 **Deployment Options**

### **Option 1: External Database (Production)**
```bash
# 1. Edit database configuration
nano k8s/backend-configmap.yaml  # Update DB host, user, name
nano k8s/backend-secret.yaml     # Update DB password (base64)

# 2. Deploy
./deploy-minikube.sh
```

### **Option 2: With PostgreSQL (Testing)**
```bash
# Deploy with PostgreSQL included for testing
./deploy-minikube-with-postgres.sh
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