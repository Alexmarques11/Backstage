# DigitalOcean Deployment Guide

This guide covers multiple ways to deploy the Backstage application to DigitalOcean.

## 🌊 Deployment Options

### Option 1: DigitalOcean Kubernetes (DOKS) - Recommended
### Option 2: DigitalOcean App Platform
### Option 3: DigitalOcean Droplets with Docker
### Option 4: DigitalOcean Container Registry + Droplets

---

## 🚀 Option 1: DigitalOcean Kubernetes (DOKS)

### Prerequisites
```bash
# Install doctl (DigitalOcean CLI)
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init
```

### Step 1: Create Kubernetes Cluster
```bash
# Create a cluster (adjust size/region as needed)
doctl kubernetes cluster create backstage-cluster \
  --region nyc1 \
  --version 1.28.2-do.0 \
  --node-pool "name=backstage-pool;size=s-2vcpu-4gb;count=2;auto-scale=true;min-nodes=1;max-nodes=5"

# Get cluster credentials
doctl kubernetes cluster kubeconfig save backstage-cluster
```

### Step 2: Create Database
```bash
# Create managed PostgreSQL database
doctl databases create backstage-db \
  --engine postgres \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --version 15

# Get connection details
doctl databases connection backstage-db --format URI
```

### Step 3: Prepare Deployment Files

Create `k8s/digitalocean/`:

#### `namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: backstage
```

#### `secrets.yaml`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backstage-secrets
  namespace: backstage
type: Opaque
data:
  # Base64 encoded values - replace with your actual values
  DATABASE_URL: <base64-encoded-postgres-url>
  ACCESS_TOKEN_SECRET: <base64-encoded-jwt-secret>
  REFRESH_TOKEN_SECRET: <base64-encoded-refresh-secret>
```

#### `configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backstage-config
  namespace: backstage
data:
  NODE_ENV: "production"
  PORT: "3000"
  AUTH_PORT: "4000"
```

#### `server-deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backstage-server
  namespace: backstage
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backstage-server
  template:
    metadata:
      labels:
        app: backstage-server
    spec:
      containers:
      - name: backstage-server
        image: goncalocruz/backstage-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backstage-secrets
              key: DATABASE_URL
        - name: ACCESS_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: backstage-secrets
              key: ACCESS_TOKEN_SECRET
        - name: REFRESH_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: backstage-secrets
              key: REFRESH_TOKEN_SECRET
        envFrom:
        - configMapRef:
            name: backstage-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backstage-server-service
  namespace: backstage
spec:
  selector:
    app: backstage-server
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

#### `auth-deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backstage-auth
  namespace: backstage
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backstage-auth
  template:
    metadata:
      labels:
        app: backstage-auth
    spec:
      containers:
      - name: backstage-auth
        image: goncalocruz/backstage-auth:latest
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backstage-secrets
              key: DATABASE_URL
        - name: ACCESS_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: backstage-secrets
              key: ACCESS_TOKEN_SECRET
        - name: REFRESH_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: backstage-secrets
              key: REFRESH_TOKEN_SECRET
        envFrom:
        - configMapRef:
            name: backstage-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backstage-auth-service
  namespace: backstage
spec:
  selector:
    app: backstage-auth
  ports:
    - protocol: TCP
      port: 80
      targetPort: 4000
  type: ClusterIP
```

#### `ingress.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backstage-ingress
  namespace: backstage
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - your-domain.com
    - auth.your-domain.com
    secretName: backstage-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backstage-server-service
            port:
              number: 80
  - host: auth.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backstage-auth-service
            port:
              number: 80
```

#### `hpa.yaml` (Auto-scaling)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backstage-server-hpa
  namespace: backstage
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backstage-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backstage-auth-hpa
  namespace: backstage
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backstage-auth
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Step 4: Deploy to DOKS
```bash
# Build and push images to DigitalOcean Container Registry
doctl registry create backstage-registry

# Login to registry
doctl registry login

# Build and push images
docker build -t registry.digitalocean.com/backstage-registry/backstage-server:latest -f backend/Dockerfile.server backend/
docker build -t registry.digitalocean.com/backstage-registry/backstage-auth:latest -f backend/Dockerfile.auth backend/

docker push registry.digitalocean.com/backstage-registry/backstage-server:latest
docker push registry.digitalocean.com/backstage-registry/backstage-auth:latest

# Deploy to Kubernetes
kubectl apply -f k8s/digitalocean/
```

### Step 5: Setup SSL/TLS (Optional)
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## 🌐 Option 2: DigitalOcean App Platform

### Step 1: Prepare App Spec
Create `.do/app.yaml`:

```yaml
name: backstage-app
services:
- name: backstage-server
  source_dir: /backend
  github:
    repo: your-username/backstage
    branch: main
  dockerfile_path: backend/Dockerfile.server
  http_port: 3000
  instance_count: 2
  instance_size_slug: basic-xxs
  health_check:
    http_path: /health
  env:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: ACCESS_TOKEN_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: REFRESH_TOKEN_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET

- name: backstage-auth
  source_dir: /backend
  github:
    repo: your-username/backstage
    branch: main
  dockerfile_path: backend/Dockerfile.auth
  http_port: 4000
  instance_count: 2
  instance_size_slug: basic-xxs
  health_check:
    http_path: /health
  env:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: ACCESS_TOKEN_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET
  - key: REFRESH_TOKEN_SECRET
    scope: RUN_AND_BUILD_TIME
    type: SECRET

databases:
- name: backstage-db
  engine: PG
  version: "15"
  size: basic
  num_nodes: 1

domains:
- name: your-domain.com
  type: PRIMARY
  zone: your-domain.com
```

### Step 2: Deploy with App Platform
```bash
# Create app from spec
doctl apps create --spec .do/app.yaml

# Or deploy via DigitalOcean web interface
# Upload the app.yaml file in the App Platform section
```

---

## 🐳 Option 3: DigitalOcean Droplets with Docker

### Step 1: Create Droplet
```bash
# Create a droplet
doctl compute droplet create backstage-server \
  --region nyc1 \
  --image docker-20-04 \
  --size s-2vcpu-4gb \
  --ssh-keys your-ssh-key-id

# Get droplet IP
doctl compute droplet list
```

### Step 2: Setup Docker Compose for Production
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backstage-server:
    image: goncalocruz/backstage-server:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
    restart: unless-stopped
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backstage-auth:
    image: goncalocruz/backstage-auth:latest
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
    restart: unless-stopped
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=backstage
      - POSTGRES_USER=backstage_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backstage-server
      - backstage-auth
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Create Nginx Config
Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backstage_server {
        server backstage-server:3000;
    }
    
    upstream backstage_auth {
        server backstage-auth:4000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://backstage_server;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 80;
        server_name auth.your-domain.com;
        
        location / {
            proxy_pass http://backstage_auth;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Step 4: Deploy to Droplet
```bash
# SSH to droplet
ssh root@your-droplet-ip

# Clone repository
git clone https://github.com/your-username/backstage.git
cd backstage

# Create environment file
cat <<EOF > .env
DATABASE_URL=postgresql://backstage_user:your_password@postgres:5432/backstage
POSTGRES_PASSWORD=your_password
ACCESS_TOKEN_SECRET=$(openssl rand -base64 64)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 64)
EOF

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
curl http://localhost:3000/setup
```

---

## 🔧 Option 4: Container Registry + Load Balancer

### Step 1: Create Infrastructure
```bash
# Create container registry
doctl registry create backstage-registry

# Create multiple droplets
doctl compute droplet create backstage-server-1 backstage-server-2 \
  --region nyc1 \
  --image docker-20-04 \
  --size s-1vcpu-2gb \
  --ssh-keys your-ssh-key-id

# Create load balancer
doctl compute load-balancer create \
  --name backstage-lb \
  --forwarding-rules entry_protocol:http,entry_port:80,target_protocol:http,target_port:3000 \
  --health-check protocol:http,port:3000,path:/health \
  --region nyc1 \
  --droplet-ids $(doctl compute droplet list --format ID --no-header | tr '\n' ',')
```

---

## 💰 Cost Estimation

### DOKS (Recommended for production)
- **Cluster**: $12/month (2 nodes, s-2vcpu-4gb)
- **Database**: $15/month (db-s-1vcpu-1gb)
- **Load Balancer**: $12/month
- **Container Registry**: $5/month
- **Total**: ~$44/month

### App Platform
- **Apps**: $12/month (2 basic containers)
- **Database**: $15/month
- **Total**: ~$27/month

### Droplets
- **Single Droplet**: $24/month (s-2vcpu-4gb)
- **Multiple Droplets + LB**: $36/month (2 droplets + LB)
- **Database**: $15/month (if using managed DB)

---

## 🚀 Quick Start Commands

### For DOKS:
```bash
# 1. Create cluster and database
./scripts/create-doks-infrastructure.sh

# 2. Build and push images
./scripts/build-and-push-images.sh

# 3. Deploy application
kubectl apply -f k8s/digitalocean/

# 4. Get external IP
kubectl get ingress -n backstage
```

### For App Platform:
```bash
# 1. Deploy app
doctl apps create --spec .do/app.yaml

# 2. Monitor deployment
doctl apps list
```

### For Droplets:
```bash
# 1. Create and setup droplet
./scripts/setup-droplet.sh

# 2. Deploy with Docker Compose
ssh root@droplet-ip "cd backstage && docker-compose -f docker-compose.prod.yml up -d"
```

---

## 🔒 Security Considerations

1. **Secrets Management**: Use DigitalOcean Secrets or environment variables
2. **SSL/TLS**: Enable HTTPS with Let's Encrypt or CloudFlare
3. **Database**: Use managed PostgreSQL with private networking
4. **Firewall**: Configure DigitalOcean Cloud Firewalls
5. **Backup**: Enable automated backups for databases
6. **Monitoring**: Use DigitalOcean Monitoring or external services

## 📚 Additional Resources

- [DigitalOcean Kubernetes Documentation](https://docs.digitalocean.com/products/kubernetes/)
- [App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Container Registry Documentation](https://docs.digitalocean.com/products/container-registry/)