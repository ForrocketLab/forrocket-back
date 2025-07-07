import { ApiProperty } from '@nestjs/swagger';

export class CollaboratorMetricsDto {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  collaboratorId: string;

  @ApiProperty({
    description: 'Nome do colaborador',
    example: 'João Silva',
  })
  collaboratorName: string;

  @ApiProperty({
    description: 'Cargo do colaborador',
    example: 'Desenvolvedor Senior',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Senioridade do colaborador',
    example: 'Senior',
  })
  seniority: string;

  @ApiProperty({
    description: 'Média da autoavaliação',
    example: 4.2,
    nullable: true,
  })
  selfAssessmentAverage: number | null;

  @ApiProperty({
    description: 'Média das avaliações 360',
    example: 3.8,
    nullable: true,
  })
  assessment360Average: number | null;

  @ApiProperty({
    description: 'Média da avaliação do gestor',
    example: 4.0,
    nullable: true,
  })
  managerAssessmentAverage: number | null;

  @ApiProperty({
    description: 'Nota final do comitê',
    example: 4.1,
    nullable: true,
  })
  finalScore: number | null;
}

export class TeamPerformanceComparisonDto {
  @ApiProperty({
    description: 'Desempenho médio do time por autoavaliação',
    example: 3.9,
    nullable: true,
  })
  selfAssessmentTeamAverage: number | null;

  @ApiProperty({
    description: 'Desempenho médio do time por avaliação do gestor',
    example: 3.7,
    nullable: true,
  })
  managerAssessmentTeamAverage: number | null;

  @ApiProperty({
    description: 'Desempenho médio do time por nota final',
    example: 3.8,
    nullable: true,
  })
  finalScoreTeamAverage: number | null;
}

export class BrutalFactsMetricsDto {
  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Nota média geral do overallScore (avaliações 360)',
    example: 3.85,
    nullable: true,
  })
  overallScoreAverage: number | null;

  @ApiProperty({
    description: 'Melhoria de desempenho em relação ao ciclo anterior',
    example: 0.3,
    nullable: true,
  })
  performanceImprovement: number | null;

  @ApiProperty({
    description: 'Número de colaboradores avaliados pelo gestor',
    example: 8,
  })
  collaboratorsEvaluatedCount: number;

  @ApiProperty({
    description: 'Desempenho do time por diferentes tipos de avaliação',
    type: TeamPerformanceComparisonDto,
  })
  teamPerformance: TeamPerformanceComparisonDto;

  @ApiProperty({
    description: 'Métricas detalhadas de cada colaborador',
    type: [CollaboratorMetricsDto],
  })
  collaboratorsMetrics: CollaboratorMetricsDto[];
}
