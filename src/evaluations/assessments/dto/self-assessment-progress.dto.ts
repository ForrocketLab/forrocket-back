import { ApiProperty } from '@nestjs/swagger';

// Define os pilares de avaliação com suas descrições
export enum EvaluationPillar {
  BEHAVIOR = 'Comportamento',
  EXECUTION = 'Execução',
  LEADERSHIP = 'Gestão e Liderança',
}

// Representa o progresso de preenchimento para um pilar específico
export class PillarProgressDto {
  @ApiProperty({ description: 'Número de critérios completos no pilar', example: 3 })
  completed: number;

  @ApiProperty({ description: 'Número total de critérios no pilar', example: 5 })
  total: number;
}

// Representa o status de preenchimento da autoavaliação por pilar
export class SelfAssessmentCompletionByPillarDto {
  @ApiProperty({ type: PillarProgressDto, description: 'Progresso do pilar de Comportamento' })
  [EvaluationPillar.BEHAVIOR]: PillarProgressDto;

  @ApiProperty({ type: PillarProgressDto, description: 'Progresso do pilar de Execução' })
  [EvaluationPillar.EXECUTION]: PillarProgressDto;

  @ApiProperty({ type: PillarProgressDto, description: 'Progresso do pilar de Gestão e Liderança' })
  [EvaluationPillar.LEADERSHIP]: PillarProgressDto;
}

// Representa o progresso geral da autoavaliação
export class OverallCompletionDto {
  @ApiProperty({ description: 'Número total de critérios completos', example: 10 })
  completed: number;

  @ApiProperty({ description: 'Número total de critérios na autoavaliação', example: 12 })
  total: number;
}