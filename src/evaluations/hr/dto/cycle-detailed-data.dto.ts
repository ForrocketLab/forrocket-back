import { ApiProperty } from '@nestjs/swagger';

export class CriterionDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  pillar: string;

  @ApiProperty({ nullable: true })
  selfScore?: number;

  @ApiProperty({ nullable: true })
  managerScore?: number;

  @ApiProperty({ nullable: true })
  committeeScore?: number;
}

export class CycleDetailedDataDto {
  @ApiProperty()
  cycle: string;

  @ApiProperty()
  selfAssessmentScore: number | null;

  @ApiProperty()
  managerAssessmentScore: number | null;

  @ApiProperty()
  committeeAssessmentScore: number | null;

  @ApiProperty({ type: [CriterionDetailDto] })
  criteria: CriterionDetailDto[];

  @ApiProperty({ type: [String] })
  comments: string[];
} 