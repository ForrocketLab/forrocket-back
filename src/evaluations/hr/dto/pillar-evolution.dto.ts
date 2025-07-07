import { ApiProperty } from '@nestjs/swagger';

export class AssessmentTypeBreakdownDto {
  @ApiProperty({
    description: 'Média nas autoavaliações',
    example: 4.2,
    nullable: true,
  })
  selfAssessment: number | null;

  @ApiProperty({
    description: 'Média nas avaliações de gestor',
    example: 3.8,
    nullable: true,
  })
  managerAssessment: number | null;

  @ApiProperty({
    description: 'Nota final do comitê (se disponível)',
    example: 4.0,
    nullable: true,
  })
  committeeFinal: number | null;

  @ApiProperty({
    description: 'Diferença entre autoavaliação e avaliação do gestor',
    example: 0.4,
    nullable: true,
  })
  selfVsManagerGap: number | null;
}

export class PillarBenchmarkDto {
  @ApiProperty({
    description: 'Comparação com média organizacional do pilar',
    example: 0.3,
  })
  vsOrganizationAverage: number;

  @ApiProperty({
    description: 'Percentil do colaborador neste pilar (0-100)',
    example: 78,
  })
  percentileRank: number;

  @ApiProperty({
    description: 'Posição relativa entre pares da mesma senioridade',
    example: 'Top 25%',
  })
  seniorityRanking: string;

  @ApiProperty({
    description: 'Posição relativa entre pares da mesma função',
    example: 'Top 15%',
  })
  roleRanking: string;
}

export class PillarInsightDto {
  @ApiProperty({
    description: 'Tipo do insight',
    enum: ['strength', 'weakness', 'improvement', 'concern', 'trend'],
    example: 'strength',
  })
  type: 'strength' | 'weakness' | 'improvement' | 'concern' | 'trend';

  @ApiProperty({
    description: 'Descrição do insight',
    example: 'Critério "Sentimento de Dono" mostra crescimento consistente e é o ponto forte do pilar',
  })
  description: string;

  @ApiProperty({
    description: 'Critério relacionado (se aplicável)',
    example: 'sentimento-de-dono',
    nullable: true,
  })
  relatedCriterion: string | null;

  @ApiProperty({
    description: 'Valor numérico associado',
    example: 4.5,
    nullable: true,
  })
  value: number | null;

  @ApiProperty({
    description: 'Prioridade do insight',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  priority: 'high' | 'medium' | 'low';
}

export class PillarCriterionEvolutionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  pillar: string;

  @ApiProperty()
  selfAverage: number;

  @ApiProperty()
  managerAverage: number;

  @ApiProperty()
  committeeAverage: number;
}

export class PillarEvolutionDetailedDto {
  @ApiProperty()
  pillar: string;

  @ApiProperty()
  average: number;

  @ApiProperty()
  trend: string;

  @ApiProperty({ type: [PillarCriterionEvolutionDto] })
  criteria: PillarCriterionEvolutionDto[];

  @ApiProperty({
    description: 'Resumo estatístico do pilar',
  })
  summary: {
    currentAverage: number | null;
    historicalAverage: number;
    bestScore: number | null;
    worstScore: number | null;
    totalCycles: number;
    overallTrend: 'improving' | 'declining' | 'stable';
    totalVariation: number;
    consistencyScore: number; // 0-100
  };

  @ApiProperty({
    description: 'Dados históricos agregados do pilar por ciclo',
    type: 'object',
    additionalProperties: { type: 'number', nullable: true },
    example: { '2024.1': 3.8, '2024.2': 4.0, '2025.1': 4.2 },
  })
  historicalData: Record<string, number | null>;

  @ApiProperty({
    description: 'Breakdown por tipo de avaliação',
  })
  assessmentTypeBreakdown: Record<string, AssessmentTypeBreakdownDto>;

  @ApiProperty({
    description: 'Comparações e benchmarks',
  })
  benchmark: PillarBenchmarkDto;

  @ApiProperty({
    description: 'Insights específicos do pilar',
  })
  insights: PillarInsightDto[];

  @ApiProperty({
    description: 'Recomendações específicas para desenvolvimento',
    example: [
      'Continuar fortalecendo "Sentimento de Dono" através de projetos de liderança',
      'Focar no desenvolvimento de "Organização no Trabalho" que está abaixo da média'
    ],
  })
  developmentRecommendations: string[];

  @ApiProperty({
    description: 'Predição para próximo ciclo',
  })
  prediction: {
    expectedScore: number | null;
    confidenceLevel: number; // 0-100
    keyFactors: string[];
  };

  @ApiProperty({
    description: 'Data da análise',
    example: '2025-01-15T10:30:00Z',
  })
  analyzedAt: string;
} 