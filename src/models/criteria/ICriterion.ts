/**
 * Interface para definir um critério de avaliação
 */
export interface ICriterion {
  /** ID único do critério (usado como criterionId nas avaliações) */
  id: string;
  
  /** Nome do critério */
  name: string;
  
  /** Descrição detalhada do critério */
  description: string;
  
  /** Pilar do critério (comportamento, execucao, gestao) */
  pillar: string;
} 