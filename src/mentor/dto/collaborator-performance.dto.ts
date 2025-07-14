import { ApiProperty } from '@nestjs/swagger';
import { AssessmentStatus, CriterionPillar } from '@prisma/client';

export class CollaboratorAssessmentAnswerDto {
  @ApiProperty({
    description: 'ID do critério',
    example: 'sentimento-de-dono',
  })
  criterionId: string;

  @ApiProperty({
    description: 'Nome do critério',
    example: 'Sentimento de Dono',
  })
  criterionName: string;

  @ApiProperty({
    description: 'Pilar do critério',
    enum: CriterionPillar,
  })
  pillar: CriterionPillar;

  @ApiProperty({
    description: 'Pontuação (1-5)',
    example: 4,
  })
  score: number;

  @ApiProperty({
    description: 'Justificativa (descriptografada)',
    example: 'Demonstra excelente senso de responsabilidade...',
  })
  justification: string;
}

export class Collaborator360AssessmentDto {
  @ApiProperty({
    description: 'ID da avaliação 360',
    example: 'cluid123456789',
  })
  assessmentId: string;

  @ApiProperty({
    description: 'ID do autor da avaliação',
    example: 'author-id',
  })
  authorId: string;

  @ApiProperty({
    description: 'Nome do autor da avaliação',
    example: 'Maria Silva',
  })
  authorName: string;

  @ApiProperty({
    description: 'E-mail do autor',
    example: 'maria.silva@empresa.com',
  })
  authorEmail: string;

  @ApiProperty({
    description: 'Cargo do autor',
    example: 'Desenvolvedor Senior',
  })
  authorJobTitle: string;

  @ApiProperty({
    description: 'Ciclo da avaliação',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Status da avaliação',
    enum: AssessmentStatus,
  })
  status: AssessmentStatus;

  @ApiProperty({
    description: 'Data de submissão',
    example: '2025-01-15T16:00:00Z',
    nullable: true,
  })
  submittedAt: Date | null;

  @ApiProperty({
    description: 'Respostas da avaliação',
    type: [CollaboratorAssessmentAnswerDto],
  })
  answers: CollaboratorAssessmentAnswerDto[];
}

export class CollaboratorPerformanceDto {
  @ApiProperty({
    description: 'Nota final do comitê (overall score)',
    example: 4.2,
    nullable: true,
  })
  committeeOverallScore: number | null;

  @ApiProperty({
    description: 'Crescimento de performance em relação ao ciclo anterior (%)',
    example: 15.5,
    nullable: true,
  })
  performanceGrowth: number | null;

  @ApiProperty({
    description: 'Total de avaliações realizadas pelo colaborador',
    example: 5,
  })
  totalAssessmentsCompleted: number;

  @ApiProperty({
    description: 'Detalhamento das avaliações completadas',
    type: 'object',
    properties: {
      selfAssessment: { type: 'number', description: 'Autoavaliação (0 ou 1)' },
      assessments360: { type: 'number', description: 'Avaliações 360 recebidas' },
      mentoringAssessments: { type: 'number', description: 'Avaliações de mentoring feitas' },
      referenceFeedbacks: { type: 'number', description: 'Feedbacks de referência dados' },
    },
  })
  assessmentBreakdown: {
    selfAssessment: number;
    assessments360: number;
    mentoringAssessments: number;
    referenceFeedbacks: number;
  };
}

export class CollaboratorCycleMeanDto {
  @ApiProperty({
    description: 'Nome do ciclo',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Média da autoavaliação do colaborador',
    example: 4.1,
    nullable: true,
  })
  selfAssessmentMean: number | null;

  @ApiProperty({
    description: 'Média dos critérios de EXECUTION dados pelo mentor',
    example: 3.8,
    nullable: true,
  })
  mentorExecutionMean: number | null;

  @ApiProperty({
    description: 'Média dos critérios de BEHAVIOR dados pelo mentor',
    example: 4.2,
    nullable: true,
  })
  mentorBehaviorMean: number | null;

  @ApiProperty({
    description: 'Média geral das avaliações 360 recebidas',
    example: 3.9,
    nullable: true,
  })
  assessments360Mean: number | null;
}

export class CollaboratorDetailedPerformanceDto {
  @ApiProperty({
    description: 'Informações básicas do colaborador',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      jobTitle: { type: 'string' },
      seniority: { type: 'string' },
    },
  })
  collaborator: {
    id: string;
    name: string;
    email: string;
    jobTitle: string;
    seniority: string;
  };

  @ApiProperty({
    description: 'Avaliações 360 recebidas no ciclo',
    type: [Collaborator360AssessmentDto],
  })
  assessments360: Collaborator360AssessmentDto[];

  @ApiProperty({
    description: 'Dados de performance do colaborador',
    type: CollaboratorPerformanceDto,
  })
  performance: CollaboratorPerformanceDto;

  @ApiProperty({
    description: 'Médias por ciclo do colaborador',
    type: [CollaboratorCycleMeanDto],
  })
  cycleMeans: CollaboratorCycleMeanDto[];

  @ApiProperty({
    description: 'Ciclo atual da consulta',
    example: '2025.1',
  })
  currentCycle: string;
}
