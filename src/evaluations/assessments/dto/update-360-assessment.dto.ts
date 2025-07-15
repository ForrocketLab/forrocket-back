import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';

enum WorkAgainMotivation {
  STRONGLY_DISAGREE = 'STRONGLY_DISAGREE',
  PARTIALLY_DISAGREE = 'PARTIALLY_DISAGREE',
  NEUTRAL = 'NEUTRAL',
  PARTIALLY_AGREE = 'PARTIALLY_AGREE',
  STRONGLY_AGREE = 'STRONGLY_AGREE',
}

export class Update360AssessmentDto {
  @IsString()
  evaluatedUserId: string;

  @IsString()
  cycleId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  overallScore?: number;

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  improvements?: string;

  @ApiProperty({
    description: 'Motivação para trabalhar novamente com o colega',
    enum: WorkAgainMotivation,
    example: WorkAgainMotivation.PARTIALLY_AGREE,
    required: false,
  })
  @IsEnum(WorkAgainMotivation)
  @IsOptional()
  workAgainMotivation?: WorkAgainMotivation;
}
