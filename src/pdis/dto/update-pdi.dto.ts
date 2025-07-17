import { IsString, IsDateString, IsOptional, ValidateNested, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PDIStatus, PDIActionStatus, PDIPriority } from '@prisma/client';

export class UpdatePDIActionDto {
  @IsOptional()
  @IsString()
  id?: string;

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

export class UpdatePDIDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PDIStatus)
  status?: PDIStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePDIActionDto)
  actions?: UpdatePDIActionDto[];
} 