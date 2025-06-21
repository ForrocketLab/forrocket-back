# 🚀 RPE - Rocket Performance and Engagement

**RPE (Rocket Performance and Engagement)** - Sistema completo de avaliações de desempenho com gestão automatizada de ciclos, deadlines inteligentes e equalização por comitê.

## ✨ **Funcionalidades Principais**

- 🎯 **Gestão de Ciclos de Avaliação** com ativação automatizada e validação de deadlines
- 📊 **Monitoramento de Prazos** em tempo real com status (OK, URGENT, OVERDUE)
- 🔄 **Avaliações 360°** completas (autoavaliação, peer review, gestor, mentoring)
- ⚖️ **Equalização por Comitê** com workflow estruturado
- 🔐 **Sistema de Autenticação** robusto com JWT e roles
- 📈 **Dashboard de Status** com informações detalhadas de progresso
- 🧪 **Testes Automatizados** com limpeza inteligente de dados

## 🚀 **Como rodar a aplicação**

### **Pré-requisitos**
- Node.js (versão 18+)
- pnpm (gerenciador de pacotes)

### **1. Instalar dependências**
```bash
pnpm install
```

### **2. Configurar banco de dados**
```bash
# Gera o cliente Prisma
pnpm prisma generate

# Aplica as migrations no banco SQLite
pnpm prisma db push

# Popula o banco com usuários de teste
pnpm prisma db seed
```

### **3. Iniciar a aplicação**
```bash
# Desenvolvimento (com hot-reload)
pnpm run start:dev
```

### **4. Acessar a aplicação**
- **API Base**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api-docs

## 🌱 **Dados de Seed Gerados**

O comando `pnpm prisma db seed` popula o banco com dados completos para teste:

### **🏢 Estrutura Organizacional**
```
👑 Carla Dias (Head of Engineering)
├── 👨‍💼 Bruno Mendes (Tech Lead)
│   ├── 👩‍💻 Ana Oliveira (Dev Frontend)
│   └── 👨‍💻 Felipe Silva (Dev Backend)
└── 👩‍💼 Diana Costa (People & Culture)

🔧 Eduardo Tech (Admin - Independente)
```

### **👥 Usuários Disponíveis para Teste**

| Email | Senha | Nome | Roles | Cargo |
|-------|-------|------|-------|-------|
| `ana.oliveira@rocketcorp.com` | `password123` | Ana Oliveira | Colaboradora | Desenvolvedora Frontend Pleno |
| `bruno.mendes@rocketcorp.com` | `password123` | Bruno Mendes | Gestor + Colaborador | Tech Lead Sênior |
| `carla.dias@rocketcorp.com` | `password123` | Carla Dias | Comitê + Colaboradora | Head of Engineering Principal |
| `diana.costa@rocketcorp.com` | `password123` | Diana Costa | RH + Colaboradora | People & Culture Manager Sênior |
| `felipe.silva@rocketcorp.com` | `password123` | Felipe Silva | Colaborador | Desenvolvedor Backend Júnior |
| `eduardo.tech@rocketcorp.com` | `password123` | Eduardo Tech | Admin | DevOps Engineer Sênior |

### **🔄 Estado dos Ciclos de Avaliação**

| Ciclo | Status | Fase | Período | Deadline Atual |
|-------|--------|------|---------|----------------|
| **2024.2** | 🔴 CLOSED | ⚖️ EQUALIZATION | 2024-07-01 a 2024-12-31 | Finalizado |
| **2025.1** | 🟢 OPEN | ⚖️ EQUALIZATION | 2025-01-01 a 2025-06-30 | até 31/05/2025 |
| **2025.2** | 🟡 UPCOMING | 📝 ASSESSMENTS | 2025-07-01 a 2025-12-31 | Configurado |

### **📋 Cronograma de Fases (Ciclo 2025.1)**

- **📝 Fase 1 - Avaliações**: até 15/03/2025 ✅ *Completa*
- **👔 Fase 2 - Gestores**: até 15/04/2025 ✅ *Completa*  
- **⚖️ Fase 3 - Equalização**: até 31/05/2025 🔄 *Em Andamento*

### **✅ Status das Avaliações (Ciclo 2025.1)**

- **📝 Autoavaliações**: Ana, Bruno, Felipe (3/3) ✅
- **🔄 Avaliações 360°**: Todas as combinações (6/6) ✅
- **🎓 Mentoring**: Felipe → Ana (1/1) ✅
- **💭 Reference Feedbacks**: Todos os pares (6/6) ✅
- **👔 Avaliações de Gestor**: Bruno → Ana, Felipe (2/2) ✅
- **⚖️ Equalização**: Aguardando Carla (Comitê) 🔄

## 🧪 **Executar Testes**

```bash
# Todos os testes
pnpm test

# Apenas testes unitários
pnpm run test:unit

# Apenas testes E2E (integração)
pnpm run test:e2e

# Testes com relatório de cobertura
pnpm run test:cov

# Testes em modo watch (desenvolvimento)
pnpm run test:watch

# Limpeza pós-teste (remove dados de teste)
pnpm test:cleanup

# Verificar estado do banco
pnpm db:check
```

### **🧪 Sistema de Testes Avançado**

O RPE possui um sistema robusto de testes com limpeza automática:

- **✅ 99 Testes E2E** passando com 79.19% de cobertura
- **🧹 Limpeza Automática**: Remove dados de teste preservando os 6 usuários da seed
- **🔍 Validação de Estado**: Verifica integridade do banco após testes
- **⚡ Testes Paralelos**: Execução otimizada para máxima eficiência

#### **Categorias de Teste**
- **Unitários**: Lógica de negócio e validações
- **E2E**: Fluxos completos de usuário
- **Integração**: Comunicação entre serviços
- **Segurança**: Validação de autenticação e autorização

## 🛠️ **Scripts Disponíveis**

| Comando | Descrição |
|---------|-----------|
| `pnpm run start:dev` | Inicia em modo desenvolvimento |
| `pnpm run start:prod` | Inicia em modo produção |
| `pnpm run build` | Compila o projeto |
| `pnpm run lint` | Verifica/corrige código |
| `pnpm run format` | Formata código |
| `pnpm prisma studio` | Interface visual do banco |
| `pnpm prisma db seed` | Popula banco com dados iniciais |
| `pnpm test:cleanup` | Limpeza pós-teste (remove dados de teste) |
| `pnpm db:check` | Verifica estado do banco |

## 🆕 **Funcionalidades Recentes**

### **🎯 Gestão Avançada de Ciclos**
- **Ativação Automatizada**: PATCH `/api/evaluation-cycles/{id}/activate` com validação de deadlines
- **Monitoramento de Prazos**: GET `/api/evaluation-cycles/{id}/deadlines` com status em tempo real
- **Validação Inteligente**: Verificação automática de consistência de datas
- **Auto-definição de Fim**: Configuração automática de `endDate` baseada na deadline de equalização

### **📊 Status de Deadlines**
- **🟢 OK**: Mais de 3 dias restantes
- **🟡 URGENT**: 3 dias ou menos restantes  
- **🔴 OVERDUE**: Prazo vencido

### **🔗 Principais Endpoints da API**

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| `POST` | `/api/auth/login` | Autenticação de usuário | ❌ |
| `GET` | `/api/auth/status` | Status da API | ❌ |
| `GET` | `/api/users/profile` | Perfil do usuário logado | ✅ |
| `GET` | `/api/evaluation-cycles` | Listar todos os ciclos | ✅ |
| `POST` | `/api/evaluation-cycles` | Criar novo ciclo | ✅ Admin |
| `PATCH` | `/api/evaluation-cycles/{id}/activate` | Ativar ciclo com deadlines | ✅ Admin |
| `GET` | `/api/evaluation-cycles/{id}/deadlines` | Informações de prazos | ✅ |
| `PATCH` | `/api/evaluation-cycles/{id}/phase` | Alterar fase do ciclo | ✅ Admin |
| `GET` | `/api/evaluations` | Minhas avaliações | ✅ |
| `POST` | `/api/evaluations/self-assessment` | Criar autoavaliação | ✅ |
| `POST` | `/api/evaluations/360-feedback` | Criar avaliação 360° | ✅ |
| `POST` | `/api/evaluations/manager-review` | Avaliação de gestor | ✅ Gestor |

## 🔧 **Tecnologias Utilizadas**

- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem tipada
- **Prisma** - ORM moderno
- **SQLite** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas
- **Swagger** - Documentação de API
- **Jest** - Framework de testes

## 🚨 **Resolução de Problemas**

### **Erro: "Database file not found"**
```bash
pnpm prisma db push
pnpm prisma db seed
```

### **Erro: "Module not found"**
```bash
rm -rf node_modules
pnpm install
```

### **Erro: "Prisma client not generated"**
```bash
pnpm prisma generate
```

### **Porta 3000 já em uso**
```bash
# No Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# No Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### **Erros de TypeScript após git pull**
Este erro comum acontece quando o Prisma Client não está sincronizado com o schema após fazer pull de mudanças:

```bash
# Solução completa (executar na sequência):
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm run build  # para verificar se os erros foram resolvidos
```

**Explicação**: Mudanças no arquivo `prisma/schema.prisma` requerem regeneração do Prisma Client para atualizar os tipos TypeScript.

---
