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
````

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

### **📊 Estruturas Criadas**

  - **3 ciclos de avaliação** (2024.2 fechado, 2025.1 ativo, 2025.2 futuro)
  - **16 critérios de avaliação** (6 comportamentais, 6 execução, 4 gestão)
  - **6 projetos** com descrições realísticas
  - **9 usuários** com perfis organizacionais completos
  - **9 atribuições de role globais** (sistema legado + novo)
  - **13 atribuições de projeto** (usuários associados a projetos)
  - **13 
  específicas por projeto** (granularidade total)

### **👥 Usuários para Teste**

| Nome | Email | Senha | Roles Globais | Cargo | Senioridade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ana B. Oliveira Santos** | ana.oliveira@rocketcorp.com | password123 | colaborador | Desenvolvedora Frontend | Pleno |
| **Bruno A. Mendes Carvalho** | bruno.mendes@rocketcorp.com | password123 | colaborador, gestor | Tech Lead | Sênior |
| **Carla Regina Dias Fernandes** | carla.dias@rocketcorp.com | password123 | comite | Head of Engineering | Principal |
| **Diana Cristina Costa Lima** | diana.costa@rocketcorp.com | password123 | rh | People & Culture Manager | Sênior |
| **Felipe Augusto Silva Rodrigues**| felipe.silva@rocketcorp.com | password123 | colaborador | Desenvolvedor Backend | Júnior |
| **Eduardo José Ferreira da Silva**| eduardo.tech@rocketcorp.com | password123 | admin | DevOps Engineer | Sênior |
| **Lucas Henrique Fernandes Souza**| lucas.fernandes@rocketcorp.com| password123 | colaborador, líder | Product Manager | Sênior |
| **Marina Vitória Santos Oliveira**| marina.santos@rocketcorp.com| password123 | colaborador | Data Analyst | Pleno |
| **Rafael Augusto Costa Silva** | rafael.costa@rocketcorp.com | password123 | colaborador, gestor, líder | System Administrator | Principal |

### **🏢 Estrutura Organizacional**

```
👑 Carla Dias (Head of Engineering)
├── 👨‍💼 Bruno Mendes (Tech Lead)
│   ├── 👩‍💻 Ana Oliveira (Dev Frontend)
│   └── 👨‍💻 Felipe Silva (Dev Backend)
└── 👩‍💼 Diana Costa (People & Culture)

🔧 Eduardo Tech (Admin - Independente)
```

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

### **🔑 Roles por Projeto (Sistema Novo)** ✨

| Usuário | Projeto Alpha | Projeto Beta | Mobile App | API Core | Delta | Gamma |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ana** | COLLABORATOR | - | COLLABORATOR | - | - | COLLABORATOR |
| **Bruno** | MANAGER | - | MANAGER | MANAGER | - | - |
| **Carla** | - | MANAGER | - | - | STAKEHOLDER | MANAGER |
| **Diana** | - | STAKEHOLDER | - | - | - | - |
| **Felipe**| - | - | COLLABORATOR | COLLABORATOR | - | - |
| **Eduardo** | - | - | - | - | MANAGER | LEADER |
| **Lucas** | - | LEADER | - | - | - | LEADER |
| **Marina**| - | - | - | - | COLLABORATOR | COLLABORATOR |
| **Rafael**| - | - | - | - | MANAGER, LEADER | - |

### **🏗️ Projetos Disponíveis**

1.  **Projeto Alpha** - Desenvolvimento da nova plataforma de vendas com React e Node.js
2.  **Projeto Beta** - Modernização do sistema de RH com migração para microserviços
3.  **Projeto Gamma** - Implementação de BI e analytics com Power BI e Apache Spark
4.  **Projeto Delta** - Migração para cloud computing (AWS) e containerização com Docker
5.  **App Mobile RocketCorp** - Desenvolvimento do aplicativo móvel nativo para iOS e Android
6.  **API Core** - Refatoração e otimização da API principal do sistema

### **🎯 Tipos de Role**

  - **👤 Colaborador**: Participa como avaliado no processo
  - **👨‍💼 Gestor**: Avalia liderados diretos + é avaliado
  - **👑 Comitê**: Participa da equalização final + é avaliado
  - **👩‍💼 RH**: Configuração e acompanhamento geral
  - **🔧 Admin**: Gerenciamento total do sistema
  - **🎯 Líder**: Lidera projetos e pode ter liderados no contexto do projeto
  - **🎓 Mentor**: Orienta o desenvolvimento de outros colaboradores.

### **📋 Critérios de Avaliação**

  - **Comportamentais** (6): Sentimento de Dono, Colaboração, Comunicação, Proatividade, Adaptabilidade, Aprendizado Contínuo
  - **Execução** (6): Qualidade de Entrega, Produtividade, Cumprimento de Prazos, Resolução de Problemas, Organização, Foco em Resultados
  - **Gestão** (4): Liderança, Desenvolvimento de Equipe, Tomada de Decisão, Planejamento Estratégico

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
| :--- | :--- |
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
