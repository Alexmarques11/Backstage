# 🔐 Backstage Minikube Security Guide

## ⚠️ SECURITY NOTICE

**SECRETS ARE NEVER STORED IN GIT!** This guide shows how the deployment script automatically creates secure secrets, and how to manage them manually if needed.

## 🚀 Automated Secure Deployment

### Using deploy.sh (Recommended)
The `deploy.sh` script automatically handles secure secret generation:

```bash
cd k8s
./deploy.sh
```

**What the script does:**
1. Generates cryptographically secure random secrets
2. Creates Kubernetes secrets with proper namespace isolation
3. Deploys all services with health checks
4. Sets up external access methods
5. Verifies deployment success

## 🔧 Manual Secret Management

If you need to create secrets manually, follow these steps:

### 1. Generate Secure Credentials
```bash
# Generate database password (32 random characters)
DB_PASSWORD=$(openssl rand -base64 32)

# Generate JWT secrets (64 random characters each)
JWT_SECRET=$(openssl rand -base64 64)
REFRESH_SECRET=$(openssl rand -base64 64)

# Display generated values (save these securely!)
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo "Refresh Secret: $REFRESH_SECRET"
```

### 2. Create Kubernetes Secrets
```bash
# Create namespace first
kubectl create namespace backstage

# Create application secrets
kubectl create secret generic backstage-secrets \
    --from-literal=DATABASE_USER="backstage_user" \
    --from-literal=DATABASE_PASSWORD="$DB_PASSWORD" \
    --from-literal=ACCESS_TOKEN_SECRET="$JWT_SECRET" \
    --from-literal=REFRESH_TOKEN_SECRET="$REFRESH_SECRET" \
    --namespace=backstage

# Create PostgreSQL secrets
kubectl create secret generic postgres-secret \
    --from-literal=POSTGRES_USER="backstage_user" \
    --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
    --from-literal=POSTGRES_DB="backstage" \
    --namespace=backstage
```

### 3. Verify Secrets Creation
```bash
# List secrets (values are base64 encoded)
kubectl get secrets -n backstage

# Describe secrets (shows metadata, not values)
kubectl describe secret backstage-secrets -n backstage
kubectl describe secret postgres-secret -n backstage
```

## 🔍 Security Features

### Database Security
- **Isolated Network**: PostgreSQL only accessible within Kubernetes cluster
- **Strong Passwords**: 32-byte randomly generated passwords
- **Persistent Storage**: Data encrypted at rest (depending on storage driver)
- **User Isolation**: Dedicated database user with limited permissions

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Bcrypt Hashing**: Password hashing with salt
- **Secret Rotation**: Secrets can be rotated without code changes
- **Namespace Isolation**: All secrets isolated to backstage namespace

### Container Security
- **Health Checks**: Automatic restart on failure
- **Resource Limits**: CPU and memory limits prevent resource exhaustion
- **Non-root User**: Containers run with non-privileged users where possible
- **Read-only Root**: Containers use read-only root filesystems where possible

## 🔄 Secret Rotation

To rotate secrets without downtime:

### 1. Generate New Secrets
```bash
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_REFRESH_SECRET=$(openssl rand -base64 64)
```

### 2. Update Kubernetes Secrets
```bash
kubectl patch secret backstage-secrets -n backstage \
    --type='json' \
    -p='[{"op": "replace", "path": "/data/ACCESS_TOKEN_SECRET", "value":"'$(echo -n "$NEW_JWT_SECRET" | base64)'"}]'

kubectl patch secret backstage-secrets -n backstage \
    --type='json' \
    -p='[{"op": "replace", "path": "/data/REFRESH_TOKEN_SECRET", "value":"'$(echo -n "$NEW_REFRESH_SECRET" | base64)'"}]'
```

### 3. Restart Services
```bash
kubectl rollout restart deployment/backstage-server -n backstage
kubectl rollout restart deployment/backstage-auth -n backstage
```

## 🛡️ Security Best Practices

### Network Security
- **Firewall**: Only necessary ports (8080, 8081) exposed to external networks
- **Internal Communication**: Services communicate only within cluster network
- **TLS**: Use TLS/SSL for production deployments

### Access Control
- **Kubernetes RBAC**: Implement role-based access control for production
- **Namespace Isolation**: All resources isolated to backstage namespace
- **Secret Access**: Only authorized pods can access secrets

### Monitoring
- **Health Endpoints**: All services expose health check endpoints
- **Logging**: Centralized logging for security audit trails
- **Alerting**: Set up alerts for failed authentication attempts

### Production Considerations
- **Certificate Management**: Use cert-manager for automatic TLS certificates
- **Backup Encryption**: Encrypt database backups
- **Network Policies**: Implement Kubernetes network policies for micro-segmentation
- **Regular Updates**: Keep all components updated with security patches

## 🔧 Troubleshooting Security Issues

### Check Secret Values
```bash
# Decode and view secret values (use with caution!)
kubectl get secret backstage-secrets -n backstage -o jsonpath='{.data.ACCESS_TOKEN_SECRET}' | base64 -d
```

### Verify Secret Mounting
```bash
# Check if secrets are properly mounted in pods
kubectl exec -it deployment/backstage-server -n backstage -- env | grep TOKEN
```

### Check Authentication Flow
```bash
# Test authentication endpoint
curl -X POST http://localhost:8081/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
```

This security setup has been tested and confirmed working with the Minikube deployment.
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