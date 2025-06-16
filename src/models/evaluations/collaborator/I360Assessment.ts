import { IBaseEvaluation } from './IBaseEvaluation';

/**
 * Interface para Avaliação 360 graus
 * Permite que um colaborador avalie um colega de trabalho
 */
export interface I360Assessment extends IBaseEvaluation {
  /** ID do colega que está sendo avaliado */
  evaluatedUserId: string;
  
  /** Nota geral atribuída ao colega (escala de 1 a 5 estrelas) */
  overallScore: number;
  
  /** Texto descrevendo os pontos fortes do colega avaliado */
  strengths: string;
  
  /** Texto descrevendo os pontos de melhoria do colega avaliado */
  improvements: string;
} 