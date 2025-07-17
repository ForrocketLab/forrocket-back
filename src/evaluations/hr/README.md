# Módulo HR - Evolução Histórica de Colaboradores

Este módulo fornece funcionalidades avançadas para o RH visualizar e analisar a evolução histórica dos colaboradores ao longo dos ciclos de avaliação.

## 🎯 Funcionalidades Principais

### 1. Dashboard de Evolução Geral
**Endpoint:** `GET /api/hr/evolution/dashboard`

Fornece uma visão consolidada da evolução organizacional com:
- Estatísticas gerais (total de colaboradores, médias, crescimento)
- Distribuição de performance (high performers, críticos, etc.)
- Análise de tendências
- Histórico dos últimos ciclos
- Destaques e alertas importantes

### 2. Resumo de Evolução de Todos os Colaboradores
**Endpoint:** `GET /api/hr/evolution/collaborators/summary`

Lista todos os colaboradores com resumo de sua evolução:
- Filtros: `sortBy`, `sortOrder`, `filterBy`
- Dados incluídos: tendência, performance por pilares, categoria de performance
- Suporte para ordenação e filtros avançados

**Query Parameters:**
```
?sortBy=evolution&sortOrder=desc&filterBy=improving
```

### 3. Evolução Detalhada de um Colaborador
**Endpoint:** `GET /api/hr/evolution/collaborators/{collaboratorId}/detailed`

Análise completa e detalhada de um colaborador específico:
- Histórico completo de performance
- Dados detalhados por ciclo
- Evolução por pilar (Comportamento, Execução, Gestão)
- Insights e recomendações automatizadas
- Benchmarking vs organização/pares
- Predições baseadas em tendências

### 4. Comparação Entre Colaboradores
**Endpoint:** `GET /api/hr/evolution/comparison`

Permite comparar até 5 colaboradores lado a lado:
- **Query Parameters obrigatórios:** `collaboratorIds` (separados por vírgula)
- **Opcionais:** `cycles`, `pillar`
- Insights automáticos sobre diferenças
- Recomendações baseadas na comparação

**Exemplo:**
```
GET /api/hr/evolution/comparison?collaboratorIds=user-123,user-456,user-789&pillar=BEHAVIOR&cycles=2024.1,2024.2,2025.1
```

### 5. Análise de Tendências Organizacionais
**Endpoint:** `GET /api/hr/evolution/trends`

Análise macro da organização:
- Tendências por pilar (Comportamento, Execução, Gestão)
- Análise por unidade de negócio
- Análise por senioridade
- Padrões identificados
- Predições organizacionais

### 6. Evolução de Pilar Específico
**Endpoint:** `GET /api/hr/evolution/collaborators/{collaboratorId}/pillar-evolution/{pillar}`

Análise detalhada de um pilar específico:
- **Pilares disponíveis:** `BEHAVIOR`, `EXECUTION`, `MANAGEMENT`
- Breakdown por critérios individuais
- Comparação com benchmarks
- Recomendações de desenvolvimento

## 🔐 Segurança e Permissões

Todas as rotas são protegidas por:
- **Autenticação:** `JwtAuthGuard`
- **Autorização:** `HRRoleGuard` (apenas usuários com role 'rh' ou 'admin')

## 📊 Tipos de Dados Principais

### Tendências de Evolução
```typescript
{
  trend: 'improving' | 'declining' | 'stable';
  percentageChange: number;
  consecutiveCycles: number;
}
```

### Performance por Pilares
```typescript
{
  behavior: number | null;
  execution: number | null;
  management: number | null;
  bestPillar: string | null;
  worstPillar: string | null;
}
```

### Categorias de Performance
- `high-performer`: ≥ 4.5
- `solid-performer`: 3.5 - 4.4  
- `developing`: 2.5 - 3.4
- `critical`: < 2.5

## 🚀 Exemplos de Uso

### 1. Dashboard Inicial do RH
```javascript
// Buscar dados do dashboard
const dashboard = await fetch('/api/hr/evolution/dashboard', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json());

console.log(`Colaboradores: ${dashboard.organizationStats.totalCollaborators}`);
console.log(`Crescimento: ${dashboard.organizationStats.organizationGrowthPercentage}%`);
```

### 2. Lista de Colaboradores com Evolução Positiva
```javascript
// Buscar colaboradores que estão melhorando
const improving = await fetch('/api/hr/evolution/collaborators/summary?filterBy=improving&sortBy=evolution&sortOrder=desc', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json());

console.log(`${improving.length} colaboradores em evolução positiva`);
```

### 3. Análise Detalhada de um Colaborador
```javascript
// Análise completa de um colaborador específico
const collaboratorId = 'user-123';
const evolution = await fetch(`/api/hr/evolution/collaborators/${collaboratorId}/detailed`, {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json());

console.log(`Tendência geral: ${evolution.summary.overallTrend}`);
console.log(`Consistência: ${evolution.summary.consistencyScore}%`);
console.log(`Insights: ${evolution.insights.length} recomendações`);
```

### 4. Comparação de Top Performers
```javascript
// Comparar os 3 melhores performers
const comparison = await fetch('/api/hr/evolution/comparison?collaboratorIds=user-123,user-456,user-789', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json());

console.log(`Melhor performer: ${comparison.summary.topPerformer}`);
console.log(`Quem mais evoluiu: ${comparison.summary.mostImproved}`);
```

### 5. Análise de Pilar Específico
```javascript
// Analisar evolução no pilar de Comportamento
const pillarEvolution = await fetch(`/api/hr/evolution/collaborators/user-123/pillar-evolution/BEHAVIOR`, {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(res => res.json());

console.log(`Critérios no pilar: ${pillarEvolution.criterionEvolution.length}`);
console.log(`Percentil organizacional: ${pillarEvolution.benchmark.percentileRank}%`);
```

## 🔧 Configuração e Integração

### Adicionando ao Frontend

1. **Dashboard Principal:** Use o endpoint `dashboard` para criar uma tela inicial com métricas importantes
2. **Lista de Colaboradores:** Use `collaborators/summary` com filtros para criar listas interativas
3. **Página de Colaborador:** Use `detailed` para criar perfis completos de evolução
4. **Comparações:** Use `comparison` para análises lado a lado
5. **Relatórios:** Use `trends` para relatórios executivos

### Filtros e Ordenação Sugeridos

**Para Lista de Colaboradores:**
- Filtro por tendência: `improving`, `declining`, `stable`
- Filtro por performance: `high-performers`, `low-performers`
- Ordenação por: `name`, `latestScore`, `evolution`, `totalCycles`

## 📈 Dados Calculados Automaticamente

O sistema calcula automaticamente:
- **Tendências:** Baseadas em análise de regressão dos ciclos
- **Consistência:** Desvio padrão das notas ao longo do tempo
- **Benchmarking:** Comparação com médias organizacionais
- **Insights:** Identificação automática de padrões
- **Predições:** Baseadas em tendências históricas

## 🎨 Sugestões de Visualização

1. **Gráficos de Linha:** Para mostrar evolução ao longo dos ciclos
2. **Radar Charts:** Para comparar pilares (Comportamento, Execução, Gestão)
3. **Heatmaps:** Para mostrar performance por unidade de negócio
4. **Box Plots:** Para mostrar distribuição e outliers
5. **Scatter Plots:** Para correlações entre pilares

## 🚧 Funcionalidades Futuras

As seguintes funcionalidades estão marcadas como TODO no código:
- Cálculo detalhado de médias por pilar em ciclos históricos
- Análise de padrões sazonais
- Integração com benchmarks externos da indústria
- Recomendações de desenvolvimento baseadas em IA
- Alertas automáticos para situações críticas

## 🐛 Troubleshooting

### Problemas Comuns

1. **403 Forbidden:** Verificar se o usuário tem role 'rh' ou 'admin'
2. **404 Not Found:** Verificar se o collaboratorId existe
3. **400 Bad Request:** Verificar parâmetros obrigatórios na comparação
4. **Dados vazios:** Pode indicar que o colaborador não tem histórico de avaliações

### Performance

- Os dados são calculados em tempo real, mas considere implementar cache para dashboards acessados frequentemente
- Para análises de grandes volumes, considere usar os filtros para reduzir o dataset
- As predições têm maior precisão com pelo menos 3 ciclos de dados históricos

---

Este módulo foi desenvolvido para atender às necessidades do RH em análise de evolução de colaboradores, fornecendo dados ricos e insights automatizados para tomada de decisões estratégicas. [[memory:745179]] 