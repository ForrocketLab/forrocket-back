import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
export type CriterionPillar = 'BEHAVIOR' | 'EXECUTION' | 'MANAGEMENT';
import { BusinessUnit, BUSINESS_UNITS } from '../../common/enums/business-unit.enum';

/**
 * DTO para exibir critérios de avaliação
 */
export class CriterionDto {
  @ApiProperty({
    description: 'ID único do critério',
    example: 'sentimento-de-dono',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do critério',
    example: 'Sentimento de Dono',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição detalhada do critério',
    example:
      'Demonstra responsabilidade pelos resultados, toma iniciativa e age como se fosse dono do negócio',
  })
  description: string;

  @ApiProperty({
    description: 'Pilar do critério',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'],
    example: 'BEHAVIOR',
  })
  pillar: CriterionPillar;

  @ApiProperty({
    description: 'Peso do critério na avaliação (1.0 = 100%)',
    example: 1.0,
    minimum: 0.1,
    maximum: 5.0,
  })
  weight: number;

  @ApiProperty({
    description:
      'Se o critério é obrigatório no formulário (todos sempre aparecem, mas alguns são opcionais)',
    example: true,
  })
  isRequired: boolean;

  @ApiProperty({
    description: 'Indica se o critério é do formulário base (true) ou específico de trilha (false)',
    example: true,
  })
  isBase: boolean;

  @ApiProperty({
    description: 'Unidade de negócio específica (se nulo, aplica para todas)',
    enum: BusinessUnit,
    example: BusinessUnit.DIGITAL_PRODUCTS,
    required: false,
  })
  businessUnit?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * DTO para criar um novo critério
 */
export class CreateCriterionDto {
  @ApiProperty({
    description: 'Nome do critério',
    example: 'Sentimento de Dono',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição detalhada do critério',
    example:
      'Demonstra responsabilidade pelos resultados, toma iniciativa e age como se fosse dono do negócio',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Pilar do critério',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'],
    example: 'BEHAVIOR',
  })
  @IsEnum(['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'])
  pillar: CriterionPillar;

  @ApiProperty({
    description: 'Peso do critério na avaliação (1.0 = 100%)',
    example: 1.0,
    minimum: 0.1,
    maximum: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  weight?: number;

  @ApiProperty({
    description: 'Se o critério é obrigatório no formulário (padrão: true)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({
    description: 'Unidade de negócio específica (se nulo, aplica para todas)',
    enum: BusinessUnit,
    example: BusinessUnit.DIGITAL_PRODUCTS,
    required: false,
  })
  @IsOptional()
  @IsEnum(BusinessUnit)
  businessUnit?: string;
}

/**
 * DTO para atualizar um critério existente
 */
export class UpdateCriterionDto {
  @ApiProperty({
    description: 'Nome do critério',
    example: 'Sentimento de Dono',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Descrição detalhada do critério',
    example:
      'Demonstra responsabilidade pelos resultados, toma iniciativa e age como se fosse dono do negócio',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    description: 'Pilar do critério',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'],
    example: 'BEHAVIOR',
    required: false,
  })
  @IsOptional()
  @IsEnum(['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'])
  pillar?: CriterionPillar;

  @ApiProperty({
    description: 'Peso do critério na avaliação (1.0 = 100%)',
    example: 1.0,
    minimum: 0.1,
    maximum: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  weight?: number;

  @ApiProperty({
    description: 'Se o critério é obrigatório no formulário',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({
    description: 'Unidade de negócio específica (se nulo, aplica para todas)',
    enum: BusinessUnit,
    example: BusinessUnit.DIGITAL_PRODUCTS,
    required: false,
  })
  @IsOptional()
  @IsEnum(BusinessUnit)
  businessUnit?: string;
}
