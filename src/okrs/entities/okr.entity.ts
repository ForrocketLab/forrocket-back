import { ApiProperty } from '@nestjs/swagger';
import { OKRStatus } from '@prisma/client';
import { Objective } from './objective.entity';

/**
 * Entidade OKR para representar um conjunto de OKRs de um colaborador
 */
export class OKR {
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
    description: 'Data de criação do OKR'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do OKR'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de objetivos do OKR',
    type: [Objective],
    required: false
  })
  objectives?: Objective[];

  /**
   * Calcula o progresso geral do OKR baseado nos objetivos
   */
  getOverallProgress(): number {
    if (!this.objectives || this.objectives.length === 0) {
      return 0;
    }

    const totalProgress = this.objectives.reduce((sum, objective) => sum + objective.progress, 0);
    return Math.round(totalProgress / this.objectives.length);
  }

  /**
   * Verifica se o OKR está ativo
   */
  isActive(): boolean {
    return this.status === OKRStatus.ACTIVE;
  }
} 