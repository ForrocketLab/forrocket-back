export interface TeamCollaboratorData {
  collaboratorId: string;
  collaboratorName: string;
  jobTitle: string;
  seniority: string;
  averageScore: number;
  assessments360: Array<{
    authorName: string;
    overallScore: number;
    strengths: string;
    improvements: string;
  }>;
  managerAssessments: Array<{
    authorName: string;
    answers: Array<{
      criterionId: string;
      score: number;
      justification: string;
    }>;
  }>;
  committeeScore?: number;
}

export interface TeamEvaluationSummaryData {
  cycle: string;
  teamAverageScore: number;
  totalCollaborators: number;
  collaborators: TeamCollaboratorData[];
  highPerformers: number; // colaboradores com nota >= 4.5
  lowPerformers: number; // colaboradores com nota <= 2.5
}

export class TeamEvaluationSummaryDto {
  facts: string;
}

export interface CollaboratorScoreData {
  collaboratorId: string;
  collaboratorName: string;
  finalScore?: number; // Nota final (comitê ou média)
  behaviorScore?: number; // Média do pilar comportamento
  executionScore?: number; // Média do pilar execução
  hasCommitteeScore: boolean; // Se tem nota do comitê
}

export interface TeamScoreAnalysisData {
  cycle: string;
  totalCollaborators: number;
  teamAverageScore: number;
  behaviorAverage?: number;
  executionAverage?: number;
  highPerformers: number; // colaboradores com nota >= 4.5
  criticalPerformers: number; // colaboradores com nota <= 2.5
  collaborators: CollaboratorScoreData[];
}
