#!/bin/bash

# Script de Limpeza e Undeploy - Backstage Application
# Usage: ./cleanup.sh [namespace]

set -e

# Configurações
NAMESPACE=${1:-"backstage"}
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

# Função para remover recursos
cleanup_resources() {
    log_info "Removendo recursos da aplicação Backstage..."
    
    # Remover em ordem reversa
    log_info "Removendo Ingress..."
    kubectl delete -f "$K8S_DIR/06-ingress.yaml" --ignore-not-found=true
    
    log_info "Removendo Backstage Auth Server..."
    kubectl delete -f "$K8S_DIR/05-auth.yaml" --ignore-not-found=true
    
    log_info "Removendo Backstage Server..."
    kubectl delete -f "$K8S_DIR/04-server.yaml" --ignore-not-found=true
    
    log_info "Removendo PostgreSQL..."
    kubectl delete -f "$K8S_DIR/03-postgres.yaml" --ignore-not-found=true
    
    log_info "Removendo Secrets..."
    kubectl delete -f "$K8S_DIR/02-secrets.yaml" --ignore-not-found=true
    
    log_info "Removendo ConfigMaps..."
    kubectl delete -f "$K8S_DIR/01-configmap.yaml" --ignore-not-found=true
    
    log_success "Recursos removidos"
}

# Função para remover PVCs persistentes
cleanup_storage() {
    log_warning "Removendo dados persistentes..."
    kubectl delete pvc --all -n $NAMESPACE --ignore-not-found=true
    kubectl delete pv --all --ignore-not-found=true
    log_warning "Dados persistentes removidos (não pode ser desfeito!)"
}

# Função para remover namespace
cleanup_namespace() {
    log_info "Removendo namespace $NAMESPACE..."
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    log_success "Namespace removido"
}

# Função para limpar /etc/hosts
cleanup_hosts() {
    log_info "Removendo entrada backstage.local do /etc/hosts..."
    sudo sed -i '/backstage.local/d' /etc/hosts
    log_success "Entrada do /etc/hosts removida"
}

# Menu principal
show_menu() {
    echo ""
    echo "🧹 Backstage Cleanup Script"
    echo "============================"
    echo "1. Cleanup completo (recursos + dados + namespace)"
    echo "2. Apenas remover recursos (manter dados)"
    echo "3. Apenas remover dados persistentes"
    echo "4. Apenas remover namespace"
    echo "5. Limpar /etc/hosts"
    echo "6. Verificar status atual"
    echo "7. Sair"
    echo ""
    read -p "Escolha uma opção (1-7): " choice
    
    case $choice in
        1)
            log_warning "⚠️  ATENÇÃO: Isso removerá TODOS os dados e recursos!"
            read -p "Tem certeza? Digite 'yes' para confirmar: " confirm
            if [ "$confirm" = "yes" ]; then
                cleanup_resources
                cleanup_storage
                cleanup_namespace
                cleanup_hosts
                log_success "Cleanup completo realizado"
            else
                log_info "Operação cancelada"
            fi
            ;;
        2)
            cleanup_resources
            ;;
        3)
            log_warning "⚠️  ATENÇÃO: Isso removerá TODOS os dados!"
            read -p "Tem certeza? Digite 'yes' para confirmar: " confirm
            if [ "$confirm" = "yes" ]; then
                cleanup_storage
            else
                log_info "Operação cancelada"
            fi
            ;;
        4)
            cleanup_namespace
            ;;
        5)
            cleanup_hosts
            ;;
        6)
            show_status
            ;;
        7)
            log_info "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida!"
            show_menu
            ;;
    esac
}

# Função para mostrar status
show_status() {
    echo ""
    echo "📊 Status Atual:"
    echo "================"
    
    # Verificar se namespace existe
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        log_info "Namespace '$NAMESPACE' existe"
        
        echo ""
        echo "📦 Pods:"
        kubectl get pods -n $NAMESPACE
        
        echo ""
        echo "🔗 Services:"
        kubectl get svc -n $NAMESPACE
        
        echo ""
        echo "🚀 Deployments:"
        kubectl get deployments -n $NAMESPACE
        
        echo ""
        echo "💾 PVCs:"
        kubectl get pvc -n $NAMESPACE
        
    else
        log_info "Namespace '$NAMESPACE' não existe"
    fi
    
    echo ""
    echo "🌐 /etc/hosts:"
    grep backstage.local /etc/hosts || log_info "Nenhuma entrada backstage.local encontrada"
}

# Verificar argumentos de linha de comando
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        "all")
            log_warning "Executando cleanup completo..."
            cleanup_resources
            cleanup_storage
            cleanup_namespace
            cleanup_hosts
            ;;
        "resources")
            cleanup_resources
            ;;
        "storage")
            cleanup_storage
            ;;
        "namespace")
            cleanup_namespace
            ;;
        "hosts")
            cleanup_hosts
            ;;
        "status")
            show_status
            ;;
        *)
            log_error "Uso: $0 [all|resources|storage|namespace|hosts|status]"
            exit 1
            ;;
    esac
fi