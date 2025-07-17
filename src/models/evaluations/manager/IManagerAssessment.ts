import { IBaseEvaluation } from '../collaborator/IBaseEvaluation';
import { ValidCriterionId } from '../collaborator/ISelfAssessment';

/**
 * Interface para uma única resposta dentro da avaliação de gestor
 * Representa a avaliação de um critério específico para um liderado
 */
export interface IManagerAssessmentAnswer {
  /** ID do critério sendo avaliado - deve ser um dos critérios válidos do sistema */
  criterionId: ValidCriterionId;
  
  /** Nota atribuída ao critério (escala de 1 a 5) */
  score: number;
  
  /** Justificativa textual para a nota atribuída */
  justification: string;
}

/**
 * Interface para a Avaliação de Gestor completa
 * Na avaliação de gestor, o autor é o gestor e o avaliado é o liderado
 */
export interface IManagerAssessment extends IBaseEvaluation {
  /** ID do usuário sendo avaliado (liderado) */
  evaluatedUserId: string;
  
  /** 
   * Lista de respostas para cada critério da avaliação
   * Cada resposta contém critério, nota e justificativa
   */
  answers: IManagerAssessmentAnswer[];
}

/**
 * Exemplo de uso:
 * 
 * const avaliacaoGestor: IManagerAssessment = {
 *   id: 'eval-123',
 *   cycle: '2025.1',
 *   authorId: 'manager-456',
 *   evaluatedUserId: 'collaborator-789',
 *   status: 'DRAFT',
 *   createdAt: new Date(),
 *   answers: [
 *     {
 *       criterionId: 'sentimento-de-dono', // ✅ Válido - TypeScript aceita
 *       score: 4,
 *       justification: 'Demonstra responsabilidade pelos resultados...'
 *     },
 *     {
 *       criterionId: 'criterio-inexistente', // ❌ Erro de TypeScript!
 *       score: 3,
 *       justification: 'Texto...'
 *     }
 *   ]
 * };
 */ 