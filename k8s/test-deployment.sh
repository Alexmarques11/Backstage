#!/bin/bash

# Script de Teste Completo - Backstage Kubernetes
# Usage: ./test-deployment.sh

set -e

NAMESPACE="backstage"
TIMEOUT=300

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
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[🧪 TEST]${NC} $1"
}

# Função para testar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Teste 1: Verificar pré-requisitos
test_prerequisites() {
    log_test "Testando pré-requisitos..."
    
    local errors=0
    
    if command_exists minikube; then
        log_success "Minikube instalado"
    else
        log_error "Minikube não encontrado"
        ((errors++))
    fi
    
    if command_exists kubectl; then
        log_success "kubectl instalado"
    else
        log_error "kubectl não encontrado"
        ((errors++))
    fi
    
    if command_exists docker; then
        log_success "Docker instalado"
    else
        log_error "Docker não encontrado"
        ((errors++))
    fi
    
    # Verificar se minikube está rodando
    if minikube status | grep -q "Running"; then
        log_success "Minikube está rodando"
    else
        log_error "Minikube não está rodando"
        ((errors++))
    fi
    
    return $errors
}

# Teste 2: Verificar namespace e recursos
test_namespace_and_resources() {
    log_test "Testando namespace e recursos..."
    
    local errors=0
    
    # Verificar namespace
    if kubectl get namespace $NAMESPACE &>/dev/null; then
        log_success "Namespace '$NAMESPACE' existe"
    else
        log_error "Namespace '$NAMESPACE' não encontrado"
        ((errors++))
    fi
    
    # Verificar deployments
    local deployments=("postgres" "backstage-server" "backstage-auth")
    for deployment in "${deployments[@]}"; do
        if kubectl get deployment $deployment -n $NAMESPACE &>/dev/null; then
            # Verificar se deployment está pronto
            local ready=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
            local desired=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.spec.replicas}')
            
            if [ "$ready" = "$desired" ] && [ "$ready" != "" ]; then
                log_success "Deployment '$deployment' está pronto ($ready/$desired)"
            else
                log_warning "Deployment '$deployment' não está completamente pronto ($ready/$desired)"
            fi
        else
            log_error "Deployment '$deployment' não encontrado"
            ((errors++))
        fi
    done
    
    # Verificar services
    local services=("postgres-service" "backstage-server-service" "backstage-auth-service")
    for service in "${services[@]}"; do
        if kubectl get service $service -n $NAMESPACE &>/dev/null; then
            log_success "Service '$service' existe"
        else
            log_error "Service '$service' não encontrado"
            ((errors++))
        fi
    done
    
    return $errors
}

# Teste 3: Verificar pods
test_pods() {
    log_test "Testando status dos pods..."
    
    local errors=0
    
    # Listar todos os pods
    log_info "Status dos pods:"
    kubectl get pods -n $NAMESPACE
    
    # Verificar se todos os pods estão Running
    local pods=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
    
    for pod in $pods; do
        local status=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.phase}')
        local ready=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
        
        if [ "$status" = "Running" ] && [ "$ready" = "True" ]; then
            log_success "Pod '$pod' está Running e Ready"
        else
            log_error "Pod '$pod' tem problemas: Status=$status, Ready=$ready"
            ((errors++))
            
            # Mostrar logs do pod com problemas
            log_info "Últimas linhas do log do pod '$pod':"
            kubectl logs $pod -n $NAMESPACE --tail=5 || true
        fi
    done
    
    return $errors
}

# Teste 4: Verificar conectividade de rede
test_network_connectivity() {
    log_test "Testando conectividade de rede..."
    
    local errors=0
    
    # Obter IP do Minikube
    local minikube_ip
    minikube_ip=$(minikube ip 2>/dev/null || echo "localhost")
    
    log_info "IP do Minikube: $minikube_ip"
    
    # Testar NodePort services
    local nodeports=("30300:backstage-server" "30400:backstage-auth" "30432:postgres")
    
    for nodeport_info in "${nodeports[@]}"; do
        local port="${nodeport_info%%:*}"
        local service="${nodeport_info##*:}"
        
        if nc -z $minikube_ip $port 2>/dev/null; then
            log_success "Porta $port ($service) está acessível"
        else
            log_error "Porta $port ($service) não está acessível"
            ((errors++))
        fi
    done
    
    # Testar ingress (se /etc/hosts estiver configurado)
    if grep -q "backstage.local" /etc/hosts; then
        log_info "Testando acesso via Ingress..."
        if nc -z backstage.local 80 2>/dev/null; then
            log_success "Ingress está acessível"
        else
            log_warning "Ingress pode não estar acessível via backstage.local"
        fi
    else
        log_warning "/etc/hosts não configurado para backstage.local"
    fi
    
    return $errors
}

# Teste 5: Verificar endpoints HTTP
test_http_endpoints() {
    log_test "Testando endpoints HTTP..."
    
    local errors=0
    local minikube_ip
    minikube_ip=$(minikube ip 2>/dev/null || echo "localhost")
    
    # Testar endpoint de setup do servidor principal
    log_info "Testando endpoint /setup do servidor principal..."
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$minikube_ip:30300/setup" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        log_success "Endpoint /setup responde corretamente (HTTP $response_code)"
    else
        log_error "Endpoint /setup falhou (HTTP $response_code)"
        ((errors++))
    fi
    
    # Testar endpoint do auth server
    log_info "Testando endpoint /auth/token do auth server..."
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$minikube_ip:30400/auth/token" -X POST -H "Content-Type: application/json" -d '{}' || echo "000")
    
    if [ "$response_code" = "401" ] || [ "$response_code" = "400" ]; then
        log_success "Endpoint /auth/token responde corretamente (HTTP $response_code - esperado)"
    else
        log_error "Endpoint /auth/token resposta inesperada (HTTP $response_code)"
        ((errors++))
    fi
    
    # Testar via ingress se disponível
    if grep -q "backstage.local" /etc/hosts; then
        log_info "Testando via Ingress..."
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://backstage.local/setup" || echo "000")
        
        if [ "$response_code" = "200" ]; then
            log_success "Ingress /setup responde corretamente (HTTP $response_code)"
        else
            log_warning "Ingress /setup falhou (HTTP $response_code)"
        fi
    fi
    
    return $errors
}

# Teste 6: Verificar banco de dados
test_database() {
    log_test "Testando banco de dados..."
    
    local errors=0
    
    # Verificar se conseguimos conectar no PostgreSQL
    log_info "Testando conexão com PostgreSQL..."
    
    local pg_pod
    pg_pod=$(kubectl get pods -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [ -n "$pg_pod" ]; then
        # Testar conexão com o banco
        if kubectl exec $pg_pod -n $NAMESPACE -- psql -U user123 -d backstage -c "SELECT version();" &>/dev/null; then
            log_success "Conexão com PostgreSQL OK"
            
            # Testar se tabela users existe
            if kubectl exec $pg_pod -n $NAMESPACE -- psql -U user123 -d backstage -c "SELECT COUNT(*) FROM users;" &>/dev/null; then
                log_success "Tabela 'users' existe e é acessível"
            else
                log_warning "Tabela 'users' não existe ainda (execute curl http://$minikube_ip:30300/setup)"
            fi
        else
            log_error "Não foi possível conectar ao PostgreSQL"
            ((errors++))
        fi
    else
        log_error "Pod do PostgreSQL não encontrado"
        ((errors++))
    fi
    
    return $errors
}

# Teste 7: Verificar recursos e performance
test_resources() {
    log_test "Testando recursos e performance..."
    
    log_info "Uso de recursos dos pods:"
    
    # Verificar se metrics-server está disponível
    if kubectl get pods -n kube-system | grep -q metrics-server; then
        # Aguardar um momento para métricas estarem disponíveis
        sleep 5
        
        log_info "Métricas de CPU e Memória:"
        kubectl top pods -n $NAMESPACE 2>/dev/null || log_warning "Métricas não disponíveis ainda"
    else
        log_warning "Metrics-server não está instalado"
    fi
    
    # Verificar eventos recentes
    log_info "Eventos recentes no namespace:"
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -5
    
    return 0
}

# Função principal de teste
run_all_tests() {
    local total_errors=0
    
    echo ""
    echo "🧪 Iniciando Testes Completos do Deployment Backstage"
    echo "====================================================="
    
    # Executar todos os testes
    test_prerequisites || ((total_errors+=$?))
    echo ""
    
    test_namespace_and_resources || ((total_errors+=$?))
    echo ""
    
    test_pods || ((total_errors+=$?))
    echo ""
    
    test_network_connectivity || ((total_errors+=$?))
    echo ""
    
    test_http_endpoints || ((total_errors+=$?))
    echo ""
    
    test_database || ((total_errors+=$?))
    echo ""
    
    test_resources || ((total_errors+=$?))
    echo ""
    
    # Resultado final
    echo "📋 Resumo dos Testes"
    echo "===================="
    
    if [ $total_errors -eq 0 ]; then
        log_success "Todos os testes passaram! 🎉"
        echo ""
        echo "✅ Seu deployment do Backstage está funcionando corretamente!"
        echo ""
        echo "🌐 Acesse a aplicação em:"
        local minikube_ip
        minikube_ip=$(minikube ip 2>/dev/null || echo "localhost")
        echo "   • Backstage Server: http://$minikube_ip:30300"
        echo "   • Auth Server: http://$minikube_ip:30400"
        if grep -q "backstage.local" /etc/hosts; then
            echo "   • Via Ingress: http://backstage.local"
        fi
        echo ""
        echo "🗄️  Para inicializar o banco de dados:"
        echo "   curl http://$minikube_ip:30300/setup"
        echo ""
    else
        log_error "$total_errors erro(s) encontrado(s)"
        echo ""
        echo "🔧 Comandos para diagnóstico:"
        echo "   ./monitor.sh status"
        echo "   ./monitor.sh logs all"
        echo "   kubectl get events -n $NAMESPACE"
        echo ""
        return 1
    fi
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [test_name]"
    echo ""
    echo "Testes disponíveis:"
    echo "  prerequisites    - Verificar pré-requisitos"
    echo "  resources       - Verificar namespace e recursos"
    echo "  pods           - Verificar status dos pods"
    echo "  network        - Verificar conectividade de rede"
    echo "  http           - Verificar endpoints HTTP"
    echo "  database       - Verificar banco de dados"
    echo "  performance    - Verificar recursos e performance"
    echo "  all (padrão)   - Executar todos os testes"
    exit 0
fi

# Executar teste específico ou todos
case "${1:-all}" in
    "prerequisites")
        test_prerequisites
        ;;
    "resources")
        test_namespace_and_resources
        ;;
    "pods")
        test_pods
        ;;
    "network")
        test_network_connectivity
        ;;
    "http")
        test_http_endpoints
        ;;
    "database")
        test_database
        ;;
    "performance")
        test_resources
        ;;
    "all")
        run_all_tests
        ;;
    *)
        log_error "Teste desconhecido: $1"
        echo "Use '$0 --help' para ver testes disponíveis"
        exit 1
        ;;
esac