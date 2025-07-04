import { ApiProperty } from '@nestjs/swagger';

export class OrganizationStatsDto {
  @ApiProperty({
    description: 'Total de colaboradores ativos',
    example: 125,
  })
  totalCollaborators: number;

  @ApiProperty({
    description: 'Colaboradores com dados históricos (participaram de pelo menos 2 ciclos)',
    example: 98,
  })
  collaboratorsWithHistory: number;

  @ApiProperty({
    description: 'Média geral da organização no último ciclo',
    example: 3.87,
  })
  currentOverallAverage: number;

  @ApiProperty({
    description: 'Média geral da organização no ciclo anterior',
    example: 3.72,
    nullable: true,
  })
  previousOverallAverage: number | null;

  @ApiProperty({
    description: 'Mudança percentual da média organizacional',
    example: 4.03,
  })
  organizationGrowthPercentage: number;
}

export class PerformanceDistributionDto {
  @ApiProperty({
    description: 'Colaboradores com alta performance (>= 4.5)',
    example: 23,
  })
  highPerformers: number;

  @ApiProperty({
    description: 'Colaboradores com performance sólida (3.5 - 4.4)',
    example: 67,
  })
  solidPerformers: number;

  @ApiProperty({
    description: 'Colaboradores em desenvolvimento (2.5 - 3.4)',
    example: 28,
  })
  developing: number;

  @ApiProperty({
    description: 'Colaboradores em situação crítica (< 2.5)',
    example: 7,
  })
  critical: number;

  @ApiProperty({
    description: 'Percentuais correspondentes',
  })
  percentages: {
    highPerformers: number;
    solidPerformers: number;
    developing: number;
    critical: number;
  };
}

export class TrendAnalysisDto {
  @ApiProperty({
    description: 'Colaboradores com tendência de melhoria',
    example: 45,
  })
  improving: number;

  @ApiProperty({
    description: 'Colaboradores com tendência de declínio',
    example: 12,
  })
  declining: number;

  @ApiProperty({
    description: 'Colaboradores com performance estável',
    example: 41,
  })
  stable: number;

  @ApiProperty({
    description: 'Pilar com maior crescimento organizacional',
    example: 'BEHAVIOR',
  })
  fastestGrowingPillar: string;

  @ApiProperty({
    description: 'Pilar que precisa mais atenção',
    example: 'EXECUTION',
  })
  pillarNeedingAttention: string;
}

export class CycleHistoryDto {
  @ApiProperty({
    description: 'Nome do ciclo',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Média organizacional no ciclo',
    example: 3.87,
  })
  organizationAverage: number;

  @ApiProperty({
    description: 'Número de colaboradores avaliados',
    example: 98,
  })
  collaboratorsEvaluated: number;

  @ApiProperty({
    description: 'Médias por pilar',
  })
  pillarAverages: {
    behavior: number | null;
    execution: number | null;
    management: number | null;
  };
}

export class HighlightDto {
  @ApiProperty({
    description: 'Tipo do destaque',
    enum: ['achievement', 'concern', 'trend', 'milestone'],
    example: 'achievement',
  })
  type: 'achievement' | 'concern' | 'trend' | 'milestone';

  @ApiProperty({
    description: 'Título do destaque',
    example: 'Maior crescimento trimestral já registrado',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada',
    example: 'A organização registrou crescimento de 4.03% na média geral, o maior já registrado em um trimestre.',
  })
  description: string;

  @ApiProperty({
    description: 'Valor numérico relacionado (se aplicável)',
    example: 4.03,
    nullable: true,
  })
  value: number | null;

  @ApiProperty({
    description: 'Nível de prioridade',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  priority: 'high' | 'medium' | 'low';
}

export class HRDashboardDto {
  @ApiProperty({
    description: 'Estatísticas gerais da organização',
    type: () => OrganizationStatsDto,
  })
  organizationStats: {
    totalCollaborators: number;
    collaboratorsWithHistory: number;
    currentOverallAverage: number;
    previousOverallAverage: number | null;
    organizationGrowthPercentage: number;
  };

  @ApiProperty({
    description: 'Distribuição de performance dos colaboradores',
    type: () => PerformanceDistributionDto,
  })
  performanceDistribution: {
    highPerformers: number;
    solidPerformers: number;
    developing: number;
    critical: number;
  };

  @ApiProperty({
    description: 'Análise de tendências',
    type: () => TrendAnalysisDto,
  })
  trendAnalysis: {
    improving: number;
    declining: number;
    stable: number;
    fastestGrowingPillar: string;
    pillarNeedingAttention: string;
  };

  @ApiProperty({
    description: 'Destaques importantes',
    type: () => [HighlightDto],
  })
  highlights: any[];

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-06-15T23:32:14Z',
  })
  lastUpdated: string;
} 