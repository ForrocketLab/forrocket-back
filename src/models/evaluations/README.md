# 📋 Modelos de Avaliação - Sistema RPE

Este módulo contém todas as interfaces TypeScript para os diferentes tipos de avaliação do sistema **Rocket Performance and Engagement (RPE)**.

## 📁 Estrutura de Pastas

```
/src/models/evaluations/
├── collaborator/           # Avaliações preenchidas por colaboradores
│   ├── IBaseEvaluation.ts     # Interface base comum
│   ├── ISelfAssessment.ts     # Autoavaliação
│   ├── I360Assessment.ts      # Avaliação 360 graus
│   ├── IMentoringAssessment.ts # Avaliação de mentoring
│   ├── IReferenceFeedback.ts  # Feedback de referências
│   └── index.ts              # Exportações centralizadas
├── manager/                # (Futuro) Avaliações de gestores
└── committee/              # (Futuro) Avaliações de comitê
```

## 🎯 Tipos de Avaliação do Colaborador

### 1. **Autoavaliação** (`ISelfAssessment`)
- **Propósito**: Colaborador avalia a si mesmo
- **Estrutura**: Múltiplos critérios com nota (1-5) e justificativa
- **Campos específicos**: `answers[]` com `criterionId`, `score`, `justification`

### 2. **Avaliação 360** (`I360Assessment`)
- **Propósito**: Colaborador avalia um colega
- **Estrutura**: Nota geral + pontos fortes e de melhoria
- **Campos específicos**: `evaluatedUserId`, `overallScore`, `strengths`, `improvements`

### 3. **Avaliação de Mentoring** (`IMentoringAssessment`)
- **Propósito**: Colaborador avalia seu mentor
- **Estrutura**: Nota simples + justificativa
- **Campos específicos**: `mentorId`, `score`, `justification`

### 4. **Feedback de Referências** (`IReferenceFeedback`)
- **Propósito**: Colaborador fornece referência sobre um colega
- **Estrutura**: Apenas feedback textual (sem nota)
- **Campos específicos**: `referencedUserId`, `justification`

## 📝 Interface Base

Todas as avaliações herdam de `IBaseEvaluation` que contém:
- `id`: Identificador único
- `cycle`: Ciclo de avaliação (ex: "2025.1")
- `authorId`: Quem preencheu a avaliação
- `status`: 'DRAFT' ou 'SUBMITTED'
- `createdAt`: Data de criação
- `submittedAt`: Data de submissão (opcional)