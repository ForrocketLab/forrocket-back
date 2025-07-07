import { ApiProperty } from '@nestjs/swagger';
import { ObjectiveStatus } from '@prisma/client';
import { KeyResult } from './key-result.entity';

/**
 * Entidade Objective para representar um objetivo dentro de um OKR
 */
export class Objective {
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
    type: [KeyResult],
    required: false
  })
  keyResults?: KeyResult[];

  /**
   * Calcula o progresso do objetivo baseado nos key results
   */
  calculateProgress(): number {
    if (!this.keyResults || this.keyResults.length === 0) {
      return this.progress;
    }

    let totalProgress = 0;
    let totalWeight = 0;

    this.keyResults.forEach(kr => {
      const krProgress = kr.calculateProgress();
      totalProgress += krProgress;
      totalWeight += 1; // Peso igual para todos os KRs por simplicidade
    });

    return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
  }

  /**
   * Verifica se o objetivo está completo
   */
  isCompleted(): boolean {
    return this.status === ObjectiveStatus.COMPLETED || this.progress >= 100;
  }

  /**
   * Verifica se o objetivo está em progresso
   */
  isInProgress(): boolean {
    return this.status === ObjectiveStatus.IN_PROGRESS && this.progress > 0 && this.progress < 100;
  }
} 