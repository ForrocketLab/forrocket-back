/**
 * Arquivo de índice para os critérios de avaliação
 * Centraliza todas as exportações relacionadas a critérios
 */

// Interface base
export { ICriterion } from './ICriterion';

// Critérios e funções utilitárias
export {
  // Critérios do pilar Comportamento
  SENTIMENTO_DE_DONO,
  RESILIENCIA_ADVERSIDADES,
  ORGANIZACAO_TRABALHO,
  CAPACIDADE_APRENDER,
  TEAM_PLAYER,
  
  // Critérios do pilar Execução
  ENTREGAR_QUALIDADE,
  ATENDER_PRAZOS,
  FAZER_MAIS_MENOS,
  PENSAR_FORA_CAIXA,
  
  // Critérios do pilar Gestão e Liderança
  GESTAO_GENTE,
  GESTAO_RESULTADOS,
  EVOLUCAO_ROCKET,
  
  // Arrays organizados
  ALL_CRITERIA,
  CRITERIA_BY_PILLAR,
  
  // Funções utilitárias
  getCriterionById,
  getCriteriaByPillar,
  isValidCriterionId,
  getAllPillars
} from './evaluation-criteria'; 