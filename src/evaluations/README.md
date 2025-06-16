# 🎯 API de Avaliações - Sistema RPE

Esta documentação descreve todos os endpoints da API de avaliações do sistema **Rocket Performance and Engagement (RPE)**.

## 🔒 Autenticação

Todos os endpoints requerem autenticação via **JWT Token** no cabeçalho `Authorization`:

```
Authorization: Bearer <seu-jwt-token>
```

## 📋 Endpoints Disponíveis

### 🔹 **POST** `/api/evaluations/collaborator/self-assessment`
Cria uma autoavaliação completa com **todos os 12 critérios obrigatoriamente**.

**Corpo da Requisição:**
```json
{
  "cycle": "2025.1",
  
  // PILAR: COMPORTAMENTO (5 critérios)
  "sentimentoDeDonoScore": 4,
  "sentimentoDeDonoJustification": "Demonstro responsabilidade pelos resultados da equipe e tomo iniciativa em projetos importantes.",
  
  "resilienciaAdversidadesScore": 4,
  "resilienciaAdversidadesJustification": "Mantenho-me firme e positivo diante de desafios, adaptando-me bem a mudanças.",
  
  "organizacaoTrabalhoScore": 5,
  "organizacaoTrabalhoJustification": "Mantenho organização pessoal, planejo bem as atividades e gerencio eficientemente o tempo.",
  
  "capacidadeAprenderScore": 5,
  "capacidadeAprenderJustification": "Demonstro curiosidade, busco constantemente novos conhecimentos e aplico o que aprendo.",
  
  "teamPlayerScore": 5,
  "teamPlayerJustification": "Trabalho bem em equipe, colaboro ativamente, compartilho conhecimento e ajudo colegas.",
  
  // PILAR: EXECUÇÃO (4 critérios)
  "entregarQualidadeScore": 4,
  "entregarQualidadeJustification": "Entrego trabalhos com alta qualidade, atenção aos detalhes e seguindo padrões estabelecidos.",
  
  "atenderPrazosScore": 4,
  "atenderPrazosJustification": "Cumpro prazos estabelecidos, gerencio bem o tempo e comunico antecipadamente possíveis atrasos.",
  
  "fazerMaisMenosScore": 4,
  "fazerMaisMenosJustification": "Otimizo recursos, encontro soluções eficientes e maximizo resultados com recursos limitados.",
  
  "pensarForaCaixaScore": 3,
  "pensarForaCaixaJustification": "Demonstro criatividade, proponho soluções inovadoras e abordo problemas de forma não convencional.",
  
  // PILAR: GESTÃO E LIDERANÇA (3 critérios)
  "gestaoGenteScore": 3,
  "gestaoGenteJustification": "Desenvolvo pessoas, inspiro e motivo a equipe, promovo um ambiente colaborativo e de crescimento.",
  
  "gestaoResultadosScore": 4,
  "gestaoResultadosJustification": "Foco na entrega de resultados, defino metas claras e acompanho o desempenho da equipe.",
  
  "evolucaoRocketScore": 4,
  "evolucaoRocketJustification": "Contribuo ativamente para o crescimento e evolução da empresa, proponho melhorias e inovações."
}
```

**📊 Critérios Obrigatórios (12 total):**
- **Comportamento (5)**: Sentimento de Dono, Resiliência nas Adversidades, Organização no Trabalho, Capacidade de Aprender, Ser "Team Player"
- **Execução (4)**: Entregar com Qualidade, Atender aos Prazos, Fazer Mais com Menos, Pensar Fora da Caixa
- **Gestão (3)**: Gente, Resultados, Evolução da Rocket Corp

**🎯 Validações:**
- ✅ Todas as notas devem ser **números inteiros de 1 a 5**
- ✅ Todas as justificativas são **obrigatórias** e não podem estar vazias
- ✅ Todos os 12 critérios devem ser preenchidos

---

### 🔹 **POST** `/api/evaluations/collaborator/360-assessment`
Cria uma avaliação 360 graus de um colega.

**Corpo da Requisição:**
```json
{
  "cycle": "2025.1",
  "evaluatedUserId": "user-456",
  "overallScore": 4,
  "strengths": "Excelente comunicação, sempre disposto a ajudar a equipe e demonstra grande conhecimento técnico.",
  "improvements": "Poderia ser mais proativo em reuniões e compartilhar mais conhecimento com juniores."
}
```

---

### 🔹 **POST** `/api/evaluations/collaborator/mentoring-assessment`
Cria uma avaliação do mentor.

**Corpo da Requisição:**
```json
{
  "cycle": "2025.1",
  "mentorId": "user-789",
  "score": 5,
  "justification": "Excelente mentor, sempre disponível para tirar dúvidas e me ajudou muito no desenvolvimento técnico."
}
```

---

### 🔹 **POST** `/api/evaluations/collaborator/reference-feedback`
Cria um feedback de referência sobre um colega.

**Corpo da Requisição:**
```json
{
  "cycle": "2025.1",
  "referencedUserId": "user-123",
  "justification": "Trabalhou comigo no projeto X e demonstrou excelente capacidade de resolução de problemas e colaboração."
}
```

---

### 🔹 **GET** `/api/evaluations/collaborator/cycle/:cycleId`
Busca todas as avaliações do usuário logado para um ciclo específico.

**Exemplo de Resposta:**
```json
{
  "cycle": "2025.1",
  "selfAssessment": {
    "id": "eval-123",
    "cycle": "2025.1",
    "authorId": "user-456",
    "status": "DRAFT",
    "createdAt": "2025-01-15T10:00:00Z",
    "answers": [
      {
        "criterionId": "sentimento-de-dono",
        "score": 4,
        "justification": "Demonstro responsabilidade..."
      },
      // ... todos os 12 critérios
    ]
  },
  "assessments360": [
    {
      "id": "360-456",
      "evaluatedUserId": "user-789",
      "overallScore": 4,
      "strengths": "Excelente comunicação...",
      "improvements": "Poderia ser mais proativo...",
      "evaluatedUser": {
        "id": "user-789",
        "name": "Bruno Mendes",
        "email": "bruno.mendes@rocket.com"
      }
    }
  ],
  "mentoringAssessments": [
    {
      "id": "mentor-123",
      "mentorId": "user-999",
      "score": 5,
      "justification": "Excelente mentor...",
      "mentor": {
        "id": "user-999",
        "name": "Carla Dias",
        "email": "carla.dias@rocket.com"
      }
    }
  ],
  "referenceFeedbacks": [
    {
      "id": "ref-789",
      "referencedUserId": "user-111",
      "justification": "Trabalhou comigo no projeto...",
      "referencedUser": {
        "id": "user-111",
        "name": "Felipe Silva",
        "email": "felipe.silva@rocket.com"
      }
    }
  ],
  "summary": {
    "selfAssessmentCompleted": true,
    "assessments360Count": 1,
    "mentoringAssessmentsCount": 1,
    "referenceFeedbacksCount": 1
  }
}
```

## 🛡️ Regras de Segurança

### 1. **Autenticação Obrigatória**
- Todos os endpoints requerem JWT válido
- O `authorId` é sempre obtido do token (não do corpo da requisição)

### 2. **Validações de Negócio**
- **Autoavaliação**: Um usuário só pode ter uma autoavaliação por ciclo
- **Avaliação 360**: Não pode avaliar a si mesmo; uma avaliação por usuário/ciclo
- **Mentoring**: Uma avaliação por mentor/ciclo
- **Referência**: Não pode referenciar a si mesmo; uma referência por usuário/ciclo

### 3. **Validação de Notas**
- ✅ Notas devem ser **números inteiros** entre 1 e 5
- ✅ Uso do decorator `@IsInt()` para garantir números inteiros
- ✅ Validação `@Min(1)` e `@Max(5)` para limitar o range

## 🧪 Exemplos de Teste

### Fazer Login (obter token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana.oliveira@rocket.com",
    "password": "senha123"
  }'
```

### Criar Autoavaliação Completa
```bash
curl -X POST http://localhost:3000/api/evaluations/collaborator/self-assessment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token>" \
  -d '{
    "cycle": "2025.1",
    "sentimentoDeDonoScore": 4,
    "sentimentoDeDonoJustification": "Demonstro responsabilidade pelos resultados.",
    "resilienciaAdversidadesScore": 4,
    "resilienciaAdversidadesJustification": "Mantenho-me firme diante de desafios.",
    "organizacaoTrabalhoScore": 5,
    "organizacaoTrabalhoJustification": "Sou muito organizado no trabalho.",
    "capacidadeAprenderScore": 5,
    "capacidadeAprenderJustification": "Sempre busco aprender coisas novas.",
    "teamPlayerScore": 5,
    "teamPlayerJustification": "Trabalho muito bem em equipe.",
    "entregarQualidadeScore": 4,
    "entregarQualidadeJustification": "Entrego trabalhos com qualidade.",
    "atenderPrazosScore": 4,
    "atenderPrazosJustification": "Cumpro os prazos estabelecidos.",
    "fazerMaisMenosScore": 4,
    "fazerMaisMenosJustification": "Otimizo recursos disponíveis.",
    "pensarForaCaixaScore": 3,
    "pensarForaCaixaJustification": "Busco soluções criativas.",
    "gestaoGenteScore": 3,
    "gestaoGenteJustification": "Estou desenvolvendo habilidades de liderança.",
    "gestaoResultadosScore": 4,
    "gestaoResultadosJustification": "Foco na entrega de resultados.",
    "evolucaoRocketScore": 4,
    "evolucaoRocketJustification": "Contribuo para o crescimento da empresa."
  }'
```

### Buscar Avaliações do Ciclo
```bash
curl -X GET http://localhost:3000/api/evaluations/collaborator/cycle/2025.1 \
  -H "Authorization: Bearer <seu-token>"
```

## 📊 Status HTTP

- **200**: Sucesso (GET)
- **201**: Criado com sucesso (POST)
- **400**: Dados inválidos ou regra de negócio violada
- **401**: Token inválido ou ausente
- **404**: Recurso não encontrado (usuário, mentor, etc.)

## ✨ Melhorias Implementadas

### 🎯 **Autoavaliação Completa**
- ✅ **12 critérios obrigatórios** em uma única requisição
- ✅ **Validação rigorosa** de notas (1-5, números inteiros)
- ✅ **Estrutura organizada** por pilares
- ✅ **Type safety** completo com TypeScript

### 🔒 **Validações Robustas**
- ✅ `@IsInt()` - Garante números inteiros
- ✅ `@Min(1)` e `@Max(5)` - Limita range de notas
- ✅ `@IsNotEmpty()` - Justificativas obrigatórias
- ✅ Validação de ciclo único por usuário

## 🚀 Próximos Passos

1. **Submissão de Avaliações**: Endpoint para mudar status de DRAFT para SUBMITTED
2. **Validações Avançadas**: Regras de negócio específicas (tempo de trabalho conjunto, etc.)
3. **Relatórios**: Endpoints para gestores visualizarem avaliações da equipe
4. **Notificações**: Sistema de notificações para prazos de avaliação 