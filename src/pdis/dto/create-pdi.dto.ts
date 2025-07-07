import { IsString, IsDateString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePDIActionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsString()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
}

export class CreatePDIDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePDIActionDto)
  actions: CreatePDIActionDto[];
} 