import { ApiProperty } from '@nestjs/swagger';

export class PersonalInsightsRequest {
  @ApiProperty({ description: 'ID do colaborador' })
  collaboratorId: string;

  @ApiProperty({ description: 'Nome do ciclo de avaliação' })
  cycle: string;
}

export class PersonalInsightsResponse {
  @ApiProperty({ description: 'ID do colaborador' })
  collaboratorId: string;

  @ApiProperty({ description: 'Nome do colaborador' })
  collaboratorName: string;

  @ApiProperty({ description: 'Cargo do colaborador' })
  jobTitle: string;

  @ApiProperty({ description: 'Ciclo de avaliação' })
  cycle: string;

  @ApiProperty({ description: 'Nota média do colaborador' })
  averageScore: number;

  @ApiProperty({ description: 'Insights personalizados gerados pela IA' })
  insights: string;

  @ApiProperty({ description: 'Data de geração dos insights' })
  generatedAt: string;
}

export interface PersonalInsightsData {
  collaborator: {
    id: string;
    name: string;
    jobTitle: string;
    businessUnit: string;
    seniority: string;
  };
  cycle: string;
  scores: {
    selfEvaluation?: number;
    managerEvaluation?: number;
    committeeEvaluation?: number;
    averageScore: number;
  };
  assessments360: Array<{
    assessorName: string;
    scores: { [criterionId: string]: number };
    strengths: string;
    improvements: string;
  }>;
  managerAssessments: Array<{
    answers: Array<{
      criterionId: string;
      score: number;
      justification: string;
    }>;
  }>;
  committeeAssessment?: {
    finalScore: number;
    justification: string;
  };
} 