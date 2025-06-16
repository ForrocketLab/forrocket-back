import { ICriterion } from './ICriterion';

/**
 * Critérios de Avaliação do Sistema RPE
 * 
 * Organizados em 3 pilares: Comportamento, Execução e Gestão e Liderança
 */

// ==========================================
// PILAR: COMPORTAMENTO
// ==========================================

export const SENTIMENTO_DE_DONO: ICriterion = {
  id: 'sentimento-de-dono',
  name: 'Sentimento de Dono',
  description: 'Demonstra responsabilidade pelos resultados, toma iniciativa e age como se fosse dono do negócio',
  pillar: 'comportamento'
};

export const RESILIENCIA_ADVERSIDADES: ICriterion = {
  id: 'resiliencia-adversidades',
  name: 'Resiliência nas Adversidades',
  description: 'Mantém-se firme e positivo diante de desafios, adapta-se bem a mudanças e supera obstáculos',
  pillar: 'comportamento'
};

export const ORGANIZACAO_TRABALHO: ICriterion = {
  id: 'organizacao-trabalho',
  name: 'Organização no Trabalho',
  description: 'Mantém organização pessoal, planeja bem as atividades e gerencia eficientemente o tempo',
  pillar: 'comportamento'
};

export const CAPACIDADE_APRENDER: ICriterion = {
  id: 'capacidade-aprender',
  name: 'Capacidade de Aprender',
  description: 'Demonstra curiosidade, busca constantemente novos conhecimentos e aplica o que aprende',
  pillar: 'comportamento'
};

export const TEAM_PLAYER: ICriterion = {
  id: 'team-player',
  name: 'Ser "Team Player"',
  description: 'Trabalha bem em equipe, colabora ativamente, compartilha conhecimento e ajuda colegas',
  pillar: 'comportamento'
};

// ==========================================
// PILAR: EXECUÇÃO
// ==========================================

export const ENTREGAR_QUALIDADE: ICriterion = {
  id: 'entregar-qualidade',
  name: 'Entregar com Qualidade',
  description: 'Entrega trabalhos com alta qualidade, atenção aos detalhes e seguindo padrões estabelecidos',
  pillar: 'execucao'
};

export const ATENDER_PRAZOS: ICriterion = {
  id: 'atender-prazos',
  name: 'Atender aos Prazos',
  description: 'Cumpre prazos estabelecidos, gerencia bem o tempo e comunica antecipadamente possíveis atrasos',
  pillar: 'execucao'
};

export const FAZER_MAIS_MENOS: ICriterion = {
  id: 'fazer-mais-menos',
  name: 'Fazer Mais com Menos',
  description: 'Otimiza recursos, encontra soluções eficientes e maximiza resultados com recursos limitados',
  pillar: 'execucao'
};

export const PENSAR_FORA_CAIXA: ICriterion = {
  id: 'pensar-fora-caixa',
  name: 'Pensar Fora da Caixa',
  description: 'Demonstra criatividade, propõe soluções inovadoras e aborda problemas de forma não convencional',
  pillar: 'execucao'
};

// ==========================================
// PILAR: GESTÃO E LIDERANÇA
// ==========================================

export const GESTAO_GENTE: ICriterion = {
  id: 'gestao-gente',
  name: 'Gente',
  description: 'Desenvolve pessoas, inspira e motiva a equipe, promove um ambiente colaborativo e de crescimento',
  pillar: 'gestao'
};

export const GESTAO_RESULTADOS: ICriterion = {
  id: 'gestao-resultados',
  name: 'Resultados',
  description: 'Foca na entrega de resultados, define metas claras e acompanha o desempenho da equipe',
  pillar: 'gestao'
};

export const EVOLUCAO_ROCKET: ICriterion = {
  id: 'evolucao-rocket',
  name: 'Evolução da Rocket Corp',
  description: 'Contribui ativamente para o crescimento e evolução da empresa, propõe melhorias e inovações',
  pillar: 'gestao'
};

// ==========================================
// ARRAYS DE CRITÉRIOS ORGANIZADOS
// ==========================================

/** Todos os critérios disponíveis no sistema */
export const ALL_CRITERIA: ICriterion[] = [
  // Comportamento
  SENTIMENTO_DE_DONO,
  RESILIENCIA_ADVERSIDADES,
  ORGANIZACAO_TRABALHO,
  CAPACIDADE_APRENDER,
  TEAM_PLAYER,
  
  // Execução
  ENTREGAR_QUALIDADE,
  ATENDER_PRAZOS,
  FAZER_MAIS_MENOS,
  PENSAR_FORA_CAIXA,
  
  // Gestão e Liderança
  GESTAO_GENTE,
  GESTAO_RESULTADOS,
  EVOLUCAO_ROCKET
];

/** Critérios por pilar */
export const CRITERIA_BY_PILLAR = {
  comportamento: ALL_CRITERIA.filter(c => c.pillar === 'comportamento'),
  execucao: ALL_CRITERIA.filter(c => c.pillar === 'execucao'),
  gestao: ALL_CRITERIA.filter(c => c.pillar === 'gestao')
};

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

/**
 * Busca um critério pelo ID
 */
export function getCriterionById(id: string): ICriterion | undefined {
  return ALL_CRITERIA.find(criterion => criterion.id === id);
}

/**
 * Obtém critérios de um pilar específico
 */
export function getCriteriaByPillar(pillar: string): ICriterion[] {
  return ALL_CRITERIA.filter(criterion => criterion.pillar === pillar);
}

/**
 * Valida se um criterionId é válido
 */
export function isValidCriterionId(criterionId: string): boolean {
  return ALL_CRITERIA.some(criterion => criterion.id === criterionId);
}

/**
 * Obtém todos os pilares disponíveis
 */
export function getAllPillars(): string[] {
  return ['comportamento', 'execucao', 'gestao'];
} 