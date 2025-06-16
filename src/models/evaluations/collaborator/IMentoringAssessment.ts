import { IBaseEvaluation } from './IBaseEvaluation';

/**
 * Interface para Avaliação de Mentoring
 * Permite que um colaborador avalie seu mentor
 */
export interface IMentoringAssessment extends IBaseEvaluation {
  /** ID do mentor que está sendo avaliado */
  mentorId: string;
  
  /** Nota atribuída ao mentor (escala de 1 a 5) */
  score: number;
  
  /** Justificativa textual para a avaliação do mentor */
  justification: string;
} 