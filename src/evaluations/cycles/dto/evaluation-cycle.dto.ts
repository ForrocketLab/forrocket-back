import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

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
    description: 'Fase atual do ciclo',
    example: 'ASSESSMENTS',
    enum: ['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'],
  })
  phase: 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION';

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

/**
 * DTO para criar um novo ciclo de avaliação
 */
export class CreateEvaluationCycleDto {
  @ApiProperty({
    description: 'Nome do ciclo de avaliação',
    example: '2025.2',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Data de início do ciclo',
    example: '2025-07-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data de término do ciclo',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO para ativar um ciclo de avaliação
 */
export class ActivateCycleDto {
  @ApiProperty({
    description: 'Data de início do ciclo',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data de término do ciclo',
    example: '2025-06-30T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO para atualizar o status de um ciclo
 */
export class UpdateCycleStatusDto {
  @ApiProperty({
    description: 'Novo status do ciclo',
    example: 'OPEN',
    enum: ['UPCOMING', 'OPEN', 'EQUALIZATION', 'CLOSED'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['UPCOMING', 'OPEN', 'EQUALIZATION', 'CLOSED'])
  status: 'UPCOMING' | 'OPEN' | 'EQUALIZATION' | 'CLOSED';
}

/**
 * DTO para atualizar a fase de um ciclo
 */
export class UpdateCyclePhaseDto {
  @ApiProperty({
    description: 'Nova fase do ciclo',
    example: 'MANAGER_REVIEWS',
    enum: ['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'])
  phase: 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION';
}
