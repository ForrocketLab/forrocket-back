import { ApiProperty } from '@nestjs/swagger';

// Este DTO representa um único liderado na tabela do dashboard.
class DashboardSubordinateDto {
  @ApiProperty({ example: 'user-id-123' })
  id: string;

  @ApiProperty({ example: 'Ana Oliveira' })
  name: string;

  @ApiProperty({ example: 'AO' })
  initials: string;

  @ApiProperty({ example: 'Product Designer' })
  jobTitle: string;

  @ApiProperty({ enum: ['Pendente', 'Em andamento', 'Finalizado'] })
  status: string;

  @ApiProperty({ type: 'number', nullable: true, example: 4.5 })
  selfAssessmentScore: number | null;

  @ApiProperty({ type: 'number', nullable: true, example: 4.8 })
  managerScore: number | null;
}

// Este DTO agrupa os liderados por projeto.
class ManagerDashboardProjectGroupDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ type: [DashboardSubordinateDto] })
  subordinates: DashboardSubordinateDto[];
}

// Este é o DTO principal da resposta do endpoint.
export class ManagerDashboardResponseDto {
  @ApiProperty({ type: () => ManagerDashboardSummaryDto }) // Usando uma função para evitar problemas de referência circular
  summary: ManagerDashboardSummaryDto;

  @ApiProperty({ type: [ManagerDashboardProjectGroupDto] })
  collaboratorsInfo: ManagerDashboardProjectGroupDto[];
}

// DTO para o objeto de resumo dos cards.
class ManagerDashboardSummaryDto {
  @ApiProperty({ type: 'number', nullable: true, example: 4.8 })
  overallScore: number | null;

  @ApiProperty({ type: 'number', example: 60 })
  completionPercentage: number;

  @ApiProperty({ type: 'number', example: 7 })
  incompleteReviews: number;
}
