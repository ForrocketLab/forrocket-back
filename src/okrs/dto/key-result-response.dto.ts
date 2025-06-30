import { ApiProperty } from '@nestjs/swagger';
import { KeyResultStatus, KeyResultType } from '@prisma/client';

/**
 * DTO de resposta para key result
 */
export class KeyResultResponseDto {
  @ApiProperty({
    description: 'ID único do key result',
    example: 'kr1234567890abcdef'
  })
  id: string;

  @ApiProperty({
    description: 'ID do objetivo pai',
    example: 'obj1234567890abcdef'
  })
  objectiveId: string;

  @ApiProperty({
    description: 'Título do key result',
    example: 'Aumentar NPS do time para 80+'
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do key result',
    example: 'Medir mensalmente através de pesquisa interna',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Tipo de métrica do key result',
    enum: KeyResultType,
    example: KeyResultType.NUMBER
  })
  type: KeyResultType;

  @ApiProperty({
    description: 'Valor alvo a ser atingido',
    example: 80
  })
  targetValue: number;

  @ApiProperty({
    description: 'Valor atual atingido',
    example: 65
  })
  currentValue: number;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'pontos',
    required: false
  })
  unit?: string;

  @ApiProperty({
    description: 'Status do key result',
    enum: KeyResultStatus,
    example: KeyResultStatus.IN_PROGRESS
  })
  status: KeyResultStatus;

  @ApiProperty({
    description: 'Progresso calculado (0-100%)',
    example: 81.25
  })
  progress: number;

  @ApiProperty({
    description: 'Valor formatado atual',
    example: '65 pontos'
  })
  formattedCurrentValue: string;

  @ApiProperty({
    description: 'Valor formatado alvo',
    example: '80 pontos'
  })
  formattedTargetValue: string;

  @ApiProperty({
    description: 'Data de criação do key result'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do key result'
  })
  updatedAt: Date;
} 