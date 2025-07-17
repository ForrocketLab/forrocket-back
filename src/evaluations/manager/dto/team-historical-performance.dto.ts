import { ApiProperty } from '@nestjs/swagger';

export class TeamPerformanceByCycleDto {
  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Média geral das avaliações da equipe (baseada nas avaliações 360)',
    example: 3.75,
    nullable: true,
  })
  averageOverallScore: number | null;

  @ApiProperty({
    description: 'Média das autoavaliações da equipe',
    example: 3.8,
    nullable: true,
  })
  averageSelfAssessment: number | null;

  @ApiProperty({
    description: 'Média das avaliações 360 recebidas pela equipe',
    example: 3.7,
    nullable: true,
  })
  averageReceived360: number | null;

  @ApiProperty({
    description: 'Número total de colaboradores considerados no cálculo',
    example: 8,
  })
  totalCollaborators: number;
}

export class TeamHistoricalPerformanceResponseDto {
  @ApiProperty({
    description: 'ID do gestor',
    example: 'cluid123456789',
  })
  managerId: string;

  @ApiProperty({
    description: 'Performance histórica da equipe por ciclo',
    type: [TeamPerformanceByCycleDto],
  })
  performanceByCycle: TeamPerformanceByCycleDto[];

  @ApiProperty({
    description: 'Total de ciclos analisados',
    example: 3,
  })
  totalCycles: number;
}
