import { ApiProperty } from '@nestjs/swagger';
import { AssessmentStatus } from '@prisma/client';

export class MentoredCollaboratorDto {
  @ApiProperty({
    description: 'ID do colaborador mentorado',
    example: 'cluid123456789',
  })
  collaboratorId: string;

  @ApiProperty({
    description: 'Nome do colaborador mentorado',
    example: 'João Silva',
  })
  collaboratorName: string;

  @ApiProperty({
    description: 'Email do colaborador',
    example: 'joao.silva@rocket.com',
  })
  collaboratorEmail: string;

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
    description: 'Status da avaliação de mentor para este colaborador',
    enum: AssessmentStatus,
    example: AssessmentStatus.SUBMITTED,
  })
  mentorAssessmentStatus: AssessmentStatus;

  @ApiProperty({
    description: 'Média da autoavaliação do colaborador',
    example: 4.2,
    nullable: true,
  })
  selfAssessmentAverage: number | null;

  @ApiProperty({
    description: 'Média das avaliações de gestor recebidas pelo colaborador',
    example: 3.8,
    nullable: true,
  })
  managerAssessmentAverage: number | null;

  @ApiProperty({
    description: 'Iniciais do colaborador para exibição',
    example: 'JS',
  })
  initials: string;
}

export class MentorDashboardSummaryDto {
  @ApiProperty({
    description: 'Média das avaliações de mentoring recebidas pelo mentor',
    example: 4.3,
    nullable: true,
  })
  mentoringAssessmentAverage: number | null;

  @ApiProperty({
    description: 'Número de avaliações pendentes como mentor',
    example: 2,
  })
  pendingReviews: number;

  @ApiProperty({
    description: 'Total de colaboradores mentorados',
    example: 5,
  })
  totalMentoredCollaborators: number;

  @ApiProperty({
    description: 'Percentual de conclusão das avaliações de mentor',
    example: 60,
  })
  completionPercentage: number;
}

export class MentorDashboardResponseDto {
  @ApiProperty({
    description: 'Resumo estatístico do mentor',
    type: MentorDashboardSummaryDto,
  })
  summary: MentorDashboardSummaryDto;

  @ApiProperty({
    description: 'Lista de colaboradores mentorados com seus status',
    type: [MentoredCollaboratorDto],
  })
  mentoredCollaborators: MentoredCollaboratorDto[];

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  cycle: string;
}

export class MentorAssessmentResponseDto {
  @ApiProperty({
    description: 'ID da avaliação',
    example: 'cluid123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'ID do mentor (autor da avaliação)',
    example: 'mentor-id',
  })
  authorId: string;

  @ApiProperty({
    description: 'ID do colaborador avaliado',
    example: 'collaborator-id',
  })
  evaluatedUserId: string;

  @ApiProperty({
    description: 'Status da avaliação',
    enum: AssessmentStatus,
    example: AssessmentStatus.DRAFT,
  })
  status: AssessmentStatus;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-15T15:45:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Data de submissão',
    example: '2025-01-15T16:00:00Z',
    nullable: true,
  })
  submittedAt: Date | null;

  @ApiProperty({
    description: 'Informações do colaborador avaliado',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      jobTitle: { type: 'string' },
      seniority: { type: 'string' },
    },
  })
  evaluatedUser: {
    id: string;
    name: string;
    email: string;
    jobTitle: string;
    seniority: string;
  };

  @ApiProperty({
    description: 'Respostas da avaliação por critério',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        criterionId: { type: 'string' },
        score: { type: 'number' },
        justification: { type: 'string' },
      },
    },
  })
  answers: Array<{
    id: string;
    criterionId: string;
    score: number;
    justification: string;
  }>;
}
