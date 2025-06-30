import { ApiProperty } from '@nestjs/swagger';
import { KeyResultStatus, KeyResultType } from '@prisma/client';

/**
 * Entidade KeyResult para representar um resultado-chave dentro de um objetivo
 */
export class KeyResult {
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
    example: 65,
    default: 0
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
    description: 'Data de criação do key result'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do key result'
  })
  updatedAt: Date;

  /**
   * Calcula o progresso do key result baseado no valor atual vs valor alvo
   */
  calculateProgress(): number {
    if (this.type === KeyResultType.BINARY) {
      return this.currentValue >= this.targetValue ? 100 : 0;
    }

    if (this.type === KeyResultType.PERCENTAGE) {
      return Math.min(this.currentValue, 100);
    }

    if (this.targetValue === 0) {
      return 0;
    }

    const progress = (this.currentValue / this.targetValue) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Verifica se o key result foi completado
   */
  isCompleted(): boolean {
    return this.status === KeyResultStatus.COMPLETED || this.calculateProgress() >= 100;
  }

  /**
   * Verifica se o key result está em progresso
   */
  isInProgress(): boolean {
    return this.status === KeyResultStatus.IN_PROGRESS && this.calculateProgress() > 0 && this.calculateProgress() < 100;
  }

  /**
   * Formata o valor atual com a unidade
   */
  getFormattedCurrentValue(): string {
    if (this.type === KeyResultType.PERCENTAGE) {
      return `${this.currentValue}%`;
    }
    
    if (this.type === KeyResultType.BINARY) {
      return this.currentValue >= this.targetValue ? 'Sim' : 'Não';
    }

    return this.unit ? `${this.currentValue} ${this.unit}` : this.currentValue.toString();
  }

  /**
   * Formata o valor alvo com a unidade
   */
  getFormattedTargetValue(): string {
    if (this.type === KeyResultType.PERCENTAGE) {
      return `${this.targetValue}%`;
    }
    
    if (this.type === KeyResultType.BINARY) {
      return 'Sim';
    }

    return this.unit ? `${this.targetValue} ${this.unit}` : this.targetValue.toString();
  }
} 