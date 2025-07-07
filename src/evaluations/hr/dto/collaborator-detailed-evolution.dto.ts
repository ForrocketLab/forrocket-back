import { ApiProperty } from '@nestjs/swagger';
import { PerformanceDataDto } from '../../assessments/dto/performance-data.dto';
import { CycleDetailedDataDto } from './cycle-detailed-data.dto';
import { PillarEvolutionDetailedDto, PillarCriterionEvolutionDto } from './pillar-evolution.dto';

export class CollaboratorInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty()
  seniority: string;

  @ApiProperty()
  businessUnit: string;

  @ApiProperty()
  careerTrack: string;

  @ApiProperty({ nullable: true })
  managerName: string | null;

  @ApiProperty({ nullable: true })
  mentorName: string | null;
}

export class PerformanceSummaryDto {
  @ApiProperty()
  totalCycles: number;

  @ApiProperty({ nullable: true })
  bestScore: number | null;

  @ApiProperty({ nullable: true })
  worstScore: number | null;

  @ApiProperty()
  historicalAverage: number;

  @ApiProperty()
  overallTrend: string;

  @ApiProperty()
  consistencyScore: number;
}

export class BenchmarkingDto {
  @ApiProperty()
  rankInBusinessUnit: number;

  @ApiProperty()
  totalInBusinessUnit: number;

  @ApiProperty()
  percentileInBusinessUnit: number;

  @ApiProperty()
  rankInSeniority: number;

  @ApiProperty()
  totalInSeniority: number;

  @ApiProperty()
  percentileInSeniority: number;
}

export class PredictionsDto {
  @ApiProperty()
  nextEvaluationPrediction: number;

  @ApiProperty()
  confidenceLevel: number;

  @ApiProperty({ type: [String] })
  improvementAreas: string[];

  @ApiProperty({ type: [String] })
  strengths: string[];
}

export class CollaboratorDetailedEvolutionDto {
  @ApiProperty()
  collaborator: CollaboratorInfoDto;

  @ApiProperty()
  summary: PerformanceSummaryDto;

  @ApiProperty({ type: [CycleDetailedDataDto] })
  cycleDetails: CycleDetailedDataDto[];

  @ApiProperty({ type: [PillarEvolutionDetailedDto] })
  pillarEvolution: PillarEvolutionDetailedDto[];

  @ApiProperty({ type: [PillarCriterionEvolutionDto] })
  criteriaEvolution: PillarCriterionEvolutionDto[];

  @ApiProperty({ type: [String] })
  insights: string[];

  @ApiProperty()
  benchmarking: BenchmarkingDto;

  @ApiProperty()
  predictions: PredictionsDto;
} 