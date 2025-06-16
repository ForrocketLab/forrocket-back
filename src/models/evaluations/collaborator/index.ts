/**
 * Arquivo de índice para as interfaces de avaliação do colaborador
 * Facilita a importação das interfaces em outros módulos
 */

// Interface base
export { IBaseEvaluation } from './IBaseEvaluation';

// Interfaces específicas do colaborador
export { ISelfAssessment, ISelfAssessmentAnswer, ValidCriterionId } from './ISelfAssessment';
export { I360Assessment } from './I360Assessment';
export { IMentoringAssessment } from './IMentoringAssessment';
export { IReferenceFeedback } from './IReferenceFeedback';

// Importações para uso interno nos tipos utilitários
import { ISelfAssessment } from './ISelfAssessment';
import { I360Assessment } from './I360Assessment';
import { IMentoringAssessment } from './IMentoringAssessment';
import { IReferenceFeedback } from './IReferenceFeedback';

// Tipos utilitários para facilitar o uso
export type CollaboratorEvaluationType = 
  | ISelfAssessment 
  | I360Assessment 
  | IMentoringAssessment 
  | IReferenceFeedback;

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED'; 