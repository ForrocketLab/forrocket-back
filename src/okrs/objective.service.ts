import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ObjectiveStatus } from '@prisma/client';
import { CreateObjectiveDto, UpdateObjectiveDto, ObjectiveResponseDto, KeyResultResponseDto } from './dto';
import { KeyResultService } from './key-result.service';
import { OkrService } from './okr.service';
import { DateSerializer } from '../common/utils/date-serializer.util';

@Injectable()
export class ObjectiveService {
  constructor(
    private prisma: PrismaService,
    private keyResultService: KeyResultService,
    @Inject(forwardRef(() => OkrService))
    private okrService: OkrService,
  ) {}

  async createObjective(okrId: string, createObjectiveDto: CreateObjectiveDto): Promise<ObjectiveResponseDto> {
    const okr = await this.prisma.oKR.findUnique({ where: { id: okrId } });
    if (!okr) throw new NotFoundException('OKR não encontrado');

    const objective = await this.prisma.objective.create({
      data: {
        okrId,
        title: createObjectiveDto.title,
        description: createObjectiveDto.description,
        status: ObjectiveStatus.NOT_STARTED,
        progress: 0,
      },
    });

    if (createObjectiveDto.keyResults && createObjectiveDto.keyResults.length > 0) {
      for (const keyResultDto of createObjectiveDto.keyResults) {
        await this.keyResultService.createKeyResult(objective.id, keyResultDto);
      }
    }

    await this.updateObjectiveProgress(objective.id);
    return this.getObjectiveById(objective.id);
  }

  async getObjectiveById(objectiveId: string): Promise<ObjectiveResponseDto> {
    const objective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
      include: {
        keyResults: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!objective) throw new NotFoundException('Objetivo não encontrado');
    return this.mapToObjectiveResponse(objective);
  }

  async updateObjective(objectiveId: string, updateObjectiveDto: UpdateObjectiveDto): Promise<ObjectiveResponseDto> {
    const existingObjective = await this.prisma.objective.findUnique({ where: { id: objectiveId } });
    if (!existingObjective) throw new NotFoundException('Objetivo não encontrado');

    await this.prisma.objective.update({ where: { id: objectiveId }, data: updateObjectiveDto });

    if (updateObjectiveDto.progress !== undefined) {
      await this.updateObjectiveProgress(objectiveId);
    }
    return this.getObjectiveById(objectiveId);
  }

  async deleteObjective(objectiveId: string): Promise<void> {
    const existingObjective = await this.prisma.objective.findUnique({ where: { id: objectiveId } });
    if (!existingObjective) throw new NotFoundException('Objetivo não encontrado');
    const okrId = existingObjective.okrId;

    await this.prisma.objective.delete({ where: { id: objectiveId } });

    await this.updateObjectiveProgress(okrId);
  }

  /**
   * Atualiza automaticamente o progresso de um objetivo baseado nos key results
   */
  public async updateObjectiveProgress(objectiveId: string): Promise<void> {
    const objective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
      include: { keyResults: true },
    });

    if (!objective || !objective.keyResults.length) {
      if (objective) {
        await this.prisma.objective.update({
          where: { id: objectiveId },
          data: { progress: 0, status: ObjectiveStatus.NOT_STARTED },
        });
        await this.okrService.updateOKRProgress(objective.okrId);
      }
      return;
    }

    let totalProgress = 0;
    objective.keyResults.forEach(kr => {
      totalProgress += this.keyResultService.calculateKeyResultProgress(kr);
    });
    const averageProgress = Math.round(totalProgress / objective.keyResults.length);

    let status: ObjectiveStatus = ObjectiveStatus.NOT_STARTED;
    if (averageProgress >= 100) status = ObjectiveStatus.COMPLETED;
    else if (averageProgress > 0) status = ObjectiveStatus.IN_PROGRESS;

    await this.prisma.objective.update({ where: { id: objectiveId }, data: { progress: averageProgress, status } });

    await this.okrService.updateOKRProgress(objective.okrId);
  }

  /**
   * Mapeia dados do Prisma para ObjectiveResponseDto
   */
  public mapToObjectiveResponse(objective: any): ObjectiveResponseDto {
    const response = {
      id: objective.id,
      okrId: objective.okrId,
      title: objective.title,
      description: objective.description,
      status: objective.status,
      progress: objective.progress,
      createdAt: objective.createdAt,
      updatedAt: objective.updatedAt,
      keyResults: objective.keyResults?.map(kr => this.keyResultService.mapToKeyResultResponse(kr)),
    };

    // Serializar datas antes de retornar
    return DateSerializer.serializeObject(response, ['createdAt', 'updatedAt']);
  }
}