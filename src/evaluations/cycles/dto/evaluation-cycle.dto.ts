import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para representar um ciclo de avaliação
 */
export class EvaluationCycleDto {
  @ApiProperty({
    description: 'Identificador único do ciclo',
    example: '2025.1',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do ciclo de avaliação',
    example: '2025.1',
  })
  name: string;

  @ApiProperty({
    description: 'Status atual do ciclo',
    example: 'OPEN',
    enum: ['UPCOMING', 'OPEN', 'EQUALIZATION', 'CLOSED'],
  })
  status: 'UPCOMING' | 'OPEN' | 'EQUALIZATION' | 'CLOSED';

  @ApiProperty({
    description: 'Data de início do ciclo',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  startDate: Date | null;

  @ApiProperty({
    description: 'Data de término do ciclo',
    example: '2025-06-30T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
} 