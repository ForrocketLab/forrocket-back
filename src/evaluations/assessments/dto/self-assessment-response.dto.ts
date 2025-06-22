import { ApiProperty } from '@nestjs/swagger';
import { ISelfAssessment, ISelfAssessmentAnswer } from '../../../models/evaluations/collaborator/ISelfAssessment'; // Mantém ISelfAssessment e ISelfAssessmentAnswer daqui
import { EvaluationStatus } from '../../../models/evaluations/collaborator'; // Importa EvaluationStatus do index
import {
  OverallCompletionDto,
  SelfAssessmentCompletionByPillarDto,
} from './self-assessment-progress.dto'; // Importa os DTOs de progresso do novo arquivo

class SelfAssessmentAnswerDto implements ISelfAssessmentAnswer {
  @ApiProperty({ description: 'ID do critério de avaliação', example: 'sentimento-de-dono' })
  criterionId: string;

  @ApiProperty({ description: 'Pontuação dada (1 a 5)', example: 4 })
  score: number;

  @ApiProperty({ description: 'Justificativa para a pontuação', example: 'Excelente proatividade e senso de responsabilidade.' })
  justification: string;
}

export class SelfAssessmentResponseDto implements ISelfAssessment {
  @ApiProperty({ description: 'ID único da autoavaliação', example: 'cluid123456789' })
  id: string;

  @ApiProperty({ description: 'ID do autor da autoavaliação', example: 'user-id-abc' })
  authorId: string;

  @ApiProperty({ description: 'Ciclo de avaliação', example: '2025.1' })
  cycle: string;

  @ApiProperty({ enum: EvaluationStatus, description: 'Status da avaliação', example: EvaluationStatus.SUBMITTED })
  status: EvaluationStatus;

  @ApiProperty({ description: 'Data de criação da avaliação', example: '2025-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Última data de atualização da avaliação', example: '2025-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Data de submissão da avaliação', example: '2025-01-16T12:00:00Z', required: false })
  submittedAt?: Date;

  @ApiProperty({ type: [SelfAssessmentAnswerDto], description: 'Lista de respostas detalhadas para cada critério' })
  answers: SelfAssessmentAnswerDto[];

  @ApiProperty({ type: SelfAssessmentCompletionByPillarDto, description: 'Status de preenchimento por pilar', required: false })
  completionStatus?: SelfAssessmentCompletionByPillarDto;

  @ApiProperty({ type: OverallCompletionDto, description: 'Progresso geral da autoavaliação (X/12)', required: false })
  overallCompletion?: OverallCompletionDto;
}