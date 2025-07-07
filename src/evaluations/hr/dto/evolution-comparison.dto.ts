import { ApiProperty } from '@nestjs/swagger';

export class CollaboratorComparisonDataDto {
  @ApiProperty({
    description: 'Informações básicas do colaborador',
  })
  collaborator: {
    id: string;
    name: string;
    jobTitle: string;
    seniority: string;
    businessUnit: string;
  };

  @ApiProperty({
    description: 'Dados históricos por ciclo',
    type: 'object',
    additionalProperties: { type: 'number', nullable: true },
    example: { '2024.1': 3.8, '2024.2': 4.0, '2025.1': 4.2 },
  })
  historicalData: Record<string, number | null>;

  @ApiProperty({
    description: 'Dados por pilar (se aplicável)',
    nullable: true,
  })
  pillarData: Record<string, Record<string, number | null>> | null;

  @ApiProperty({
    description: 'Estatísticas do colaborador',
  })
  stats: {
    average: number;
    trend: 'improving' | 'declining' | 'stable';
    totalCycles: number;
    growthRate: number;
    consistency: number; // 0-100
  };
}

export class ComparisonInsightDto {
  @ApiProperty({
    description: 'Tipo do insight',
    enum: ['leader', 'laggard', 'most_improved', 'most_consistent', 'outlier'],
    example: 'most_improved',
  })
  type: 'leader' | 'laggard' | 'most_improved' | 'most_consistent' | 'outlier';

  @ApiProperty({
    description: 'ID do colaborador relacionado ao insight',
    example: 'user-123',
  })
  collaboratorId: string;

  @ApiProperty({
    description: 'Nome do colaborador',
    example: 'Ana Silva',
  })
  collaboratorName: string;

  @ApiProperty({
    description: 'Descrição do insight',
    example: 'Apresentou o maior crescimento no período analisado (+18%)',
  })
  description: string;

  @ApiProperty({
    description: 'Valor associado ao insight',
    example: 18.0,
    nullable: true,
  })
  value: number | null;
}

export class ComparisonSummaryDto {
  @ApiProperty({
    description: 'Número de colaboradores comparados',
    example: 3,
  })
  totalCollaborators: number;

  @ApiProperty({
    description: 'Ciclos incluídos na comparação',
    example: ['2024.1', '2024.2', '2025.1'],
  })
  cyclesIncluded: string[];

  @ApiProperty({
    description: 'Pilar analisado (se específico)',
    example: 'BEHAVIOR',
    nullable: true,
  })
  pillarFocus: string | null;

  @ApiProperty({
    description: 'Média geral do grupo',
    example: 3.87,
  })
  groupAverage: number;

  @ApiProperty({
    description: 'Desvio padrão do grupo',
    example: 0.42,
  })
  groupStandardDeviation: number;

  @ApiProperty({
    description: 'Maior diferença entre colaboradores',
    example: 1.2,
  })
  maxDifference: number;

  @ApiProperty({
    description: 'Colaborador com melhor performance média',
    example: 'Ana Silva',
  })
  topPerformer: string;

  @ApiProperty({
    description: 'Colaborador com maior crescimento',
    example: 'Carlos Mendes',
  })
  mostImproved: string;
}

export class EvolutionComparisonDto {
  @ApiProperty({
    description: 'Resumo da comparação',
    type: ComparisonSummaryDto,
  })
  summary: ComparisonSummaryDto;

  @ApiProperty({
    description: 'Dados de cada colaborador',
    type: [CollaboratorComparisonDataDto],
  })
  collaborators: CollaboratorComparisonDataDto[];

  @ApiProperty({
    description: 'Insights gerados pela comparação',
    type: [ComparisonInsightDto],
  })
  insights: ComparisonInsightDto[];

  @ApiProperty({
    description: 'Dados agregados por ciclo (médias do grupo)',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { '2024.1': 3.7, '2024.2': 3.8, '2025.1': 3.9 },
  })
  groupAveragesByCycle: Record<string, number>;

  @ApiProperty({
    description: 'Recomendações baseadas na comparação',
    example: [
      'Investigar práticas de Ana Silva para replicar em outros colaboradores',
      'Oferecer suporte adicional para Carlos na área de Execução'
    ],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Data e hora da análise',
    example: '2025-01-15T10:30:00Z',
  })
  analyzedAt: string;
} 