import { ApiProperty } from '@nestjs/swagger';

class SubordinateStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'PENDENTE'] })
  selfAssessmentStatus: string;

  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'PENDENTE'] })
  managerAssessmentStatus: string;

  @ApiProperty()
  peerAssessmentsCompleted: number;
}

export class ManagerDashboardDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ type: [SubordinateStatusDto] })
  subordinates: SubordinateStatusDto[];
}
