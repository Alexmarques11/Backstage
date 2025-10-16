#!/bin/bash

# Script de Deploy Seguro para Minikube - Backstage Application
# Usage: ./deploy.sh [environment] [docker_username]

set -e

# Configurações
ENVIRONMENT=${1:-"development"}
DOCKER_USERNAME=${2:-"goncalocruz"}  # Usuário Docker Hub padrão
NAMESPACE="backstage"
K8S_DIR="$(dirname "$0")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar pré-requisitos
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verificar se minikube está instalado
    if ! command -v minikube &> /dev/null; then
        log_error "Minikube não está instalado. Execute: curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube"
        exit 1
    fi
    
    # Verificar se kubectl está instalado
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl não está instalado. Execute: sudo snap install kubectl --classic"
        exit 1
    fi
    
    # Verificar se minikube está rodando
    if ! minikube status | grep -q "Running"; then
        log_warning "Minikube não está rodando. Iniciando..."
        minikube start --driver=docker --memory=4096 --cpus=2
    fi
    
    log_success "Pré-requisitos verificados"
}

# Configurar addons necessários
setup_addons() {
    log_info "Configurando addons do Minikube..."
    
    # Habilitar ingress
    minikube addons enable ingress
    
    # Habilitar metrics-server
    minikube addons enable metrics-server
    
    # Habilitar dashboard (opcional)
    minikube addons enable dashboard
    
    log_success "Addons configurados"
}

# Função para atualizar imagens Docker nos manifests
update_docker_images() {
    log_info "Atualizando imagens Docker para usuário: $DOCKER_USERNAME"
    
    # Backup dos arquivos originais
    cp "$K8S_DIR/04-server.yaml" "$K8S_DIR/04-server.yaml.bak"
    cp "$K8S_DIR/05-auth.yaml" "$K8S_DIR/05-auth.yaml.bak"
    
    # Atualizar imagem do server
    sed -i "s|image: [^/]*/backstage-server:latest|image: $DOCKER_USERNAME/backstage-server:latest|g" "$K8S_DIR/04-server.yaml"
    
    # Atualizar imagem do auth
    sed -i "s|image: [^/]*/backstage-auth:latest|image: $DOCKER_USERNAME/backstage-auth:latest|g" "$K8S_DIR/05-auth.yaml"
    
    log_success "Imagens Docker atualizadas"
}

# Função para restaurar arquivos de backup
restore_manifests() {
    if [ -f "$K8S_DIR/04-server.yaml.bak" ]; then
        mv "$K8S_DIR/04-server.yaml.bak" "$K8S_DIR/04-server.yaml"
    fi
    if [ -f "$K8S_DIR/05-auth.yaml.bak" ]; then
        mv "$K8S_DIR/05-auth.yaml.bak" "$K8S_DIR/05-auth.yaml"
    fi
}

# Deploy da aplicação
deploy_application() {
    log_info "Iniciando deploy da aplicação Backstage..."
    
    # Aplicar manifests em ordem
    log_info "Criando namespace..."
    kubectl apply -f "$K8S_DIR/00-namespace.yaml"
    
    log_info "Aplicando ConfigMaps..."
    kubectl apply -f "$K8S_DIR/01-configmap.yaml"
    
    log_info "Aplicando Secrets..."
    kubectl apply -f "$K8S_DIR/02-secrets.yaml"
    
    log_info "Deploying PostgreSQL..."
    kubectl apply -f "$K8S_DIR/03-postgres.yaml"
    
    # Aguardar PostgreSQL estar pronto
    log_info "Aguardando PostgreSQL estar pronto..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n $NAMESPACE
    
    log_info "Deploying Backstage Server..."
    kubectl apply -f "$K8S_DIR/04-server.yaml"
    
    log_info "Deploying Backstage Auth Server..."
    kubectl apply -f "$K8S_DIR/05-auth.yaml"
    
    log_info "Configurando Ingress..."
    kubectl apply -f "$K8S_DIR/06-ingress.yaml"
    
    # Aguardar deployments estarem prontos
    log_info "Aguardando deployments estarem prontos..."
    kubectl wait --for=condition=available --timeout=300s deployment/backstage-server -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/backstage-auth -n $NAMESPACE
    
    log_success "Deploy da aplicação concluído"
}

# Configurar acesso local
setup_local_access() {
    log_info "Configurando acesso local..."
    
    # Obter IP do Minikube
    MINIKUBE_IP=$(minikube ip)
    
    # Adicionar entrada no /etc/hosts se não existir
    if ! grep -q "backstage.local" /etc/hosts; then
        log_info "Adicionando entrada ao /etc/hosts..."
        echo "$MINIKUBE_IP backstage.local" | sudo tee -a /etc/hosts
    else
        log_info "Atualizando entrada no /etc/hosts..."
        sudo sed -i "s/.*backstage.local/$MINIKUBE_IP backstage.local/" /etc/hosts
    fi
    
    log_success "Acesso local configurado"
}

# Mostrar informações de acesso
show_access_info() {
    log_success "🚀 Deploy concluído com sucesso!"
    echo ""
    echo "📋 Informações de Acesso:"
    echo "========================"
    
    # URLs via Ingress
    echo "🌐 Via Ingress (recomendado):"
    echo "   - Backstage API: http://backstage.local"
    echo "   - Auth Server: http://backstage.local/auth"
    echo ""
    
    # URLs via NodePort
    MINIKUBE_IP=$(minikube ip)
    echo "🔗 Via NodePort (desenvolvimento):"
    echo "   - Backstage Server: http://$MINIKUBE_IP:30300"
    echo "   - Auth Server: http://$MINIKUBE_IP:30400"
    echo "   - PostgreSQL: $MINIKUBE_IP:30432"
    echo ""
    
    # Comandos úteis
    echo "🔧 Comandos Úteis:"
    echo "   - Ver pods: kubectl get pods -n $NAMESPACE"
    echo "   - Ver services: kubectl get svc -n $NAMESPACE"
    echo "   - Ver logs: kubectl logs -f deployment/backstage-server -n $NAMESPACE"
    echo "   - Dashboard: minikube dashboard"
    echo "   - Tunnel (LoadBalancer): minikube tunnel"
    echo ""
    
    # Inicialização do banco
    echo "🗄️  Inicializar banco de dados:"
    echo "   curl http://backstage.local/setup"
    echo "   ou"
    echo "   curl http://$MINIKUBE_IP:30300/setup"
    echo ""
}

# Função de limpeza em caso de erro
cleanup_on_error() {
    log_error "Erro durante o deploy. Executando limpeza..."
    restore_manifests
    exit 1
}

# Configurar trap para limpeza
trap cleanup_on_error ERR

# Menu principal
show_menu() {
    echo ""
    echo "🚀 Backstage Minikube Deploy Script"
    echo "===================================="
    echo "1. Deploy completo (recomendado)"
    echo "2. Apenas verificar pré-requisitos"
    echo "3. Apenas configurar addons"
    echo "4. Apenas deploy da aplicação"
    echo "5. Mostrar informações de acesso"
    echo "6. Sair"
    echo ""
    read -p "Escolha uma opção (1-6): " choice
    
    case $choice in
        1)
            log_info "Executando deploy completo..."
            check_prerequisites
            setup_addons
            update_docker_images
            deploy_application
            setup_local_access
            show_access_info
            restore_manifests
            ;;
        2)
            check_prerequisites
            ;;
        3)
            setup_addons
            ;;
        4)
            update_docker_images
            deploy_application
            restore_manifests
            ;;
        5)
            show_access_info
            ;;
        6)
            log_info "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida!"
            show_menu
            ;;
    esac
}

# Verificar argumentos de linha de comando
if [ $# -eq 0 ]; then
    show_menu
else
    log_info "Executando deploy automático..."
    log_info "Ambiente: $ENVIRONMENT"
    log_info "Docker Username: $DOCKER_USERNAME"
    
    check_prerequisites
    setup_addons
    update_docker_images
    deploy_application
    setup_local_access
    show_access_info
    restore_manifests
fi