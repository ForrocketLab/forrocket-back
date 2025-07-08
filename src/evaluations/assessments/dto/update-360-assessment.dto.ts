import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

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
} 