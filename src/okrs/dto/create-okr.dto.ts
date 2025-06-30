import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateObjectiveDto } from './create-objective.dto';

/**
 * DTO para criação de um novo OKR
 */
export class CreateOKRDto {
  @ApiProperty({
    description: 'Título do OKR',
    example: 'Melhorar Performance da Equipe Q3 2025'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descrição opcional do OKR',
    example: 'Focar em aumentar a produtividade e qualidade das entregas do time',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Trimestre do OKR',
    example: '2025-Q3'
  })
  @IsString()
  @IsNotEmpty()
  quarter: string;

  @ApiProperty({
    description: 'Ano do OKR',
    example: 2025
  })
  @IsInt()
  @Min(2025)
  @Max(2030)
  year: number;

  @ApiProperty({
    description: 'Lista de objetivos do OKR',
    type: [CreateObjectiveDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateObjectiveDto)
  objectives?: CreateObjectiveDto[];
} 