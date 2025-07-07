import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Interface para dados do colaborador
export interface PersonalInsightsCollaborator {
  id: string;
  name: string;
  jobTitle: string;
  businessUnit: string;
  seniority: string;
}

// Interface para notas/scores
export interface PersonalInsightsScores {
  selfEvaluation?: number;
  managerEvaluation?: number;
  committeeEvaluation?: number;
  averageScore: number;
}

// Interface para avaliações 360
export interface PersonalInsights360Assessment {
  assessorName: string;
  scores: { overall: number };
  strengths: string;
  improvements: string;
}

// Interface para respostas de avaliação do gestor
export interface PersonalInsightsManagerAnswer {
  criterionId: string;
  score: number;
  justification: string;
}

// Interface para avaliações do gestor
export interface PersonalInsightsManagerAssessment {
  answers: PersonalInsightsManagerAnswer[];
}

// Interface para avaliação do comitê
export interface PersonalInsightsCommitteeAssessment {
  finalScore: number;
  justification: string;
}

// Interface principal para dados de insights pessoais
export interface PersonalInsightsData {
  collaborator: PersonalInsightsCollaborator;
  cycle: string;
  scores: PersonalInsightsScores;
  assessments360: PersonalInsights360Assessment[];
  managerAssessments: PersonalInsightsManagerAssessment[];
  committeeAssessment?: PersonalInsightsCommitteeAssessment;
}

// DTO para request de insights pessoais
export class PersonalInsightsRequest {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'user123',
  })
  @IsString()
  collaboratorId: string;

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2024-S1',
  })
  @IsString()
  cycle: string;
}

// DTO para response de insights pessoais
export class PersonalInsightsResponse {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'user123',
  })
  @IsString()
  collaboratorId: string;

  @ApiProperty({
    description: 'Nome do colaborador',
    example: 'João Silva',
  })
  @IsString()
  collaboratorName: string;

  @ApiProperty({
    description: 'Cargo do colaborador',
    example: 'Desenvolvedor Senior',
  })
  @IsString()
  jobTitle: string;

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2024-S1',
  })
  @IsString()
  cycle: string;

  @ApiProperty({
    description: 'Nota média do colaborador',
    example: 4.2,
  })
  @IsNumber()
  averageScore: number;

  @ApiProperty({
    description: 'Insights personalizados gerados pela IA',
    example: 'Você demonstrou excelente capacidade técnica...',
  })
  @IsString()
  insights: string;

  @ApiProperty({
    description: 'Data e hora de geração dos insights',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  generatedAt: string;
} 