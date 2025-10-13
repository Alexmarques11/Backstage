# Docker Hub Multi-User Configuration

Este projeto suporta múltiplas contas Docker Hub para diferentes desenvolvedores.

## 📦 Contas Docker Hub Disponíveis

### Contas Configuradas no GitHub Secrets:
- **`alexmarques11`** (padrão) - Conta principal do projeto
- **`goncalocruz`** - Conta do Gonçalo  
- **`zeaccount`** - Conta do ZE

## 🔄 Como Alternar Entre Contas

### 1. GitHub Actions Workflow

Para alterar a conta no `.github/workflows/docker-deploy.yml`:

```yaml
# Método 1: Alterar as variáveis de ambiente (recomendado)
env:
  # Descomente a conta desejada:
  SERVER_IMAGE: ${{ secrets.DOCKER_USERNAME }}/backstage-server        # alexmarques11
  # SERVER_IMAGE: ${{ secrets.DOCKER_USERNAME_GONCALO }}/backstage-server  # goncalocruz  
  # SERVER_IMAGE: ${{ secrets.DOCKER_USERNAME_ZE }}/backstage-server       # zeaccount

  AUTH_IMAGE: ${{ secrets.DOCKER_USERNAME }}/backstage-auth          # alexmarques11
  # AUTH_IMAGE: ${{ secrets.DOCKER_USERNAME_GONCALO }}/backstage-auth    # goncalocruz
  # AUTH_IMAGE: ${{ secrets.DOCKER_USERNAME_ZE }}/backstage-auth         # zeaccount
```

E nas seções de login:

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    # Descomente a conta desejada:
    username: ${{ secrets.DOCKER_USERNAME }}        # alexmarques11
    password: ${{ secrets.DOCKER_PASSWORD }}
    
    # username: ${{ secrets.DOCKER_USERNAME_GONCALO }}  # goncalocruz
    # password: ${{ secrets.DOCKER_PASSWORD_GONCALO }}
    
    # username: ${{ secrets.DOCKER_USERNAME_ZE }}       # zeaccount  
    # password: ${{ secrets.DOCKER_PASSWORD_ZE }}
```

### 2. Deployment Local com Script

```bash
# Usar conta padrão (alexmarques11)
./deploy-prod.sh

# Usar conta do Gonçalo
./deploy-prod.sh goncalocruz

# Usar conta do ZE  
./deploy-prod.sh zeaccount

# Usar conta personalizada
./deploy-prod.sh minha_conta_docker
```

### 3. Docker Compose Produção

```bash
# Usar conta padrão
docker-compose -f docker-compose.prod.yaml up -d

# Especificar conta via variável de ambiente
DOCKER_USERNAME=goncalocruz docker-compose -f docker-compose.prod.yaml up -d
DOCKER_USERNAME=zeaccount docker-compose -f docker-compose.prod.yaml up -d
```

### 4. Variável de Ambiente

Criar um arquivo `.env.prod.local`:

```bash
# Para conta do Gonçalo
DOCKER_USERNAME=goncalocruz

# Para conta do ZE
DOCKER_USERNAME=zeaccount
```

Usar com Docker Compose:
```bash
docker-compose -f docker-compose.prod.yaml --env-file .env.prod.local up -d
```

## 🔐 Secrets do GitHub

### Secrets Configurados:

| Secret Name | Descrição | Conta |
|-------------|-----------|-------|
| `DOCKER_USERNAME` | Username principal | alexmarques11 |
| `DOCKER_PASSWORD` | Password principal | alexmarques11 |
| `DOCKER_USERNAME_GONCALO` | Username do Gonçalo | goncalocruz |
| `DOCKER_PASSWORD_GONCALO` | Password do Gonçalo | goncalocruz |
| `DOCKER_USERNAME_ZE` | Username do ZE | zeaccount |
| `DOCKER_PASSWORD_ZE` | Password do ZE | zeaccount |

### Para Adicionar Nova Conta:

1. Adicionar os secrets no GitHub:
   - `DOCKER_USERNAME_[NOME]`
   - `DOCKER_PASSWORD_[NOME]`

2. Atualizar o workflow com as novas opções comentadas

3. Atualizar este arquivo de documentação

## 📋 Imagens Resultantes

Cada conta gerará suas próprias imagens:

### alexmarques11 (padrão):
- `alexmarques11/backstage-server:latest`
- `alexmarques11/backstage-auth:latest`

### goncalocruz:
- `goncalocruz/backstage-server:latest`  
- `goncalocruz/backstage-auth:latest`

### zeaccount:
- `zeaccount/backstage-server:latest`
- `zeaccount/backstage-auth:latest`

## 🚨 Notas Importantes

1. **Sincronização**: Todas as contas devem ter as mesmas versões das imagens para evitar inconsistências

2. **Permissions**: Cada desenvolvedor deve ter acesso push à sua própria conta Docker Hub

3. **Default**: A conta `alexmarques11` é sempre a padrão para produção

4. **Testing**: Sempre testar localmente antes de fazer push para produção

5. **Security**: Nunca commitar credenciais Docker no repositório - sempre usar GitHub Secrets