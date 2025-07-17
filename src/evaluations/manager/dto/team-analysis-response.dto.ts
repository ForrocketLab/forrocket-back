import { ApiProperty } from '@nestjs/swagger';

export class TeamAnalysisResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  managerId: string;

  @ApiProperty()
  cycle: string;

  @ApiProperty()
  scoreAnalysisSummary: string;

  @ApiProperty()
  feedbackAnalysisSummary: string;

  @ApiProperty()
  totalCollaborators: number;

  @ApiProperty()
  teamAverageScore: number;

  @ApiProperty()
  highPerformers: number;

  @ApiProperty()
  lowPerformers: number;

  @ApiProperty({ required: false, nullable: true })
  behaviorAverage?: number;

  @ApiProperty({ required: false, nullable: true })
  executionAverage?: number;

  @ApiProperty()
  criticalPerformers: number;

  @ApiProperty()
  createdAt: Date;
}
