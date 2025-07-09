# Configuração de Criptografia - Forrocket

## Visão Geral

O sistema Forrocket implementa criptografia AES-256-GCM para proteger dados sensíveis de avaliações armazenados no banco de dados. Esta documentação explica como configurar e usar esse sistema de criptografia.

## Configuração

### 1. Variável de Ambiente

Adicione a seguinte variável ao seu arquivo `.env`:

```bash
# IMPORTANTE: Esta chave deve ter exatamente 32 caracteres
ENCRYPTION_KEY="your-32-character-secret-key-here!!"
```

### 2. Gerar Chave Segura (Produção)

Para produção, gere uma chave aleatória forte:

```bash
# Usando OpenSSL (recomendado)
openssl rand -hex 16

# Usando Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Dados Criptografados

### Campos que são Criptografados

1. **Autoavaliações (SelfAssessment)**:
   - `justification` - Justificativas para cada critério

2. **Avaliações 360 (Assessment360)**:
   - `strengths` - Pontos fortes
   - `improvements` - Pontos de melhoria

3. **Avaliações de Mentoring (MentoringAssessment)**:
   - `justification` - Justificativa da avaliação

4. **Feedback de Referência (ReferenceFeedback)**:
   - `justification` - Feedback textual
   - `topic` - Tópico do feedback

5. **Avaliações de Gestor (ManagerAssessment)**:
   - `justification` - Justificativas (em answers)

6. **Avaliações de Comitê (CommitteeAssessment)**:
   - `justification` - Justificativa da equalização
   - `observations` - Observações adicionais

7. **Resumos GenAI (GenAISummary)**:
   - `summary` - Resumo completo gerado pela GenAI

8. **Insights Pessoais (PersonalInsights)**:
   - `insights` - Insights personalizados

9. **Resumos de Equipe (ManagerTeamSummary)**:
   - `scoreAnalysisSummary` - Resumo de análise quantitativa
   - `feedbackAnalysisSummary` - Resumo de análise qualitativa

10. **PDIs (PDI)**:
    - `description` - Descrição geral do plano

11. **Ações PDI (PDIAction)**:
    - `description` - Descrição detalhada da ação

### Senhas

As senhas dos usuários **NÃO** usam criptografia reversível. Elas usam hash bcrypt com salt 12, que é a abordagem correta para senhas:

- `User.passwordHash` - Hash irreversível usando bcrypt

## Como Funciona

### Fluxo de Criptografia

1. **Escrita no Banco**:
   - Dados sensíveis são criptografados no service antes de salvar
   - Formato armazenado: `iv:authTag:encryptedData`

2. **Leitura do Banco**:
   - Interceptor automático descriptografa antes de enviar ao frontend
   - Frontend recebe dados já descriptografados

### Exemplo de Implementação

```typescript
// No service - Criptografando antes de salvar
const assessment360 = await this.prisma.assessment360.create({
  data: {
    // ... outros campos
    strengths: this.encryptionService.encrypt(dto.strengths),
    improvements: this.encryptionService.encrypt(dto.improvements),
  },
});

// Frontend recebe automaticamente descriptografado
// Graças ao EvaluationDecryptionInterceptor
```

## Segurança

### Características da Implementação

1. **Algoritmo**: AES-256-GCM (Galois/Counter Mode)
2. **Autenticação**: Verificação de integridade com AuthTag
3. **IV Único**: Cada criptografia usa um Initialization Vector único
4. **AAD**: Additional Authenticated Data para contexto

### Boas Práticas

1. **Chave de Criptografia**:
   - Deve ter exatamente 32 caracteres
   - Gerada aleatoriamente para produção
   - Nunca commitada no código

2. **Rotação de Chaves**:
   - Para trocar a chave, será necessário migração
   - Planejar rotação periódica em produção

3. **Backup**:
   - Manter backup seguro da chave de criptografia
   - Sem a chave, os dados não podem ser recuperados

## Monitoramento

### Logs

O sistema registra erros de descriptografia em `console.error`, mas mantém o funcionamento retornando o valor original.

### Verificação

Para verificar se a criptografia está funcionando:

1. Inspecione o banco de dados diretamente
2. Campos criptografados devem ter formato: `hex:hex:hex`
3. APIs devem retornar dados descriptografados

## Migração

### Dados Existentes

Para aplicar criptografia em dados já existentes, será necessário:

1. Criar script de migração
2. Descriptografar dados existentes (se já criptografados com método antigo)
3. Aplicar nova criptografia
4. Validar resultado

### Script de Exemplo

```typescript
// scripts/encrypt-existing-data.ts
import { PrismaService } from '../src/database/prisma.service';
import { EncryptionService } from '../src/common/services/encryption.service';

async function encryptExistingData() {
  const prisma = new PrismaService();
  const encryption = new EncryptionService();

  // Exemplo para Assessment360
  const assessments = await prisma.assessment360.findMany();
  
  for (const assessment of assessments) {
    await prisma.assessment360.update({
      where: { id: assessment.id },
      data: {
        strengths: encryption.encrypt(assessment.strengths),
        improvements: encryption.encrypt(assessment.improvements),
      },
    });
  }
}
```

## Troubleshooting

### Problemas Comuns

1. **Chave inválida**: Verifique se tem exatamente 32 caracteres
2. **Dados não descriptografam**: Verifique se o interceptor está ativo
3. **Erro ao salvar**: Verifique se o EncryptionService está injetado

### Debug

Para debug, você pode temporariamente desabilitar a criptografia comentando as chamadas para `encryptionService.encrypt()` nos services. 