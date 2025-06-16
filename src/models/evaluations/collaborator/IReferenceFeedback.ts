import { IBaseEvaluation } from './IBaseEvaluation';

/**
 * Interface para Feedback de Referências
 * Permite que um colaborador forneça uma referência sobre um colega
 * Este tipo de avaliação não possui nota, apenas feedback textual
 */
export interface IReferenceFeedback extends IBaseEvaluation {
  /** ID do colega a quem se está dando a referência */
  referencedUserId: string;
  
  /** Texto da referência/feedback sobre o colega */
  justification: string;
} 