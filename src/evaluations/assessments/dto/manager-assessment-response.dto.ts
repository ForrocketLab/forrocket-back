import { ApiProperty } from '@nestjs/swagger';

class AssessmentAnswerDto {
  @ApiProperty({ example: 'sentimento-de-dono' })
  criterionId: string;

  @ApiProperty({ example: 4 })
  score: number;

  @ApiProperty({ example: 'Justificativa para o score.' })
  justification: string;
}

export class ManagerAssessmentResponseDto {
  @ApiProperty({ example: 'cluid123456789' })
  id: string;

  @ApiProperty({ example: '2025.1' })
  cycle: string;

  @ApiProperty({ example: 'manager-id' })
  authorId: string;

  @ApiProperty({ example: 'subordinate-id' })
  evaluatedUserId: string;

  @ApiProperty({ example: 'SUBMITTED', enum: ['DRAFT', 'SUBMITTED'] })
  status: string;

  @ApiProperty({ type: [AssessmentAnswerDto] })
  answers: AssessmentAnswerDto[];

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: Date;

  @ApiProperty({ example: new Date().toISOString(), nullable: true })
  submittedAt?: Date;
}