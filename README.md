# 🚀 RPE - Rocket Performance and Engagement

**RPE (Rocket Performance and Engagement)** - Sistema de digitalização de avaliações de desempenho de funcionários.

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

### **📊 Estruturas Criadas**
- **3 ciclos de avaliação** (2024.2 fechado, 2025.1 ativo, 2025.2 futuro)
- **16 critérios de avaliação** (6 comportamentais, 6 execução, 4 gestão)
- **6 projetos** com descrições realísticas
- **6 usuários** com perfis organizacionais completos
- **9 atribuições de role globais** (sistema legado + novo)
- **13 atribuições de projeto** (usuários associados a projetos)
- **13 roles específicas por projeto** (granularidade total)

### **👥 Usuários para Teste**

| Nome | Email | Senha | Roles Globais | Cargo | Senioridade |
|------|-------|-------|---------------|-------|-------------|
| **Ana Oliveira** | ana.oliveira@rocketcorp.com | password123 | colaborador | Desenvolvedora Frontend | Pleno |
| **Bruno Mendes** | bruno.mendes@rocketcorp.com | password123 | colaborador, gestor | Tech Lead | Sênior |
| **Carla Dias** | carla.dias@rocketcorp.com | password123 | colaborador, comitê | Head of Engineering | Principal |
| **Diana Costa** | diana.costa@rocketcorp.com | password123 | colaborador, rh | People & Culture Manager | Sênior |
| **Felipe Silva** | felipe.silva@rocketcorp.com | password123 | colaborador | Desenvolvedor Backend | Júnior |
| **Eduardo Tech** | eduardo.tech@rocketcorp.com | password123 | admin | DevOps Engineer | Sênior |

### **🏢 Estrutura Organizacional**
```
👑 Carla Dias (Head of Engineering)
├── 👨‍💼 Bruno Mendes (Tech Lead)
│   ├── 👩‍💻 Ana Oliveira (Dev Frontend)
│   └── 👨‍💻 Felipe Silva (Dev Backend)
└── 👩‍💼 Diana Costa (People & Culture)

🔧 Eduardo Tech (Admin - Independente)
```

### **🔑 Roles por Projeto (Sistema Novo)** ✨
| Usuário | Projeto Alpha | Projeto Beta | Mobile App | API Core | Delta | Gamma |
|---------|---------------|--------------|------------|----------|-------|-------|
| **Ana** | COLLABORATOR | - | **TECH_LEAD** | - | - | - |
| **Bruno** | **TECH_LEAD** | - | - | **MANAGER** | COLLABORATOR | - |
| **Carla** | - | **MANAGER** | - | - | STAKEHOLDER | **MANAGER** |
| **Diana** | - | STAKEHOLDER | - | - | - | - |
| **Felipe** | - | - | COLLABORATOR | COLLABORATOR | - | - |
| **Eduardo** | - | - | - | - | **MANAGER** | **TECH_LEAD** |

### **🏗️ Projetos Disponíveis**
1. **Projeto Alpha** - Plataforma de vendas (React + Node.js)
2. **Projeto Beta** - Modernização RH (microserviços)
3. **Projeto Gamma** - BI e Analytics (Power BI + Spark)
4. **Projeto Delta** - Cloud Migration (AWS + Docker)
5. **App Mobile RocketCorp** - App nativo iOS/Android
6. **API Core** - Refatoração da API principal

### **🎯 Tipos de Role**
- **👤 Colaborador**: Participa como avaliado no processo
- **👨‍💼 Gestor**: Avalia liderados diretos + é avaliado
- **👑 Comitê**: Participa da equalização final + é avaliado
- **👩‍💼 RH**: Configuração e acompanhamento geral
- **🔧 Admin**: Gerenciamento total do sistema

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
```

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
---
