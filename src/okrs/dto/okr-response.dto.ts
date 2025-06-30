import { ApiProperty } from '@nestjs/swagger';
import { OKRStatus } from '@prisma/client';
import { ObjectiveResponseDto } from './objective-response.dto';

/**
 * DTO de resposta para OKR
 */
export class OKRResponseDto {
  @ApiProperty({
    description: 'ID único do OKR',
    example: 'ckr1234567890abcdef'
  })
  id: string;

  @ApiProperty({
    description: 'ID do colaborador dono do OKR',
    example: 'usr1234567890abcdef'
  })
  userId: string;

  @ApiProperty({
    description: 'Título do OKR',
    example: 'Melhorar Performance da Equipe Q1 2025'
  })
  title: string;

  @ApiProperty({
    description: 'Descrição opcional do OKR',
    example: 'Focar em aumentar a produtividade e qualidade das entregas do time',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Trimestre do OKR',
    example: '2025-Q1'
  })
  quarter: string;

  @ApiProperty({
    description: 'Ano do OKR',
    example: 2025
  })
  year: number;

  @ApiProperty({
    description: 'Status do OKR',
    enum: OKRStatus,
    example: OKRStatus.ACTIVE
  })
  status: OKRStatus;

  @ApiProperty({
    description: 'Progresso geral do OKR (0-100%)',
    example: 65.5
  })
  overallProgress: number;

  @ApiProperty({
    description: 'Data de criação do OKR'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do OKR'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de objetivos do OKR',
    type: [ObjectiveResponseDto],
    required: false
  })
  objectives?: ObjectiveResponseDto[];
}

/**
 * DTO de resposta simplificada para listagem de OKRs
 */
export class OKRSummaryDto {
  @ApiProperty({
    description: 'ID único do OKR',
    example: 'ckr1234567890abcdef'
  })
  id: string;

  @ApiProperty({
    description: 'Título do OKR',
    example: 'Melhorar Performance da Equipe Q1 2025'
  })
  title: string;

  @ApiProperty({
    description: 'Trimestre do OKR',
    example: '2025-Q1'
  })
  quarter: string;

  @ApiProperty({
    description: 'Ano do OKR',
    example: 2025
  })
  year: number;

  @ApiProperty({
    description: 'Status do OKR',
    enum: OKRStatus,
    example: OKRStatus.ACTIVE
  })
  status: OKRStatus;

  @ApiProperty({
    description: 'Progresso geral do OKR (0-100%)',
    example: 65.5
  })
  overallProgress: number;

  @ApiProperty({
    description: 'Número de objetivos',
    example: 3
  })
  objectivesCount: number;

  @ApiProperty({
    description: 'Número de objetivos completados',
    example: 1
  })
  completedObjectives: number;

  @ApiProperty({
    description: 'Data da última atualização do OKR'
  })
  updatedAt: Date;
} 