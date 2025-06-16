import { IBaseEvaluation } from './IBaseEvaluation';
import { ALL_CRITERIA } from '../../criteria';

/**
 * Tipo union com todos os IDs de critérios válidos
 * Garante que apenas critérios existentes sejam usados
 */
export type ValidCriterionId = typeof ALL_CRITERIA[number]['id'];

/**
 * Interface para uma única resposta dentro da autoavaliação
 * Representa a avaliação de um critério específico
 */
export interface ISelfAssessmentAnswer {
  /** ID do critério sendo avaliado - deve ser um dos critérios válidos do sistema */
  criterionId: ValidCriterionId;
  
  /** Nota atribuída ao critério (escala de 1 a 5) */
  score: number;
  
  /** Justificativa textual para a nota atribuída */
  justification: string;
}

/**
 * Interface para a Autoavaliação completa do colaborador
 * Na autoavaliação, o autor e o avaliado são a mesma pessoa
 */
export interface ISelfAssessment extends IBaseEvaluation {
  /** 
   * Lista de respostas para cada critério da autoavaliação
   * Cada resposta contém critério, nota e justificativa
   */
  answers: ISelfAssessmentAnswer[];
}

/**
 * Exemplo de uso:
 * 
 * const autoavaliacao: ISelfAssessment = {
 *   id: 'eval-123',
 *   cycle: '2025.1',
 *   authorId: 'user-456',
 *   status: 'DRAFT',
 *   createdAt: new Date(),
 *   answers: [
 *     {
 *       criterionId: 'sentimento-de-dono', // ✅ Válido - TypeScript aceita
 *       score: 4,
 *       justification: 'Demonstro responsabilidade...'
 *     },
 *     {
 *       criterionId: 'criterio-inexistente', // ❌ Erro de TypeScript!
 *       score: 3,
 *       justification: 'Texto...'
 *     }
 *   ]
 * };
 */ 