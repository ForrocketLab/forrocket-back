import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpdateMentoringAssessmentDto {
  @IsString()
  mentorId: string;

  @IsString()
  cycleId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  justification?: string;
} 