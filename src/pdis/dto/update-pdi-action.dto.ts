import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PDIActionStatus, PDIPriority } from '@prisma/client';

export class UpdatePDIActionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(PDIPriority)
  priority?: PDIPriority;

  @IsOptional()
  @IsEnum(PDIActionStatus)
  status?: PDIActionStatus;
} 