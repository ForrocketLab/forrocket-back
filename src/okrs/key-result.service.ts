import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { KeyResultStatus, KeyResultType, ObjectiveStatus } from '@prisma/client';
import { CreateKeyResultDto, UpdateKeyResultDto, KeyResultResponseDto } from './dto';
import { ObjectiveService } from './objective.service';

@Injectable()
export class KeyResultService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ObjectiveService))
    private objectiveService: ObjectiveService,
  ) {}

  async createKeyResult(objectiveId: string, createKeyResultDto: CreateKeyResultDto): Promise<KeyResultResponseDto> {
    const objective = await this.prisma.objective.findUnique({ where: { id: objectiveId } });
    if (!objective) throw new NotFoundException('Objetivo não encontrado');

    const existingKeyResult = await this.prisma.keyResult.findFirst({
      where: { objectiveId, title: createKeyResultDto.title.trim() },
    });

    if (existingKeyResult) {
      throw new ConflictException(`Já existe um Key Result com o título "${createKeyResultDto.title}" neste objetivo`);
    }

    const currentValue = createKeyResultDto.currentValue || 0;
    const tempKeyResult = {
      type: createKeyResultDto.type,
      targetValue: createKeyResultDto.targetValue,
      currentValue,
    };
    const progress = this.calculateKeyResultProgress(tempKeyResult);
    
    let status: KeyResultStatus = KeyResultStatus.NOT_STARTED;
    if (progress >= 100) {
      status = KeyResultStatus.COMPLETED;
    } else if (progress > 0) {
      status = KeyResultStatus.IN_PROGRESS;
    }

    const keyResult = await this.prisma.keyResult.create({
      data: {
        objectiveId,
        title: createKeyResultDto.title.trim(),
        description: createKeyResultDto.description,
        type: createKeyResultDto.type,
        targetValue: createKeyResultDto.targetValue,
        currentValue,
        unit: createKeyResultDto.unit,
        status,
      },
    });

    await this.objectiveService.updateObjectiveProgress(objectiveId);
    return this.mapToKeyResultResponse(keyResult);
  }

  async getKeyResultById(keyResultId: string): Promise<KeyResultResponseDto> {
    const keyResult = await this.prisma.keyResult.findUnique({
      where: { id: keyResultId },
    });

    if (!keyResult) {
      throw new NotFoundException('Key Result não encontrado');
    }

    return this.mapToKeyResultResponse(keyResult);
  }

  async updateKeyResult(keyResultId: string, updateKeyResultDto: UpdateKeyResultDto): Promise<KeyResultResponseDto> {
    const existingKeyResult = await this.prisma.keyResult.findUnique({
      where: { id: keyResultId },
    });

    if (!existingKeyResult) {
      throw new NotFoundException('Key Result não encontrado');
    }

    let updateData = { ...updateKeyResultDto };
    
    if (updateKeyResultDto.currentValue !== undefined) {
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateKeyResultDto).filter(([_, value]) => value !== undefined)
      );
      const updatedKeyResult = { ...existingKeyResult, ...filteredUpdateData };
      const progress = this.calculateKeyResultProgress(updatedKeyResult);
      
      let status: KeyResultStatus = KeyResultStatus.NOT_STARTED;
      if (progress >= 100) {
        status = KeyResultStatus.COMPLETED;
      } else if (progress > 0) {
        status = KeyResultStatus.IN_PROGRESS;
      }
      
      updateData.status = status;
    }

    const keyResult = await this.prisma.keyResult.update({
      where: { id: keyResultId },
      data: updateData,
    });

    await this.objectiveService.updateObjectiveProgress(existingKeyResult.objectiveId);
    return this.mapToKeyResultResponse(keyResult);
  }

  async deleteKeyResult(keyResultId: string): Promise<void> {
    const existingKeyResult = await this.prisma.keyResult.findUnique({
      where: { id: keyResultId },
    });

    if (!existingKeyResult) {
      throw new NotFoundException('Key Result não encontrado');
    }

    await this.prisma.keyResult.delete({
      where: { id: keyResultId },
    });

    await this.objectiveService.updateObjectiveProgress(existingKeyResult.objectiveId); 
  }

  /**
   * Calcula o progresso de um key result (sempre em percentual)
   */
  public calculateKeyResultProgress(keyResult: any): number {
    if (keyResult.targetValue === 0) {
      return 0;
    }
    
    switch (keyResult.type) {
      case KeyResultType.PERCENTAGE:
        return Math.min(Math.max(keyResult.currentValue, 0), 100);
      
      case KeyResultType.NUMBER:
        const progress = (keyResult.currentValue / keyResult.targetValue) * 100;
        return Math.min(Math.max(progress, 0), 100);
      
      case KeyResultType.BINARY:
        return keyResult.currentValue > 0 ? 100 : 0;
      
      default:
        return Math.min(Math.max(keyResult.currentValue, 0), 100);
    }
  }

  /**
   * Mapeia dados do Prisma para KeyResultResponseDto
   */
  public mapToKeyResultResponse(keyResult: any): KeyResultResponseDto {
    const progress = this.calculateKeyResultProgress(keyResult);
    
    return {
      id: keyResult.id,
      objectiveId: keyResult.objectiveId,
      title: keyResult.title,
      description: keyResult.description,
      type: keyResult.type,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: keyResult.unit,
      status: keyResult.status,
      progress,
      formattedCurrentValue: this.formatValue(keyResult.currentValue, keyResult.type, keyResult.unit, keyResult.targetValue),
      formattedTargetValue: this.formatValue(keyResult.targetValue, keyResult.type, keyResult.unit),
      createdAt: keyResult.createdAt,
      updatedAt: keyResult.updatedAt,
    };
  }

  /**
   * Formata valores para exibição baseado no tipo
   */
  public formatValue(value: number, type: KeyResultType, unit?: string, targetValue?: number): string {
    switch (type) {
      case KeyResultType.PERCENTAGE:
        return `${value}%`;
      
      case KeyResultType.NUMBER:
        return unit ? `${value} ${unit}` : `${value}`;
      
      case KeyResultType.BINARY:
        return value > 0 ? 'Sim' : 'Não';
      
      default:
        return `${value}%`;
    }
  }
}