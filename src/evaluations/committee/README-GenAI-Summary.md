# 🤖 **Resumos Automáticos via GenAI para Equalização**

Esta funcionalidade permite que membros do comitê gerem resumos automáticos de colaboradores usando Inteligência Artificial, facilitando o processo de equalização.

## 🎯 **Funcionalidades**

### **✨ Resumo Individual de Colaborador**
- **Endpoint**: `POST /api/evaluations/committee/collaborator-summary`
- **Acesso**: Apenas membros do comitê (role COMMITTEE)
- **IA**: Utiliza GPT-4o com prompt especializado em equalização

### **📊 Dados Analisados**
A IA analisa **TODAS** as avaliações do colaborador:
- ✅ **Autoavaliação** (todas as respostas por critério e pilar)
- ✅ **Avaliações 360°** recebidas (pontos fortes e melhorias)
- ✅ **Avaliações de Gestor** (feedback detalhado por critério)
- ✅ **Avaliações de Mentoring** recebidas (se aplicável)
- ✅ **Reference Feedbacks** recebidos
- ✅ **Estatísticas consolidadas** (médias por pilar, nota geral)

## 🚀 **Como Usar**

### **1. Obter Token de Autenticação**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carla.dias@rocketcorp.com",
    "password": "password123"
  }'
```

### **2. Gerar Resumo de Colaborador**
```bash
curl -X POST http://localhost:3000/api/evaluations/committee/collaborator-summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-comite>" \
  -d '{
    "collaboratorId": "cmc1zy5wj0000xp8qi7awrc2s",
    "cycle": "2025.1"
  }'
```

### **3. Resposta da API**
```json
{
  "summary": "Ana Oliveira demonstra consistência técnica com média 4.2 em todas as avaliações. PONTOS FORTES: Excelente capacidade técnica reconhecida por todos os avaliadores, liderança natural em projetos complexos...",
  "collaboratorName": "Ana Oliveira", 
  "jobTitle": "Desenvolvedora Frontend Pleno",
  "cycle": "2025.1",
  "averageScore": 4.2,
  "totalEvaluations": 8
}
```

## 🧠 **Prompt Especializado da IA**

A IA utiliza um prompt especializado que analisa:

### **🎯 Foco da Análise**
1. **Performance Geral**: Consistência entre diferentes tipos de avaliação
2. **Pontos Fortes**: Competências mais destacadas pelos avaliadores  
3. **Áreas de Desenvolvimento**: Oportunidades de melhoria identificadas
4. **Discrepâncias**: Diferenças entre autoavaliação vs. feedback de terceiros
5. **Recomendação de Nota**: Sugestão fundamentada para equalização

### **📋 Estrutura do Resumo**
O resumo gerado pela IA inclui:
- **Análise de consistência** entre avaliações
- **Identificação de padrões** nas notas e feedbacks
- **Recomendação estratégica** para equalização
- **Insights acionáveis** para decisão do comitê

## 🔧 **Configuração Técnica**

### **Variáveis de Ambiente**
```bash
# .env
OPENAI_API_KEY=sk-proj-sua_chave_da_openai_aqui
```

### **Modelo de IA Utilizado**
- **Modelo**: GPT-4o
- **Temperatura**: 0.2 (baixa para análise objetiva)
- **Formato**: JSON estruturado
- **Timeout**: 15 segundos

### **Mapeamento de Critérios**
Como ainda não há FK para a tabela `Criterion`, utilizamos mapeamento estático:

```typescript
// Pilar Comportamento
'sentimento-de-dono': 'Sentimento de Dono'
'resiliencia-adversidades': 'Resiliência nas Adversidades'
'organizacao-trabalho': 'Organização no Trabalho'
'capacidade-aprender': 'Capacidade de Aprender'
'team-player': 'Ser Team Player'

// Pilar Execução
'entregar-qualidade': 'Entregar com Qualidade'
'atender-prazos': 'Atender aos Prazos'
'fazer-mais-menos': 'Fazer Mais com Menos'
'pensar-fora-caixa': 'Pensar Fora da Caixa'

// Pilar Gestão
'gestao-gente': 'Gestão de Gente'
'gestao-resultados': 'Gestão de Resultados'
'evolucao-rocket': 'Evolução da Rocket Corp'
```

## 🔒 **Segurança e Permissões**

### **Funcionalidades de Segurança**
- ✅ **Bloqueio de Conta**: Após 3 tentativas falhas de login, a conta do usuário é automaticamente bloqueada por 15 minutos. Um e-mail de aviso é enviado ao usuário notificando sobre o bloqueio.
- ✅ **Recuperação de Senha**: Funcionalidade de "Esqueci minha senha" implementada: Envia um código de verificação por e-mail para permitir a redefinição segura da senha.

### **Variáveis de Ambiente**
```bash
# .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email-here
EMAIL_PASSWORD=-your-app-password-here
EMAIL_FROM="ForRocketLab Support <suporte@forrocketlab.com>"
```
- **Obs**.: O EMAIL_PASSWORD não é a sua senha do email, e sim uma senha de app criada na sua conta Google.

### **Guards Aplicados**
- ✅ **JwtAuthGuard**: Verificação de token válido
- ✅ **CommitteeRoleGuard**: Apenas membros do comitê

### **Validações**
- ✅ **Colaborador existe** na base de dados
- ✅ **Ciclo é válido** e tem avaliações
- ✅ **Dados consistentes** antes do envio para IA

## 🏗️ **Arquitetura**

### **Fluxo de Execução**
```
1. Controller (committee.controller.ts)
   ↓
2. Data Service (committee-data.service.ts) 
   → Coleta todas as avaliações do colaborador
   ↓
3. GenAI Service (gen-ai.service.ts)
   → Processa dados e chama OpenAI API
   ↓
4. Resposta estruturada para o cliente
```

### **Serviços Envolvidos**
- **CommitteeController**: Endpoint REST
- **CommitteeDataService**: Coleta de dados do banco
- **GenAiService**: Integração com OpenAI
- **PrismaService**: Acesso ao banco de dados

## 🎯 **Casos de Uso**

### **Para o Comitê**
1. **Pré-equalização**: Obter resumo antes da reunião
2. **Análise rápida**: Identificar colaboradores que precisam atenção
3. **Decisão fundamentada**: Usar insights da IA para equalização
4. **Documentação**: Usar resumo como base para justificativas

### **Benefícios**
- ⚡ **Agilidade**: Análise em segundos vs. horas manuais
- 🎯 **Precisão**: IA analisa 100% dos dados disponíveis
- 📊 **Consistência**: Mesmo critério de análise para todos
- 💡 **Insights**: Identifica padrões que podem passar despercebidos

## 🚨 **Tratamento de Erros**

### **Possíveis Erros**
- **400**: Colaborador não encontrado
- **403**: Usuário não é membro do comitê
- **500**: Falha na API da OpenAI ou processamento

### **Logs e Monitoramento**
- ✅ Log de início da geração de resumo
- ✅ Log de sucesso com tempo de resposta
- ✅ Log detalhado de erros da OpenAI API
- ✅ Identificação do usuário e colaborador analisado

## 🔄 **Próximos Passos**

### **Melhorias Futuras**
1. **Cache de resumos** para evitar reprocessamento
2. **Resumos em lote** para múltiplos colaboradores
3. **Análise comparativa** entre colaboradores
4. **Integração com ciclos anteriores** para análise de evolução
5. **Exportação** de resumos em PDF/Word

### **Migração Pendente**
- **Criterion FK**: Quando migrar criterionId para FK, remover mapeamento estático
- **Histórico**: Armazenar resumos gerados para auditoria 