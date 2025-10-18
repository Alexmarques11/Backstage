# 🔐 Secure Kubernetes Deployment

## ⚠️ SECURITY NOTICE

**SECRETS NEVER STORED IN GIT!** This project uses secure deployment that generates secrets dynamically and stores them only in the Kubernetes cluster.

## 🚀 Quick Start

### 1. Generate Secure Secrets (REQUIRED)
```bash
cd k8s/
./generate-secrets.sh
```
This will:
- Generate secure database credentials with `openssl`
- Create strong JWT secrets (64-byte random)
- Apply secrets directly to Kubernetes cluster
- **NEVER save secrets to files or Git**

### 2. Deploy Application
```bash
./deploy.sh
```

## 🔍 What was fixed

### Before (VULNERABLE):
- Real passwords in `k8s/02-secrets.yaml` file
- Even base64 encoding was easily decodable
- Anyone with GitHub access could see: `user123`, `123456`, etc.

### After (SECURE):
- **NO secrets file in Git repository**
- Secrets generated dynamically during deployment
- Secrets stored only in Kubernetes cluster
- Strong passwords generated with `openssl rand -hex 32`

## 📋 Security Best Practices

1. **Never commit secrets** - No secrets files in Git, period
2. **Generate dynamically** - Create secrets during deployment
3. **Use strong passwords** - 32+ byte random generation with OpenSSL
4. **Rotate regularly** - Re-run `./generate-secrets.sh`
5. **Limit cluster access** - Use RBAC and network policies

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

## 🆘 Troubleshooting

If you get "Secrets not found" error:
```bash
cd k8s/
./generate-secrets.sh
./deploy.sh
```

To rotate compromised secrets:
```bash
kubectl delete secret backstage-secrets postgres-secret -n backstage
./generate-secrets.sh
kubectl rollout restart deployment -n backstage
```