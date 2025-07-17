# Como Testar a Criptografia de Scores

## ✅ Implementação Concluída

A criptografia dos scores de avaliação foi implementada com sucesso! Agora as notas de cada critério são criptografadas automaticamente.

### 🔐 O que está sendo criptografado:

1. **Scores (notas) de todos os tipos de avaliação:**
   - `score` em autoavaliações (`SelfAssessmentAnswer`)
   - `overallScore` em avaliações 360 (`Assessment360`)
   - `score` em avaliações de mentoring (`MentoringAssessment`)
   - `score` em avaliações de gestor (`ManagerAssessmentAnswer`)
   - `finalScore` em avaliações de comitê (`CommitteeAssessment`)

2. **Campos de texto (já implementados anteriormente):**
   - Justificativas
   - Feedbacks
   - Resumos de GenAI
   - Observações

### 🔄 Como funciona:

1. **No Frontend → Backend**: Quando dados são enviados, scores são descriptografados automaticamente antes de salvar no banco
2. **No Banco**: Scores são armazenados como números normais (não criptografados)
3. **No Backend → Frontend**: Quando dados são retornados, scores são criptografados automaticamente para o frontend

## 🧪 Como Testar

### 1. Teste via API (Recomendado)

Use o Postman ou qualquer cliente HTTP para testar:

#### Criar uma Autoavaliação:
```bash
POST /api/evaluations/collaborator/self-assessment
Authorization: Bearer <seu_jwt_token>
Content-Type: application/json

{
  "sentimentoDeDonoScore": 4,
  "sentimentoDeDonoJustification": "Tenho muito senso de responsabilidade",
  "teamPlayerScore": 5,
  "teamPlayerJustification": "Trabalho muito bem em equipe"
  // ... outros campos
}
```

#### Verificar o Resultado:
```bash
GET /api/evaluations/collaborator/{userId}/{cycle}
Authorization: Bearer <seu_jwt_token>
```

**O que esperar:**
- ✅ Você deve ver scores como strings criptografadas (ex: `"score": "abc123:def456:ghi789"`)
- ✅ Justificativas devem estar descriptografadas (texto normal)
- ✅ No banco de dados, scores devem estar como números

### 2. Teste Direto no Banco de Dados

1. **Criar uma avaliação via API**
2. **Verificar no banco:**
   ```sql
   SELECT * FROM self_assessment_answers LIMIT 5;
   ```
3. **Verificar que:**
   - Campo `score` está como número (4, 5, etc.)
   - Campo `justification` está criptografado (`abc:def:ghi`)

### 3. Teste via Frontend

1. **Preencher uma avaliação no frontend**
2. **Verificar na aba Network do DevTools:**
   - Request deve ter scores como números
   - Response deve ter scores como strings criptografadas

### 4. Verificação de Interceptors

Os seguintes interceptors foram adicionados aos controllers:

- ✅ **EvaluationInputInterceptor**: Converte scores criptografados para números na entrada
- ✅ **EvaluationDecryptionInterceptor**: Criptografa scores para o frontend na saída

**Controllers atualizados:**
- `EvaluationsController` (avaliações de colaboradores)
- `ManagerController` (avaliações de gestores)
- `CommitteeController` (avaliações de comitê)

## 🔍 Como Verificar se Está Funcionando

### Sinais de que a criptografia está funcionando:

1. **Na resposta da API:** 
   ```json
   {
     "score": "a1b2c3d4e5f6:g7h8i9j0k1l2:m3n4o5p6q7r8s9t0"
   }
   ```

2. **No banco de dados:**
   ```sql
   score | justification
   4     | a1b2c3d4e5f6:g7h8i9j0k1l2:encrypted_text_here
   ```

3. **No console do backend:** Nenhum erro de criptografia

### Sinais de problemas:

❌ **Erro de chave:** `RangeError: Invalid key length`
- **Solução:** Verificar se `ENCRYPTION_KEY` tem exatamente 32 caracteres

❌ **Scores não criptografados:** Scores aparecem como números na resposta
- **Solução:** Verificar se interceptors estão configurados nos controllers

❌ **Erro ao salvar:** Erro de tipo ao salvar no banco
- **Solução:** Verificar se o input interceptor está convertendo corretamente

## 🛠️ Configuração Necessária

Certifique-se de que seu arquivo `.env` contém:

```env
ENCRYPTION_KEY=sua_chave_de_32_caracteres_aqui_
```

**Para gerar uma chave:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'));"
```

## 🚀 Próximos Passos

1. **Teste completo:** Teste todas as funcionalidades de avaliação
2. **Performance:** Monitore a performance com criptografia ativa
3. **Backup da chave:** Guarde a chave de criptografia em local seguro
4. **Documentação:** Documente o processo para outros desenvolvedores

---

## ⚠️ Importante

- **NUNCA** commitar a chave de criptografia no git
- **SEMPRE** fazer backup da chave de criptografia
- **TESTAR** em ambiente de desenvolvimento antes de produção
- **MONITORAR** logs para verificar se não há erros de criptografia 