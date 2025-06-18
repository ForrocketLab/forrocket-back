# 🏛️ Sistema de Avaliação de Comitê - Equalização

## Visão Geral

Implementação completa da **Fase 3 de Equalização** no sistema de avaliações. O comitê pode agora revisar todas as avaliações de um colaborador e atribuir uma nota final equalizada de 1 a 5 com justificativa.

## 🚀 Funcionalidades Implementadas

### 1. **Modelo de Dados**

- ✅ Tabela `CommitteeAssessment` criada
- ✅ Relacionamentos com `User` (autor e avaliado)
- ✅ Campos: `finalScore`, `justification`, `observations`, `status`
- ✅ Migração aplicada: `add_committee_assessments`

### 2. **Validação de Fases**

- ✅ Avaliações de comitê só funcionam na **fase EQUALIZATION**
- ✅ Integração com sistema de fases dos ciclos
- ✅ Validação de permissões (apenas membros do comitê)

### 3. **API Endpoints Criados**

#### **`GET /api/evaluations/committee/collaborators`**

- Lista todos os colaboradores que precisam de equalização
- Mostra status: quem já tem avaliação de comitê
- **Acesso**: Apenas membros do comitê

#### **`GET /api/evaluations/committee/collaborator/:id/summary`**

- Resumo completo de todas as avaliações de um colaborador:
  - Autoavaliação
  - Avaliações 360 recebidas
  - Avaliações de gestor recebidas
  - Avaliações de mentoring recebidas
  - Feedbacks de referência recebidos
  - Avaliação de comitê (se existir)
- **Acesso**: Apenas membros do comitê

#### **`POST /api/evaluations/committee/assessment`**

- Criar nova avaliação de equalização
- Campos obrigatórios: `evaluatedUserId`, `finalScore`, `justification`
- Campo opcional: `observations`
- **Acesso**: Apenas membros do comitê

#### **`PUT /api/evaluations/committee/assessment/:id`**

- Editar avaliação existente (apenas status DRAFT)
- **Acesso**: Apenas membros do comitê

#### **`PATCH /api/evaluations/committee/assessment/:id/submit`**

- Submeter avaliação (DRAFT → SUBMITTED)
- **Acesso**: Apenas membros do comitê

#### **`GET /api/evaluations/committee/assessments`**

- Listar todas as avaliações de comitê do ciclo ativo
- **Acesso**: Apenas membros do comitê

### 4. **Integração com Rotas Existentes**

- ✅ Avaliações de comitê agora aparecem em:
  - `GET /api/evaluations/collaborator/received/cycle/:cycleId`
  - Documentação da API atualizada

### 5. **Validações e Regras de Negócio**

- ✅ Apenas membros do comitê podem realizar avaliações
- ✅ Apenas na fase EQUALIZATION
- ✅ Uma avaliação de comitê por colaborador por ciclo
- ✅ Nota final de 1 a 5 obrigatória
- ✅ Justificativa obrigatória
- ✅ Observações opcionais
- ✅ Status: DRAFT → SUBMITTED (sem volta)

## 📊 Fluxo de Uso

### Para o Comitê:

1. **Verificar Fase do Ciclo**

   - Administrador deve mudar ciclo para fase `EQUALIZATION`
   - `PATCH /api/evaluation-cycles/:id/phase`

2. **Listar Colaboradores**

   - `GET /api/evaluations/committee/collaborators`
   - Visualizar quem precisa de equalização

3. **Analisar Colaborador**

   - `GET /api/evaluations/committee/collaborator/:id/summary`
   - Ver todas as avaliações recebidas

4. **Criar Avaliação de Equalização**

   - `POST /api/evaluations/committee/assessment`
   - Nota de 1 a 5 + justificativa

5. **Submeter Avaliação**
   - `PATCH /api/evaluations/committee/assessment/:id/submit`

### Para Colaboradores:

- Visualizar avaliação de comitê recebida em:
  - `GET /api/evaluations/collaborator/received/cycle/:cycleId`

## 🔧 Estrutura Técnica

### Arquivos Criados:

```
src/evaluations/committee/
├── dto/
│   └── committee-assessment.dto.ts
├── committee.controller.ts
├── committee.service.ts
└── committee.module.ts
```

### Modificações:

- `prisma/schema.prisma` - Modelo CommitteeAssessment
- `src/evaluations/evaluations.module.ts` - Importa CommitteeModule
- `src/evaluations/evaluations.service.ts` - Inclui avaliações de comitê
- `src/evaluations/evaluations.controller.ts` - Documentação atualizada

## 📋 Dados de Teste

Para testar a funcionalidade:

1. **Mudar Ciclo para Fase EQUALIZATION**:

```bash
# Primeiro, obter ID do ciclo ativo
GET /api/evaluation-cycles/active

# Depois, mudar fase
PATCH /api/evaluation-cycles/{{cycleId}}/phase
{
  "phase": "EQUALIZATION"
}
```

2. **Criar Usuário do Comitê** (se não existir):

- Usuário com role `comite` ou `COMMITTEE`

3. **Testar Endpoints**:

- Listar colaboradores: `GET /api/evaluations/committee/collaborators`
- Ver resumo: `GET /api/evaluations/committee/collaborator/:id/summary`
- Criar avaliação: `POST /api/evaluations/committee/assessment`

## ✅ Status da Implementação

- [x] **Modelo de dados criado**
- [x] **Migração aplicada**
- [x] **Serviço implementado**
- [x] **Controller implementado**
- [x] **Módulo integrado**
- [x] **Validações de fase**
- [x] **Validações de permissão**
- [x] **Documentação da API**
- [x] **Integração com rotas existentes**
- [x] **Compilação funcionando**

## 🚀 Próximos Passos (Opcionais)

1. **Testes Automatizados**: Criar testes unitários e de integração
2. **Dashboard**: Interface visual para o comitê
3. **Relatórios**: Exportação de dados de equalização
4. **Histórico**: Auditoria de mudanças nas avaliações
5. **Notificações**: Alertas para colaboradores sobre equalização
