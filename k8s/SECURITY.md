# 🔐 Manual Kubernetes Deployment Guide

## ⚠️ SECURITY NOTICE

**SECRETS NEVER STORED IN GIT!** This guide shows how to manually create and deploy secrets securely.

## 🚀 Manual Deployment Steps

### 1. Create Namespace
```bash
kubectl create namespace backstage
```

### 2. Manually Generate Secure Credentials
Generate strong passwords and secrets:
```bash
# Generate database password (32 random bytes)
openssl rand -hex 32

# Generate JWT access token secret (64 random bytes)  
openssl rand -hex 64

# Generate JWT refresh token secret (64 random bytes)
openssl rand -hex 64
```

### 3. Create Secrets Manually
Use the generated values to create Kubernetes secrets:

```bash
# Replace <GENERATED_VALUES> with your actual generated values from step 2
kubectl create secret generic backstage-secrets \
    --from-literal=DATABASE_USER="backstage_user" \
    --from-literal=DATABASE_PASSWORD="<YOUR_32_BYTE_PASSWORD>" \
    --from-literal=ACCESS_TOKEN_SECRET="<YOUR_64_BYTE_JWT_SECRET>" \
    --from-literal=REFRESH_TOKEN_SECRET="<YOUR_64_BYTE_REFRESH_SECRET>" \
    --namespace=backstage

kubectl create secret generic postgres-secret \
    --from-literal=POSTGRES_USER="backstage_user" \
    --from-literal=POSTGRES_PASSWORD="<SAME_32_BYTE_PASSWORD>" \
    --from-literal=POSTGRES_DB="backstage" \
    --namespace=backstage
```

### 4. Deploy Application Components
Apply the Kubernetes manifests in order:

```bash
# Apply ConfigMaps
kubectl apply -f k8s/01-configmap.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/03-postgres.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n backstage

# Deploy Backstage Server
kubectl apply -f k8s/04-server.yaml

# Deploy Auth Server  
kubectl apply -f k8s/05-auth.yaml

# Configure Services and Ingress
kubectl apply -f k8s/06-services.yaml
```

### 5. Initialize Database
Once deployed, initialize the database:
```bash
# Port forward to access the server
kubectl port-forward service/backstage-server 13000:3000 -n backstage &

# Initialize database schema
curl http://localhost:13000/setup

# Stop port forwarding
kill %1
```

## 📋 Manual Security Best Practices

1. **Generate secrets manually** - Always use `openssl rand` for strong randomness
2. **Never save secrets to files** - Create directly in Kubernetes with `kubectl create secret`
3. **Use unique passwords** - Generate different passwords for each environment
4. **Rotate secrets regularly** - Delete and recreate secrets periodically
5. **Store passwords securely** - Use a password manager for the generated values

## 🔧 Available Scripts

- `generate-secrets.sh` - Generate and apply secure secrets
- `deploy.sh` - Deploy application (checks for secrets first)
- `cleanup.sh` - Remove deployment
- `monitor.sh` - Monitor deployment status

## 🎯 Next Steps

1. **Change default Docker username** in `deploy.sh` if needed
2. **Review ConfigMap values** in `01-configmap.yaml`
3. **Configure ingress domain** in `06-ingress.yaml`
4. **Set up monitoring** with `./monitor.sh`

## 🔧 Manual Verification Commands

Check deployment status:
```bash
# Check all pods
kubectl get pods -n backstage

# Check services  
kubectl get svc -n backstage

# Check secrets (without revealing values)
kubectl get secrets -n backstage

# View logs
kubectl logs -f deployment/backstage-server -n backstage
kubectl logs -f deployment/backstage-auth -n backstage
```

## 🌐 Manual Access Setup

### Option 1: Port Forwarding (Development)
```bash
# Access main server
kubectl port-forward service/backstage-server 13000:3000 -n backstage

# Access auth server (separate terminal)
kubectl port-forward service/backstage-auth 14000:4000 -n backstage
```

### Option 2: NodePort (if configured)
```bash
# Get Minikube IP
minikube ip

# Access via NodePort
# Server: http://<MINIKUBE_IP>:30300
# Auth: http://<MINIKUBE_IP>:30400
```

### Option 3: Ingress (Production)
Configure your domain to point to the ingress controller.

## 🆘 Manual Troubleshooting

### If secrets are missing:
```bash
# Check if secrets exist
kubectl get secrets -n backstage

# If missing, recreate manually (see step 3 above)
```

### If pods are not starting:
```bash
# Check pod status
kubectl describe pod <POD_NAME> -n backstage

# Check logs
kubectl logs <POD_NAME> -n backstage
```

### Database connection issues:
```bash
# Check PostgreSQL pod
kubectl logs deployment/postgres -n backstage

# Test database connection
kubectl exec -it deployment/postgres -n backstage -- psql -U backstage_user -d backstage
```

### To completely restart:
```bash
# Delete all deployments
kubectl delete namespace backstage

# Start over from step 1
```