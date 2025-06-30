import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { KeyResultStatus, KeyResultType } from '@prisma/client';

/**
 * DTO para atualização de um key result existente
 */
export class UpdateKeyResultDto {
  @ApiProperty({
    description: 'Título do key result',
    example: 'Aumentar NPS do time para 80+',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada do key result',
    example: 'Medir mensalmente através de pesquisa interna',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tipo de métrica do key result',
    enum: KeyResultType,
    example: KeyResultType.NUMBER,
    required: false
  })
  @IsEnum(KeyResultType)
  @IsOptional()
  type?: KeyResultType;

  @ApiProperty({
    description: 'Valor alvo a ser atingido',
    example: 80,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  targetValue?: number;

  @ApiProperty({
    description: 'Valor atual atingido',
    example: 65,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentValue?: number;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'pontos',
    required: false
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    description: 'Status do key result',
    enum: KeyResultStatus,
    example: KeyResultStatus.IN_PROGRESS,
    required: false
  })
  @IsEnum(KeyResultStatus)
  @IsOptional()
  status?: KeyResultStatus;
} 