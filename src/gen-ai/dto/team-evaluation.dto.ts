export interface CollaboratorEvaluationData {
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
  collaborators: CollaboratorEvaluationData[];
  highPerformers: number; // colaboradores com nota >= 4.5
  lowPerformers: number;  // colaboradores com nota <= 2.5
}

export class TeamEvaluationSummaryDto {
  facts: string;
}
