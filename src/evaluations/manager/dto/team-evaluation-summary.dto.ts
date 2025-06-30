import { ApiProperty } from '@nestjs/swagger';

export class TeamStatsDto {
  @ApiProperty({
    description: 'Número total de colaboradores na equipe',
    example: 8,
  })
  totalCollaborators: number;

  @ApiProperty({
    description: 'Média geral da equipe',
    example: 3.82,
  })
  teamAverageScore: number;

  @ApiProperty({
    description: 'Número de colaboradores com alto desempenho (≥4.5)',
    example: 2,
  })
  highPerformers: number;

  @ApiProperty({
    description: 'Número de colaboradores com baixo desempenho (≤2.5)',
    example: 1,
  })
  lowPerformers: number;
}

export class TeamEvaluationSummaryResponseDto {
  @ApiProperty({
    description: 'Ciclo de avaliação analisado',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Resumo inteligente gerado pela IA sobre a equipe',
    example:
      'A equipe apresenta performance variada com média de 3.8. Identificamos 2 colaboradores de alto desempenho que podem servir como mentores...',
  })
  teamSummary: string;

  @ApiProperty({
    description: 'Estatísticas da equipe',
    type: TeamStatsDto,
  })
  teamStats: TeamStatsDto;
}
