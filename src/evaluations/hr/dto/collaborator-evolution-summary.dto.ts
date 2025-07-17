import { ApiProperty } from '@nestjs/swagger';

export class EvolutionTrendDto {
  @ApiProperty({
    description: 'Tendência geral de evolução',
    enum: ['improving', 'declining', 'stable'],
    example: 'improving',
  })
  trend: 'improving' | 'declining' | 'stable';

  @ApiProperty({
    description: 'Variação percentual da evolução',
    example: 15.5,
  })
  percentageChange: number;

  @ApiProperty({
    description: 'Ciclos consecutivos com a mesma tendência',
    example: 3,
  })
  consecutiveCycles: number;
}

export class PillarPerformanceDto {
  @ApiProperty({
    description: 'Média no pilar Comportamento',
    example: 4.2,
    nullable: true,
  })
  behavior: number | null;

  @ApiProperty({
    description: 'Média no pilar Execução',
    example: 3.8,
    nullable: true,
  })
  execution: number | null;

  @ApiProperty({
    description: 'Média no pilar Gestão',
    example: 4.0,
    nullable: true,
  })
  management: number | null;

  @ApiProperty({
    description: 'Pilar com melhor performance',
    example: 'BEHAVIOR',
    nullable: true,
  })
  bestPillar: string | null;

  @ApiProperty({
    description: 'Pilar com pior performance',
    example: 'EXECUTION',
    nullable: true,
  })
  worstPillar: string | null;
}

export class CollaboratorEvolutionSummaryDto {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'user-123',
  })
  collaboratorId: string;

  @ApiProperty({
    description: 'Nome do colaborador',
    example: 'Ana Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Cargo do colaborador',
    example: 'Desenvolvedora Senior',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Senioridade',
    example: 'Senior',
  })
  seniority: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products',
  })
  businessUnit: string;

  @ApiProperty({
    description: 'Nota mais recente (final do comitê)',
    example: 4.3,
    nullable: true,
  })
  latestScore: number | null;

  @ApiProperty({
    description: 'Ciclo da avaliação mais recente',
    example: '2025.1',
    nullable: true,
  })
  latestCycle: string | null;

  @ApiProperty({
    description: 'Média histórica geral',
    example: 3.9,
  })
  historicalAverage: number;

  @ApiProperty({
    description: 'Total de ciclos participados',
    example: 5,
  })
  totalCycles: number;

  @ApiProperty({
    description: 'Análise de tendência de evolução',
    type: EvolutionTrendDto,
  })
  evolutionTrend: EvolutionTrendDto;

  @ApiProperty({
    description: 'Performance por pilares',
    type: PillarPerformanceDto,
  })
  pillarPerformance: PillarPerformanceDto;

  @ApiProperty({
    description: 'Classificação de performance',
    enum: ['high-performer', 'solid-performer', 'developing', 'critical'],
    example: 'solid-performer',
  })
  performanceCategory: 'high-performer' | 'solid-performer' | 'developing' | 'critical';

  @ApiProperty({
    description: 'Primeiro ciclo de participação',
    example: '2023.1',
    nullable: true,
  })
  firstCycle: string | null;

  @ApiProperty({
    description: 'Gestor direto (se conhecido)',
    example: 'Carlos Mendes',
    nullable: true,
  })
  managerName: string | null;
} 