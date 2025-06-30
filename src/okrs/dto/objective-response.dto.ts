import { ApiProperty } from '@nestjs/swagger';
import { ObjectiveStatus } from '@prisma/client';
import { KeyResultResponseDto } from './key-result-response.dto';

/**
 * DTO de resposta para objetivo
 */
export class ObjectiveResponseDto {
  @ApiProperty({
    description: 'ID único do objetivo',
    example: 'obj1234567890abcdef'
  })
  id: string;

  @ApiProperty({
    description: 'ID do OKR pai',
    example: 'okr1234567890abcdef'
  })
  okrId: string;

  @ApiProperty({
    description: 'Título do objetivo',
    example: 'Aumentar a satisfação do time'
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do objetivo',
    example: 'Melhorar o ambiente de trabalho e comunicação interna',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Status do objetivo',
    enum: ObjectiveStatus,
    example: ObjectiveStatus.IN_PROGRESS
  })
  status: ObjectiveStatus;

  @ApiProperty({
    description: 'Progresso do objetivo (0-100%)',
    example: 75.5,
    minimum: 0,
    maximum: 100
  })
  progress: number;

  @ApiProperty({
    description: 'Data de criação do objetivo'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do objetivo'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de key results do objetivo',
    type: [KeyResultResponseDto],
    required: false
  })
  keyResults?: KeyResultResponseDto[];
} 