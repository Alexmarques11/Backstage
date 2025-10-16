# Guia de Instalação e Setup do Minikube

## 📋 Pré-requisitos

- Docker instalado e funcionando
- Pelo menos 2GB de RAM livre
- Pelo menos 2GB de espaço em disco

## 🚀 Instalação do Minikube

### Ubuntu/Debian:
```bash
# Baixar e instalar minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Instalar kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Ou via package manager:
```bash
# Minikube
sudo apt update && sudo apt install -y minikube

# kubectl
sudo snap install kubectl --classic
```

## 🔧 Configuração Inicial

### 1. Iniciar Minikube:
```bash
# Iniciar com driver Docker (recomendado)
minikube start --driver=docker

# Ou com mais recursos se necessário
minikube start --driver=docker --memory=4096 --cpus=2
```

### 2. Verificar Status:
```bash
minikube status
kubectl cluster-info
```

### 3. Habilitar Addons Úteis:
```bash
# Dashboard para interface web
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