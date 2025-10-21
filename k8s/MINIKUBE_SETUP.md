# Minikube Installation and Setup Guide

## 📋 Prerequisites

- Docker installed and running
- At least 3GB of RAM free
- At least 2GB of disk space
- Linux/Ubuntu system (tested configuration)

## 🚀 Minikube Installation

### Ubuntu/Debian Installation:
```bash
# Download and install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Alternative Package Manager Installation:
```bash
# Minikube via apt
sudo apt update && sudo apt install -y minikube

# kubectl via snap
sudo snap install kubectl --classic
```

## 🔧 Initial Configuration

### 1. Start Minikube (Tested Configuration):
```bash
# Start with Docker driver and sufficient resources
minikube start --driver=docker --memory=3072 --cpus=2

# Verify startup
minikube status
kubectl cluster-info
```

### 2. Enable Required Addons:
```bash
# Enable ingress for external access
minikube addons enable ingress

# Enable metrics server for monitoring
minikube addons enable metrics-server

# Enable dashboard for web interface
minikube addons enable dashboard
```

### 3. Configure Docker Environment:
```bash
# Point local Docker to Minikube's Docker daemon
eval $(minikube docker-env)

# Verify configuration
docker ps
```

## 🚀 Deploy Backstage Application

### Option 1: Automated Deployment (Recommended)
```bash
cd k8s
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# Build images in Minikube
eval $(minikube docker-env)
cd backend
docker build -t backstage-server -f Dockerfile.server .
docker build -t backstage-auth -f Dockerfile.auth .

# Deploy to Kubernetes
cd ../k8s
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
# Create secrets (see SECURITY.md)
kubectl apply -f 03-postgres.yaml
kubectl apply -f 04-server.yaml
kubectl apply -f 05-auth.yaml
kubectl apply -f 06-ingress.yaml
```

## 🌐 External Access Setup

### Get Network Information:
```bash
# Get Minikube IP
minikube ip

# Get host IP
hostname -I | awk '{print $1}'

# Get service URLs
minikube service list -n backstage
```

### Setup Port Forwarding (Primary Method):
```bash
# Forward main server
kubectl port-forward --address 0.0.0.0 service/backstage-server-service 8080:3000 -n backstage &

# Forward auth server
kubectl port-forward --address 0.0.0.0 service/backstage-auth-service 8081:4000 -n backstage &
```

**External Access URLs:**
- Main Server: `http://YOUR_HOST_IP:8080/`
- Auth Server: `http://YOUR_HOST_IP:8081/`

## 🔍 Verification and Testing

### Check Pod Status:
```bash
kubectl get pods -n backstage
kubectl get services -n backstage
```

### Test Health Endpoints:
```bash
# Local testing
curl http://localhost:8080/health
curl http://localhost:8081/health

# External testing (replace with your host IP)
curl http://YOUR_HOST_IP:8080/health
curl http://YOUR_HOST_IP:8081/health
```

### Monitor Logs:
```bash
kubectl logs -f deployment/backstage-server -n backstage
kubectl logs -f deployment/backstage-auth -n backstage
kubectl logs -f statefulset/postgres -n backstage
```
minikube addons enable dashboard

# Ingress para exposição de serviços
minikube addons enable ingress

# Metrics server para monitoramento
minikube addons enable metrics-server
```

## 🌐 Acessar Dashboard

```bash
# Abrir dashboard no navegador
minikube dashboard

# Ou obter URL para acesso manual
minikube dashboard --url
```

## 📦 Configurar Registry Local (Opcional)

```bash
# Habilitar registry addon
minikube addons enable registry

# Configurar Docker para usar registry local
eval $(minikube docker-env)
```

## 🔍 Comandos Úteis

```bash
# Ver logs do minikube
minikube logs

# SSH no nó do minikube
minikube ssh

# Ver IPs
minikube ip

# Parar minikube
minikube stop

# Deletar cluster
minikube delete

# Ver addons disponíveis
minikube addons list
```

## ⚠️ Troubleshooting

### Problema: Minikube não inicia
```bash
# Limpar e reiniciar
minikube delete
minikube start --driver=docker --force

# Verificar driver disponível
minikube start --help | grep driver
```

### Problema: Sem espaço em disco
```bash
# Limpar imagens Docker não utilizadas
docker system prune -a

# Verificar espaço do minikube
minikube ssh "df -h"
```

### Problema: Conflito de rede
```bash
# Reiniciar com subnet diferente
minikube start --driver=docker --subnet=192.168.59.0/24
```

## 🎯 Próximos Passos

Após a instalação bem-sucedida:
1. Execute os scripts de deploy do Backstage
2. Acesse o dashboard para monitoramento
3. Configure ingress para acesso externo
4. Implemente monitoramento e logs

## 📝 Configuração para o Projeto Backstage

Variáveis de ambiente importantes:
```bash
# Definir namespace padrão
kubectl config set-context --current --namespace=backstage

# Verificar contexto
kubectl config current-context
```