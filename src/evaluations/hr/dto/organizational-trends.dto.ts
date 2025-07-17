import { ApiProperty } from '@nestjs/swagger';

export class PillarTrendDto {
  @ApiProperty({
    description: 'Nome do pilar',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'],
    example: 'BEHAVIOR',
  })
  pillar: 'BEHAVIOR' | 'EXECUTION' | 'MANAGEMENT';

  @ApiProperty({
    description: 'Dados históricos por ciclo',
    type: 'object',
    additionalProperties: { type: 'number', nullable: true },
    example: { '2024.1': 3.8, '2024.2': 4.0, '2025.1': 4.2 },
  })
  historicalData: Record<string, number | null>;

  @ApiProperty({
    description: 'Tendência geral',
    enum: ['improving', 'declining', 'stable'],
    example: 'improving',
  })
  trend: 'improving' | 'declining' | 'stable';

  @ApiProperty({
    description: 'Taxa de crescimento médio por ciclo',
    example: 0.15,
  })
  averageGrowthRate: number;

  @ApiProperty({
    description: 'Variação total no período analisado',
    example: 0.4,
  })
  totalVariation: number;

  @ApiProperty({
    description: 'Nível de consistência da tendência (0-100)',
    example: 87,
  })
  consistencyScore: number;
}

export class BusinessUnitTrendDto {
  @ApiProperty({
    description: 'Nome da unidade de negócio',
    example: 'Digital Products',
  })
  businessUnit: string;

  @ApiProperty({
    description: 'Número de colaboradores na unidade',
    example: 42,
  })
  collaboratorCount: number;

  @ApiProperty({
    description: 'Média atual da unidade',
    example: 4.1,
  })
  currentAverage: number;

  @ApiProperty({
    description: 'Média anterior da unidade',
    example: 3.9,
    nullable: true,
  })
  previousAverage: number | null;

  @ApiProperty({
    description: 'Taxa de crescimento da unidade',
    example: 5.13,
  })
  growthRate: number;

  @ApiProperty({
    description: 'Tendência da unidade',
    enum: ['improving', 'declining', 'stable'],
    example: 'improving',
  })
  trend: 'improving' | 'declining' | 'stable';

  @ApiProperty({
    description: 'Ranking da unidade (1 = melhor)',
    example: 2,
  })
  ranking: number;
}

export class SeniorityTrendDto {
  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Senior',
  })
  seniority: string;

  @ApiProperty({
    description: 'Número de colaboradores neste nível',
    example: 28,
  })
  collaboratorCount: number;

  @ApiProperty({
    description: 'Média atual do nível',
    example: 4.2,
  })
  currentAverage: number;

  @ApiProperty({
    description: 'Tendência do nível',
    enum: ['improving', 'declining', 'stable'],
    example: 'improving',
  })
  trend: 'improving' | 'declining' | 'stable';

  @ApiProperty({
    description: 'Taxa de crescimento do nível',
    example: 3.2,
  })
  growthRate: number;
}

export class TrendPatternDto {
  @ApiProperty({
    description: 'Tipo de padrão identificado',
    enum: ['seasonal', 'consistent_growth', 'plateau', 'volatile', 'recovery'],
    example: 'consistent_growth',
  })
  pattern: 'seasonal' | 'consistent_growth' | 'plateau' | 'volatile' | 'recovery';

  @ApiProperty({
    description: 'Descrição do padrão',
    example: 'Crescimento consistente em todos os ciclos analisados',
  })
  description: string;

  @ApiProperty({
    description: 'Força do padrão (0-100)',
    example: 92,
  })
  strength: number;

  @ApiProperty({
    description: 'Ciclos onde o padrão foi observado',
    example: ['2024.1', '2024.2', '2025.1'],
  })
  observedInCycles: string[];
}

export class OrganizationalTrendsDto {
  @ApiProperty({
    description: 'Período analisado',
  })
  period: {
    startCycle: string;
    endCycle: string;
    totalCycles: number;
  };

  @ApiProperty({
    description: 'Tendências por pilar',
    type: [PillarTrendDto],
  })
  pillarTrends: PillarTrendDto[];

  @ApiProperty({
    description: 'Tendências por unidade de negócio',
    type: [BusinessUnitTrendDto],
  })
  businessUnitTrends: BusinessUnitTrendDto[];

  @ApiProperty({
    description: 'Tendências por senioridade',
    type: [SeniorityTrendDto],
  })
  seniorityTrends: SeniorityTrendDto[];

  @ApiProperty({
    description: 'Padrões identificados',
    type: [TrendPatternDto],
  })
  patterns: TrendPatternDto[];

  @ApiProperty({
    description: 'Resumo executivo das tendências',
  })
  executiveSummary: {
    overallTrend: 'improving' | 'declining' | 'stable';
    keyFindings: string[];
    concernAreas: string[];
    opportunities: string[];
    riskFactors: string[];
  };

  @ApiProperty({
    description: 'Predições para o próximo ciclo',
  })
  predictions: {
    expectedOrganizationAverage: number | null;
    confidenceLevel: number; // 0-100
    factorsToWatch: string[];
    recommendedActions: string[];
  };

  @ApiProperty({
    description: 'Comparação com benchmarks externos (se disponível)',
    nullable: true,
  })
  externalBenchmark: {
    industryAverage: number;
    companyVsIndustry: number;
    percentileRanking: number;
  } | null;

  @ApiProperty({
    description: 'Data da análise',
    example: '2025-01-15T10:30:00Z',
  })
  analyzedAt: string;
} 