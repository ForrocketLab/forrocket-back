import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CollaboratorSummaryRequestDto {
  @ApiProperty({
    description: 'ID do colaborador para gerar o resumo',
    example: 'cmc1zy5wj0000xp8qi7awrc2s',
  })
  @IsString()
  @IsNotEmpty()
  collaboratorId: string;

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  @IsString()
  @IsNotEmpty()
  cycle: string;
}

export class GetCollaboratorSummaryRequestDto {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'cmc1zy5wj0000xp8qi7awrc2s',
  })
  @IsString()
  @IsNotEmpty()
  collaboratorId: string;

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  @IsString()
  @IsNotEmpty()
  cycle: string;
}

export class CollaboratorSummaryResponseDto {
  @ApiProperty({
    description: 'ID único do resumo',
    example: 'cmc1zy5wj0000xp8qi7awrc2s',
  })
  id: string;

  @ApiProperty({
    description: 'Resumo automático gerado pela IA',
    example: 'João Silva demonstra consistência técnica com média 4.2 em todas as avaliações...',
  })
  summary: string;

  @ApiProperty({
    description: 'Nome do colaborador analisado',
    example: 'João Silva',
  })
  collaboratorName: string;

  @ApiProperty({
    description: 'Cargo do colaborador',
    example: 'Desenvolvedor Frontend Pleno',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Ciclo analisado',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Média geral das avaliações',
    example: 4.2,
  })
  averageScore: number;

  @ApiProperty({
    description: 'Total de avaliações consideradas',
    example: 8,
  })
  totalEvaluations: number;

  @ApiProperty({
    description: 'Data de criação do resumo',
    example: '2025-06-30T21:25:17.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de última atualização do resumo',
    example: '2025-06-30T21:25:17.000Z',
  })
  updatedAt: Date;
}

// Estrutura interna para dados do colaborador
export interface CollaboratorEvaluationData {
  collaboratorId: string;
  collaboratorName: string;
  jobTitle: string;
  seniority: string;
  cycle: string;
  
  // Autoavaliação
  selfAssessment: {
    averageScore: number;
    answers: Array<{
      criterionName: string;
      pillarName: string;
      score: number;
      justification: string;
    }>;
  } | null;

  // Avaliações 360
  assessments360: Array<{
    authorName: string;
    authorJobTitle: string;
    overallScore: number;
    strengths: string;
    improvements: string;
  }>;

  // Avaliações de gestor
  managerAssessments: Array<{
    authorName: string;
    authorJobTitle: string;
    answers: Array<{
      criterionName: string;
      pillarName: string;
      score: number;
      justification: string;
    }>;
  }>;

  // Avaliações de mentoring recebidas
  mentoringAssessments: Array<{
    authorName: string;
    score: number;
    justification: string;
  }>;

  // Reference feedbacks recebidos
  referenceFeedbacks: Array<{
    authorName: string;
    justification: string;
  }>;

  // Estatísticas gerais
  statistics: {
    averageScore: number;
    totalEvaluations: number;
    scoresByPillar: {
      comportamento: number;
      execucao: number;
      gestao: number;
    };
  };
} 