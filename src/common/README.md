# 👥 Estruturas de Dados de Usuário - Sistema RPE

Este diretório contém todas as definições de tipos, interfaces e utilitários para gerenciar usuários no sistema **RPE (Rocket Performance and Engagement)**.

## 📁 Estrutura de Arquivos

```
src/common/
├── enums/
│   └── user-role.enum.ts      # Enum com as funções dos usuários
├── interfaces/
│   └── user.interface.ts      # Interface principal IUser
├── types/
│   └── user.types.ts          # Tipos auxiliares e utilitários
├── examples/
│   └── user-examples.ts       # Exemplos práticos de uso
├── index.ts                   # Exportações centralizadas
└── README.md                  # Esta documentação
```

## 🎯 Conceitos Principais

### UserRole (Enum)
Define as funções que um usuário pode ter no sistema:

- **COLABORADOR**: Função base, todos que são avaliados
- **GESTOR**: Avalia liderados diretos
- **COMITE**: Participa do comitê de equalização (sócios)
- **RH**: Configuração e acompanhamento geral
- **ADMIN**: Gerenciamento total do sistema

### IUser (Interface Principal)
Estrutura completa de dados de um usuário, incluindo:

- **Identificação**: id, name, email, passwordHash
- **Permissões**: roles (array de UserRole)
- **Dados Organizacionais**: jobTitle, seniority, careerTrack, businessUnit
- **Relacionamentos**: managerId, directReports, mentorId, projects
- **Metadados**: createdAt, updatedAt, isActive