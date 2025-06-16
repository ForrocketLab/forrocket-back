/**
 * Interface base comum para todas as avaliações do sistema RPE
 * Contém os campos fundamentais que toda avaliação deve possuir
 */
export interface IBaseEvaluation {
  /** ID único da avaliação (UUID) */
  id: string;
  
  /** Ciclo de avaliação a que pertence (ex: "2025.1", "2025.2") */
  cycle: string;
  
  /** ID do usuário que PREENCHEU a avaliação */
  authorId: string;
  
  /** Status atual do preenchimento da avaliação */
  status: 'DRAFT' | 'SUBMITTED';
  
  /** Data de criação da avaliação */
  createdAt: Date;
  
  /** Data de submissão da avaliação (apenas quando status = SUBMITTED) */
  submittedAt?: Date;
} 