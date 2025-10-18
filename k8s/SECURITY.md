# 🔐 Secure Kubernetes Deployment

## ⚠️ SECURITY NOTICE

**NEVER commit real secrets to Git!** This project uses a secure deployment process that generates secrets dynamically.

## 🚀 Quick Start

### 1. Generate Secure Secrets (REQUIRED)
```bash
cd k8s/
./generate-secrets.sh
```
This will:
- Generate secure database credentials
- Create strong JWT secrets
- Apply them directly to Kubernetes (never saved to files)

### 2. Deploy Application
```bash
./deploy.sh
```

## 🔍 What was fixed

### Before (VULNERABLE):
- Real passwords in `k8s/02-secrets.yaml`
- Base64 encoding gave false sense of security
- Anyone could decode: `echo "MTIzNDU2" | base64 -d` → `123456`

### After (SECURE):
- `02-secrets.yaml` is now a template with placeholders
- Real secrets generated dynamically with `./generate-secrets.sh`
- Secrets only exist in Kubernetes cluster, not in Git
- Strong passwords generated with `openssl rand`

## 📋 Security Best Practices

1. **Never commit real secrets** - Use templates and generation scripts
2. **Rotate secrets regularly** - Re-run `./generate-secrets.sh`
3. **Use strong passwords** - Generated automatically with OpenSSL
4. **Limit cluster access** - Use RBAC and network policies
5. **Monitor access** - Check Kubernetes audit logs

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