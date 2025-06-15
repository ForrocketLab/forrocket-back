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

## 👥 **Usuários para Teste**

O sistema vem com 3 usuários pré-cadastrados:

| Nome | Email | Senha | Roles |
|------|-------|-------|-------|
| **Ana Oliveira** | ana.oliveira@rocketcorp.com | password123 | colaborador |
| **Bruno Mendes** | bruno.mendes@rocketcorp.com | password123 | colaborador, gestor |
| **Carla Dias** | carla.dias@rocketcorp.com | password123 | colaborador, comitê |

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

**✅ Sistema pronto para uso! Acesse http://localhost:3000/api-docs para começar.**