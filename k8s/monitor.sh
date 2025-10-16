#!/bin/bash

# Script de Monitoramento e Logs - Backstage Application
# Usage: ./monitor.sh [service] [action]

set -e

# Configurações
NAMESPACE="backstage"

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

# Função para mostrar logs de um serviço
show_logs() {
    local service=$1
    local follow=${2:-false}
    
    case $service in
        "server"|"api")
            if [ "$follow" = "true" ]; then
                log_info "Seguindo logs do Backstage Server (Ctrl+C para sair)..."
                kubectl logs -f deployment/backstage-server -n $NAMESPACE
            else
                log_info "Logs do Backstage Server (últimas 100 linhas)..."
                kubectl logs deployment/backstage-server -n $NAMESPACE --tail=100
            fi
            ;;
        "auth")
            if [ "$follow" = "true" ]; then
                log_info "Seguindo logs do Auth Server (Ctrl+C para sair)..."
                kubectl logs -f deployment/backstage-auth -n $NAMESPACE
            else
                log_info "Logs do Auth Server (últimas 100 linhas)..."
                kubectl logs deployment/backstage-auth -n $NAMESPACE --tail=100
            fi
            ;;
        "postgres"|"db")
            if [ "$follow" = "true" ]; then
                log_info "Seguindo logs do PostgreSQL (Ctrl+C para sair)..."
                kubectl logs -f deployment/postgres -n $NAMESPACE
            else
                log_info "Logs do PostgreSQL (últimas 100 linhas)..."
                kubectl logs deployment/postgres -n $NAMESPACE --tail=100
            fi
            ;;
        "all")
            log_info "Logs de todos os serviços (últimas 50 linhas cada)..."
            echo ""
            echo "=== BACKSTAGE SERVER ==="
            kubectl logs deployment/backstage-server -n $NAMESPACE --tail=50
            echo ""
            echo "=== AUTH SERVER ==="
            kubectl logs deployment/backstage-auth -n $NAMESPACE --tail=50
            echo ""
            echo "=== POSTGRESQL ==="
            kubectl logs deployment/postgres -n $NAMESPACE --tail=50
            ;;
        *)
            log_error "Serviço inválido. Use: server|auth|postgres|all"
            ;;
    esac
}

# Função para mostrar status dos recursos
show_status() {
    echo ""
    echo "📊 Status dos Recursos Backstage"
    echo "=================================="
    
    # Verificar se namespace existe
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        log_error "Namespace '$NAMESPACE' não encontrado!"
        return 1
    fi
    
    echo ""
    echo "🚀 Deployments:"
    kubectl get deployments -n $NAMESPACE -o wide
    
    echo ""
    echo "📦 Pods:"
    kubectl get pods -n $NAMESPACE -o wide
    
    echo ""
    echo "🔗 Services:"
    kubectl get svc -n $NAMESPACE -o wide
    
    echo ""
    echo "🌐 Ingress:"
    kubectl get ingress -n $NAMESPACE -o wide
    
    echo ""
    echo "💾 PersistentVolumeClaims:"
    kubectl get pvc -n $NAMESPACE
    
    echo ""
    echo "🔐 Secrets:"
    kubectl get secrets -n $NAMESPACE
    
    echo ""
    echo "⚙️  ConfigMaps:"
    kubectl get configmaps -n $NAMESPACE
}

# Função para mostrar eventos
show_events() {
    log_info "Eventos recentes do namespace $NAMESPACE:"
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' --field-selector type!=Normal
}

# Função para teste de conectividade
test_connectivity() {
    log_info "Testando conectividade dos serviços..."
    
    # Obter IP do Minikube
    MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "localhost")
    
    echo ""
    echo "🔍 Testando endpoints:"
    
    # Teste via NodePort
    echo "   • Backstage Server (NodePort):"
    if curl -s -o /dev/null -w "%{http_code}" "http://$MINIKUBE_IP:30300/setup" | grep -q "200"; then
        echo "     ✅ http://$MINIKUBE_IP:30300 - OK"
    else
        echo "     ❌ http://$MINIKUBE_IP:30300 - FAIL"
    fi
    
    echo "   • Auth Server (NodePort):"
    if curl -s -o /dev/null -w "%{http_code}" "http://$MINIKUBE_IP:30400/auth/token" | grep -q "401\|400"; then
        echo "     ✅ http://$MINIKUBE_IP:30400/auth - OK"
    else
        echo "     ❌ http://$MINIKUBE_IP:30400/auth - FAIL"
    fi
    
    # Teste via Ingress (se existir)
    if grep -q "backstage.local" /etc/hosts; then
        echo "   • Backstage via Ingress:"
        if curl -s -o /dev/null -w "%{http_code}" "http://backstage.local/setup" | grep -q "200"; then
            echo "     ✅ http://backstage.local - OK"
        else
            echo "     ❌ http://backstage.local - FAIL"
        fi
    fi
}

# Função para restart de serviços
restart_service() {
    local service=$1
    
    case $service in
        "server"|"api")
            log_info "Reiniciando Backstage Server..."
            kubectl rollout restart deployment/backstage-server -n $NAMESPACE
            kubectl rollout status deployment/backstage-server -n $NAMESPACE
            ;;
        "auth")
            log_info "Reiniciando Auth Server..."
            kubectl rollout restart deployment/backstage-auth -n $NAMESPACE
            kubectl rollout status deployment/backstage-auth -n $NAMESPACE
            ;;
        "postgres"|"db")
            log_warning "Reiniciando PostgreSQL (pode causar perda temporária de dados)..."
            read -p "Tem certeza? (y/N): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                kubectl rollout restart deployment/postgres -n $NAMESPACE
                kubectl rollout status deployment/postgres -n $NAMESPACE
            else
                log_info "Operação cancelada"
            fi
            ;;
        "all")
            log_info "Reiniciando todos os serviços..."
            kubectl rollout restart deployment/postgres -n $NAMESPACE
            kubectl rollout restart deployment/backstage-server -n $NAMESPACE
            kubectl rollout restart deployment/backstage-auth -n $NAMESPACE
            
            log_info "Aguardando deployments ficarem prontos..."
            kubectl rollout status deployment/postgres -n $NAMESPACE
            kubectl rollout status deployment/backstage-server -n $NAMESPACE
            kubectl rollout status deployment/backstage-auth -n $NAMESPACE
            ;;
        *)
            log_error "Serviço inválido. Use: server|auth|postgres|all"
            ;;
    esac
}

# Função para abrir shell em um pod
shell_into_pod() {
    local service=$1
    
    case $service in
        "server"|"api")
            local pod=$(kubectl get pods -n $NAMESPACE -l app=backstage-server -o jsonpath='{.items[0].metadata.name}')
            if [ ! -z "$pod" ]; then
                log_info "Abrindo shell no pod $pod..."
                kubectl exec -it $pod -n $NAMESPACE -- /bin/sh
            else
                log_error "Nenhum pod do Backstage Server encontrado"
            fi
            ;;
        "auth")
            local pod=$(kubectl get pods -n $NAMESPACE -l app=backstage-auth -o jsonpath='{.items[0].metadata.name}')
            if [ ! -z "$pod" ]; then
                log_info "Abrindo shell no pod $pod..."
                kubectl exec -it $pod -n $NAMESPACE -- /bin/sh
            else
                log_error "Nenhum pod do Auth Server encontrado"
            fi
            ;;
        "postgres"|"db")
            local pod=$(kubectl get pods -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')
            if [ ! -z "$pod" ]; then
                log_info "Abrindo shell no pod PostgreSQL $pod..."
                kubectl exec -it $pod -n $NAMESPACE -- /bin/bash
            else
                log_error "Nenhum pod do PostgreSQL encontrado"
            fi
            ;;
        *)
            log_error "Serviço inválido. Use: server|auth|postgres"
            ;;
    esac
}

# Menu principal
show_menu() {
    echo ""
    echo "📊 Backstage Monitor & Logs"
    echo "============================"
    echo "1. Ver status completo"
    echo "2. Ver logs (server)"
    echo "3. Ver logs (auth)"
    echo "4. Ver logs (postgres)"
    echo "5. Ver logs (todos)"
    echo "6. Seguir logs em tempo real"
    echo "7. Ver eventos"
    echo "8. Testar conectividade"
    echo "9. Reiniciar serviços"
    echo "10. Abrir shell em pod"
    echo "11. Dashboard do Minikube"
    echo "12. Sair"
    echo ""
    read -p "Escolha uma opção (1-12): " choice
    
    case $choice in
        1)
            show_status
            ;;
        2)
            show_logs "server"
            ;;
        3)
            show_logs "auth"
            ;;
        4)
            show_logs "postgres"
            ;;
        5)
            show_logs "all"
            ;;
        6)
            echo "Qual serviço? (server/auth/postgres):"
            read service
            show_logs "$service" "true"
            ;;
        7)
            show_events
            ;;
        8)
            test_connectivity
            ;;
        9)
            echo "Qual serviço reiniciar? (server/auth/postgres/all):"
            read service
            restart_service "$service"
            ;;
        10)
            echo "Qual pod acessar? (server/auth/postgres):"
            read service
            shell_into_pod "$service"
            ;;
        11)
            log_info "Abrindo Minikube Dashboard..."
            minikube dashboard
            ;;
        12)
            log_info "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida!"
            show_menu
            ;;
    esac
}

# Processar argumentos de linha de comando
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-all}" "${3:-false}"
            ;;
        "events")
            show_events
            ;;
        "test")
            test_connectivity
            ;;
        "restart")
            restart_service "${2:-all}"
            ;;
        "shell")
            shell_into_pod "${2:-server}"
            ;;
        "dashboard")
            minikube dashboard
            ;;
        *)
            log_error "Uso: $0 [status|logs|events|test|restart|shell|dashboard]"
            exit 1
            ;;
    esac
fi