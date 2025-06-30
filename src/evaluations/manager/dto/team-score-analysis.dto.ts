import { ApiProperty } from '@nestjs/swagger';

export class TeamScoreStatsDto {
  @ApiProperty({
    description: 'Número total de colaboradores na equipe',
    example: 8,
  })
  totalCollaborators: number;

  @ApiProperty({
    description: 'Média geral da equipe baseada nas notas finais',
    example: 3.82,
  })
  teamAverageScore: number;

  @ApiProperty({
    description: 'Média do pilar Comportamento',
    example: 3.95,
    required: false,
  })
  behaviorAverage?: number;

  @ApiProperty({
    description: 'Média do pilar Execução',
    example: 3.7,
    required: false,
  })
  executionAverage?: number;

  @ApiProperty({
    description: 'Número de colaboradores com alto desempenho (≥4.5)',
    example: 2,
  })
  highPerformers: number;

  @ApiProperty({
    description: 'Número de colaboradores em zona crítica (≤2.5)',
    example: 0,
  })
  criticalPerformers: number;
}

export class TeamScoreAnalysisResponseDto {
  @ApiProperty({
    description: 'Ciclo de avaliação analisado',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Resumo estratégico gerado pela IA baseado nas notas finais por pilar',
    example:
      'Nenhum colaborador em zona crítica de desempenho. A equipe demonstra equilíbrio entre competências comportamentais e de execução, com leve destaque para comportamento.',
  })
  scoreAnalysis: string;

  @ApiProperty({
    description: 'Estatísticas quantitativas da equipe por pilar',
    type: TeamScoreStatsDto,
  })
  teamStats: TeamScoreStatsDto;
}
