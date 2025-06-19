import { ApiProperty } from '@nestjs/swagger';

// DTO para o progresso de um pilar específico
export class PillarProgressDto {
  @ApiProperty({ description: 'Número de critérios preenchidos validamente neste pilar', example: 4 })
  completed: number;

  @ApiProperty({ description: 'Número total de critérios neste pilar', example: 5 })
  total: number;
}

// DTO para o progresso de preenchimento da autoavaliação por pilar
export class SelfAssessmentCompletionByPillarDto {
  @ApiProperty({ description: 'Progresso do pilar Comportamento', type: PillarProgressDto, example: { completed: 4, total: 5 } })
  comportamento: PillarProgressDto;

  @ApiProperty({ description: 'Progresso do pilar Execução', type: PillarProgressDto, example: { completed: 2, total: 4 } })
  execucao: PillarProgressDto;

  @ApiProperty({ description: 'Progresso do pilar Gestão e Liderança', type: PillarProgressDto, example: { completed: 1, total: 3 } })
  gestao: PillarProgressDto;
}

// DTO para o progresso geral da autoavaliação
export class OverallCompletionDto {
  @ApiProperty({ description: 'Total de critérios preenchidos em toda a autoavaliação', example: 7 })
  completed: number;

  @ApiProperty({ description: 'Total de critérios na autoavaliação (sempre 12)', example: 12 })
  total: number;
}