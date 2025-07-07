import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { KeyResultType } from '@prisma/client';

/**
 * DTO para criação de um novo key result
 */
export class CreateKeyResultDto {
  @ApiProperty({
    description: 'Título do key result',
    example: 'Aumentar NPS do time para 80+'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do key result',
    example: 'Medir mensalmente através de pesquisa interna',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tipo de métrica do key result (sempre PERCENTAGE)',
    enum: KeyResultType,
    example: KeyResultType.PERCENTAGE
  })
  @IsEnum(KeyResultType)
  type: KeyResultType;

  @ApiProperty({
    description: 'Valor alvo a ser atingido (sempre 100 para porcentagem)',
    example: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  targetValue: number;

  @ApiProperty({
    description: 'Valor atual atingido (0-100%)',
    example: 0,
    default: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  currentValue?: number;

  @ApiProperty({
    description: 'Unidade de medida (sempre % para porcentagem)',
    example: '%',
    required: false
  })
  @IsString()
  @IsOptional()
  unit?: string;
} 