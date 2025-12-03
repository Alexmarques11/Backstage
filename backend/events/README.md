# Microserviço de Eventos e Concertos

Microserviço responsável por agregar e gerir informações sobre eventos e concertos através da integração com a API do Ticketmaster.

## Funcionalidades

- Integração com API do Ticketmaster para obter eventos musicais
- Normalização e armazenamento local de dados de concertos
- Pesquisa e filtragem de concertos por diversos critérios
- Sincronização automática e manual com fontes externas

## Endpoints Disponíveis

### Listar Concertos
```
GET /concerts
Query Parameters:
  - artist: Filtrar por nome do artista
  - location: Filtrar por localização
  - sync: true para sincronizar com Ticketmaster antes de retornar
```

### Obter Concerto por ID
```
GET /concerts/:id
```

### Pesquisar Concertos
```
GET /concerts/search?q=termo
Query Parameters:
  - q: Termo de pesquisa (obrigatório)
  - sync: true para sincronizar com Ticketmaster antes de retornar
```

### Concertos por Artista
```
GET /concerts/by-artist/:artistName
Query Parameters:
  - sync: true para sincronizar com Ticketmaster antes de retornar
```

### Concertos por Localização
```
GET /concerts/by-location?location=nome
Query Parameters:
  - location: Nome da localização (obrigatório)
  - sync: true para sincronizar com Ticketmaster antes de retornar
```

### Concertos por Género
```
GET /concerts/by-genre/:genre
Query Parameters:
  - sync: true para sincronizar com Ticketmaster antes de retornar
```

### Sincronizar Concertos
```
POST /concerts/sync
Body (JSON):
{
  "keyword": "nome do artista ou evento",
  "city": "cidade",
  "countryCode": "PT",
  "size": 20
}
```

## Configuração

### Variáveis de Ambiente (.env)

```env
# Configuração da Base de Dados
EVENTS_DB_USER=user123
EVENTS_DB_PASSWORD=123456
EVENTS_DB_HOST=localhost
EVENTS_DB_NAME=events_db
EVENTS_DB_PORT=5436

# Ticketmaster API
TICKETMASTER_API_KEY=your_ticketmaster_api_key_here

# Servidor
PORT=3001
```

### Obter API Key do Ticketmaster

1. Aceda a https://developer.ticketmaster.com/
2. Crie uma conta
3. Crie uma aplicação
4. Copie a API Key e adicione ao ficheiro `.env`

## Instalação

```bash
npm install
```

## Executar

### Modo Produção
```bash
npm start
```

### Modo Desenvolvimento (com nodemon)
```bash
npm run dev
```

## Estrutura do Projeto

```
events/
├── controllers/          # Controladores (lógica de negócio)
│   └── concertsController.js
├── db/                   # Configuração da base de dados
│   ├── concertsDb.js
│   └── schema.sql
├── model/                # Modelos de dados
│   └── concertsModel.js
├── routes/               # Definição de rotas
│   └── concertsRoutes.js
├── service/              # Serviços externos
│   └── ticketMasterService.js
├── .env                  # Variáveis de ambiente
├── concertsServer.js     # Servidor principal
└── package.json
```

## Arquitetura MVC

- **Model** (`model/concertsModel.js`): Interação com a base de dados
- **View**: Respostas JSON (API RESTful)
- **Controller** (`controllers/concertsController.js`): Lógica de negócio e orquestração
- **Service** (`service/ticketMasterService.js`): Integração com API externa

## Base de Dados

### Tabelas

#### concerts
- `id`: Identificador único
- `title`: Nome do concerto/artista
- `datetime`: Data e hora do evento
- `tickets_available`: Disponibilidade de bilhetes
- `purchase_url`: Link para compra
- `location_id`: Referência à localização

#### locations
- `id`: Identificador único
- `name`: Nome do local
- `address`: Endereço
- `geo_location`: Coordenadas geográficas

#### concerts_genres
- `concert_id`: Referência ao concerto
- `genre_id`: Referência ao género (tabela no microserviço de autenticação)

## Integração com Outros Microserviços

### Microserviço de Autenticação
- Tabela `music_genres` partilhada para classificação de concertos
- Futura integração para mapear géneros do Ticketmaster para IDs internos

## Exemplos de Uso

### Listar todos os concertos
```bash
curl http://localhost:3001/concerts
```

### Pesquisar por artista
```bash
curl http://localhost:3001/concerts/by-artist/Coldplay
```

### Sincronizar com Ticketmaster e pesquisar
```bash
curl http://localhost:3001/concerts/search?q=rock&sync=true
```

### Sincronização manual
```bash
curl -X POST http://localhost:3001/concerts/sync \
  -H "Content-Type: application/json" \
  -d '{"keyword": "Taylor Swift", "countryCode": "PT"}'
```

## Notas de Desenvolvimento

- A tabela `music_genres` reside no microserviço de autenticação
- A integração completa com géneros será implementada quando a comunicação entre microserviços estiver configurada
- O servidor suporta sincronização automática (parâmetro `sync=true`) ou manual (endpoint `/sync`)
- Sem API Key do Ticketmaster, o serviço retorna arrays vazios mas continua funcional com dados locais
