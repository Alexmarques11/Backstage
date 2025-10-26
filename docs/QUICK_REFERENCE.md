# Quick Commands

Copy-paste commands for common tasks.

## Daily Operations

```bash
# Health checks
curl http://159.65.95.83:30001/health
curl http://159.65.95.83:30002/health

# System status
./london-deploy.sh status
kubectl get pods -n backstage

# Deploy updates
./london-deploy.sh update

# Emergency restart
kubectl rollout restart deployment/backstage-server deployment/backstage-auth -n backstage
```

## Development

```bash
# Local setup
cd backend && npm install && npm run dev

# Test endpoints
curl http://localhost:3000/health
curl -X POST http://localhost:4000/auth/register -H "Content-Type: application/json" -d '{"name":"Test","lastname":"User","username":"test","email":"test@example.com","password":"password123"}'

# Deploy changes
./london-deploy.sh update
```

## Administration

```bash
# Resource usage
kubectl top pods -n backstage

# Scale up
kubectl scale deployment backstage-server --replicas=2 -n backstage

# Check logs
kubectl logs deployment/backstage-server -n backstage --tail=20

# Backup database
pg_dump "$(doctl databases connection backstage-london-db --format URI --no-header)" > backup-$(date +%Y%m%d).sql

# Rotate secrets
NEW_ACCESS=$(openssl rand -base64 64)
kubectl create secret generic backstage-secrets --from-literal=ACCESS_TOKEN_SECRET="$NEW_ACCESS" --namespace=backstage --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/backstage-server deployment/backstage-auth -n backstage
```

## Troubleshooting

```bash
# Check what's broken
kubectl get pods -n backstage
kubectl describe pod <pod-name> -n backstage
kubectl logs deployment/backstage-server -n backstage --tail=50

# Database issues
doctl databases get backstage-london-db
kubectl exec -it deployment/backstage-server -n backstage -- nc -zv your-database-host.db.ondigitalocean.com 25060

# Reset everything
kubectl delete pods --all -n backstage
```

## API Testing

```bash
# Test user registration
curl -X POST http://159.65.95.83:30002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","lastname":"User","username":"test123","email":"test123@example.com","password":"password123"}'

# Test login
curl -X POST http://159.65.95.83:30002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test123@example.com","password":"password123"}'

# Test protected endpoint (replace <token> with actual JWT)
curl http://159.65.95.83:30001/posts -H "Authorization: Bearer <token>"
```

## Infrastructure

```bash
# DigitalOcean cluster info
doctl kubernetes cluster get backstage-london
doctl databases get backstage-london-db

# Create new region deployment
doctl kubernetes cluster create backstage-REGION --region REGION --size s-2vcpu-4gb --count 1
doctl databases create backstage-REGION-db --engine pg --version 15 --size db-s-1vcpu-1gb --region REGION

# Build and push images
doctl registry login
docker build -t registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest -f backend/Dockerfile.server backend/
docker push registry.digitalocean.com/backstage-registry-1761508031/backstage-server:latest
```

---

**For detailed explanations, see [Complete Guide](COMPLETE_GUIDE.md)**