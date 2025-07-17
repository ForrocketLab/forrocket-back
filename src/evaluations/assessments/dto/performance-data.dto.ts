import { ApiProperty } from '@nestjs/swagger';
import { ManagerAssessment, SelfAssessment } from '@prisma/client';
import { PillarScores } from './pillar-scores.dto';

export class PerformanceDataDto {
  @ApiProperty({
    example: '2025.1',
    description: 'O nome do ciclo de avaliação.',
  })
  cycle: string;

  @ApiProperty({
    example: 4.2,
    nullable: true,
    description: 'A nota média da autoavaliação do colaborador. Nulo se não houver.',
  })
  selfScore: PillarScores;

  @ApiProperty({
    example: 4.5,
    nullable: true,
    description: 'A nota média da avaliação do gestor para o colaborador. Nulo se não houver.',
  })
  managerScore: PillarScores;

  @ApiProperty({
    example: 4.3,
    nullable: true,
    description: 'A nota final de equalização do comitê. Nulo se não houver.',
  })
  finalScore: number | null;
}

export type AnswerWithCriterion = {
  criterionId: string;
  score: number;
};

export type AssessmentWithAnswers = SelfAssessment | ManagerAssessment;
