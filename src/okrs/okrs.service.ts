import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateOKRDto, 
  UpdateOKRDto, 
  CreateObjectiveDto, 
  UpdateObjectiveDto, 
  CreateKeyResultDto, 
  UpdateKeyResultDto,
  OKRResponseDto,
  OKRSummaryDto,
  ObjectiveResponseDto,
  KeyResultResponseDto 
} from './dto';
import { OKRStatus, ObjectiveStatus, KeyResultStatus, KeyResultType } from '@prisma/client';

/**
 * Service responsável pela lógica de negócio dos OKRs
 */
@Injectable()
export class OKRsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // OPERAÇÕES DE OKR
  // ==========================================

  /**
   * Cria um novo OKR para o usuário
   */
  async createOKR(userId: string, createOKRDto: CreateOKRDto): Promise<OKRResponseDto> {
    // Validar se o período é válido (a partir de Q3 2025)
    this.validateQuarterPeriod(createOKRDto.quarter, createOKRDto.year);

    // Verificar se já existe OKR para o mesmo quarter/year
    const existingOKR = await this.prisma.oKR.findFirst({
      where: {
        userId,
        quarter: createOKRDto.quarter,
        year: createOKRDto.year,
      },
    });

    if (existingOKR) {
      throw new ConflictException(`Já existe um OKR para ${createOKRDto.quarter}/${createOKRDto.year}`);
    }

    // Criar OKR
    const okr = await this.prisma.oKR.create({
      data: {
        userId,
        title: createOKRDto.title,
        description: createOKRDto.description,
        quarter: createOKRDto.quarter,
        year: createOKRDto.year,
        status: OKRStatus.ACTIVE,
      },
      include: {
        objectives: {
          include: {
            keyResults: true,
          },
        },
      },
    });

    // Criar objetivos se fornecidos
    if (createOKRDto.objectives && createOKRDto.objectives.length > 0) {
      for (const objectiveDto of createOKRDto.objectives) {
        await this.createObjective(okr.id, objectiveDto);
      }
    }

    // Buscar OKR completo criado
    return this.getOKRById(okr.id);
  }

  /**
   * Busca todos os OKRs do usuário
   */
  async getUserOKRs(userId: string): Promise<OKRSummaryDto[]> {
    const okrs = await this.prisma.oKR.findMany({
      where: { userId },
      include: {
        objectives: {
          include: {
            keyResults: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { quarter: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return okrs.map(okr => this.mapToOKRSummary(okr));
  }

  /**
   * Busca um OKR específico por ID
   */
  async getOKRById(okrId: string): Promise<OKRResponseDto> {
    const okr = await this.prisma.oKR.findUnique({
      where: { id: okrId },
      include: {
        objectives: {
          include: {
            keyResults: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!okr) {
      throw new NotFoundException('OKR não encontrado');
    }

    return this.mapToOKRResponse(okr);
  }

  /**
   * Atualiza um OKR existente
   */
  async updateOKR(okrId: string, userId: string, updateOKRDto: UpdateOKRDto): Promise<OKRResponseDto> {
    // Verificar se o OKR pertence ao usuário
    const existingOKR = await this.prisma.oKR.findFirst({
      where: { id: okrId, userId },
    });

    if (!existingOKR) {
      throw new NotFoundException('OKR não encontrado ou você não tem permissão para editá-lo');
    }

    // Verificar conflito de quarter/year se estiver sendo alterado
    if (updateOKRDto.quarter || updateOKRDto.year) {
      const quarter = updateOKRDto.quarter || existingOKR.quarter;
      const year = updateOKRDto.year || existingOKR.year;

      // Validar se o novo período é válido
      this.validateQuarterPeriod(quarter, year);

      const conflictOKR = await this.prisma.oKR.findFirst({
        where: {
          userId,
          quarter,
          year,
          id: { not: okrId },
        },
      });

      if (conflictOKR) {
        throw new ConflictException(`Já existe um OKR para ${quarter}/${year}`);
      }
    }

    await this.prisma.oKR.update({
      where: { id: okrId },
      data: updateOKRDto,
    });

    return this.getOKRById(okrId);
  }

  /**
   * Remove um OKR
   */
  async deleteOKR(okrId: string, userId: string): Promise<void> {
    const existingOKR = await this.prisma.oKR.findFirst({
      where: { id: okrId, userId },
    });

    if (!existingOKR) {
      throw new NotFoundException('OKR não encontrado ou você não tem permissão para deletá-lo');
    }

    await this.prisma.oKR.delete({
      where: { id: okrId },
    });
  }

  // ==========================================
  // OPERAÇÕES DE OBJETIVOS
  // ==========================================

  /**
   * Cria um novo objetivo para um OKR
   */
  async createObjective(okrId: string, createObjectiveDto: CreateObjectiveDto): Promise<ObjectiveResponseDto> {
    // Verificar se o OKR existe
    const okr = await this.prisma.oKR.findUnique({
      where: { id: okrId },
    });

    if (!okr) {
      throw new NotFoundException('OKR não encontrado');
    }

    // Criar objetivo
    const objective = await this.prisma.objective.create({
      data: {
        okrId,
        title: createObjectiveDto.title,
        description: createObjectiveDto.description,
        status: ObjectiveStatus.NOT_STARTED,
        progress: 0,
      },
      include: {
        keyResults: true,
      },
    });

    // Criar key results se fornecidos
    if (createObjectiveDto.keyResults && createObjectiveDto.keyResults.length > 0) {
      for (const keyResultDto of createObjectiveDto.keyResults) {
        await this.createKeyResult(objective.id, keyResultDto);
      }
    }

    // Atualizar o progresso do OKR pai automaticamente
    await this.updateOKRProgress(okrId);

    return this.getObjectiveById(objective.id);
  }

  /**
   * Busca um objetivo por ID
   */
  async getObjectiveById(objectiveId: string): Promise<ObjectiveResponseDto> {
    const objective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
      include: {
        keyResults: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!objective) {
      throw new NotFoundException('Objetivo não encontrado');
    }

    return this.mapToObjectiveResponse(objective);
  }

  /**
   * Atualiza um objetivo
   */
  async updateObjective(objectiveId: string, updateObjectiveDto: UpdateObjectiveDto): Promise<ObjectiveResponseDto> {
    const existingObjective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
    });

    if (!existingObjective) {
      throw new NotFoundException('Objetivo não encontrado');
    }

    await this.prisma.objective.update({
      where: { id: objectiveId },
      data: updateObjectiveDto,
    });

    // Atualizar o progresso do OKR pai automaticamente se houve mudança no progresso
    if (updateObjectiveDto.progress !== undefined) {
      await this.updateOKRProgress(existingObjective.okrId);
    }

    return this.getObjectiveById(objectiveId);
  }

  /**
   * Remove um objetivo
   */
  async deleteObjective(objectiveId: string): Promise<void> {
    const existingObjective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
    });

    if (!existingObjective) {
      throw new NotFoundException('Objetivo não encontrado');
    }

    const okrId = existingObjective.okrId;

    await this.prisma.objective.delete({
      where: { id: objectiveId },
    });

    // Atualizar o progresso do OKR pai automaticamente
    await this.updateOKRProgress(okrId);
  }

  // ==========================================
  // OPERAÇÕES DE KEY RESULTS
  // ==========================================

  /**
   * Cria um novo key result para um objetivo
   */
  async createKeyResult(objectiveId: string, createKeyResultDto: CreateKeyResultDto): Promise<KeyResultResponseDto> {
    // Verificar se o objetivo existe
    const objective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
    });

    if (!objective) {
      throw new NotFoundException('Objetivo não encontrado');
    }

    // NOVA VALIDAÇÃO: Verificar se já existe Key Result com o mesmo título no objetivo
    const existingKeyResult = await this.prisma.keyResult.findFirst({
      where: {
        objectiveId,
        title: createKeyResultDto.title.trim(),
      },
    });

    if (existingKeyResult) {
      throw new ConflictException(`Já existe um Key Result com o título "${createKeyResultDto.title}" neste objetivo`);
    }

    // Calcular status automaticamente baseado no valor inicial
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
        title: createKeyResultDto.title.trim(), // Remover espaços extras
        description: createKeyResultDto.description,
        type: createKeyResultDto.type,
        targetValue: createKeyResultDto.targetValue,
        currentValue,
        unit: createKeyResultDto.unit,
        status,
      },
    });

    return this.mapToKeyResultResponse(keyResult);
  }

  /**
   * Busca um key result por ID
   */
  async getKeyResultById(keyResultId: string): Promise<KeyResultResponseDto> {
    const keyResult = await this.prisma.keyResult.findUnique({
      where: { id: keyResultId },
    });

    if (!keyResult) {
      throw new NotFoundException('Key Result não encontrado');
    }

    return this.mapToKeyResultResponse(keyResult);
  }

  /**
   * Atualiza um key result
   */
  async updateKeyResult(keyResultId: string, updateKeyResultDto: UpdateKeyResultDto): Promise<KeyResultResponseDto> {
    const existingKeyResult = await this.prisma.keyResult.findUnique({
      where: { id: keyResultId },
    });

    if (!existingKeyResult) {
      throw new NotFoundException('Key Result não encontrado');
    }

    // Calcular o novo status automaticamente se currentValue foi alterado
    let updateData = { ...updateKeyResultDto };
    
    if (updateKeyResultDto.currentValue !== undefined) {
      // Filtrar campos undefined para não sobrescrever valores válidos
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateKeyResultDto).filter(([_, value]) => value !== undefined)
      );
      const updatedKeyResult = { ...existingKeyResult, ...filteredUpdateData };
      const progress = this.calculateKeyResultProgress(updatedKeyResult);
      
      // Determinar status baseado no progresso
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

    // Atualizar o progresso do objetivo pai automaticamente
    await this.updateObjectiveProgress(existingKeyResult.objectiveId);

    return this.mapToKeyResultResponse(keyResult);
  }

  /**
   * Remove um key result
   */
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

    // Atualizar o progresso do objetivo pai
    await this.updateObjectiveProgress(existingKeyResult.objectiveId);
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Atualiza automaticamente o progresso de um objetivo baseado nos key results
   */
  private async updateObjectiveProgress(objectiveId: string): Promise<void> {
    const objective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
      include: { keyResults: true },
    });

    if (!objective || !objective.keyResults.length) {
      return;
    }

    let totalProgress = 0;
    objective.keyResults.forEach(kr => {
      totalProgress += this.calculateKeyResultProgress(kr);
    });

    const averageProgress = Math.round(totalProgress / objective.keyResults.length);
    
    // Determinar status baseado no progresso
    let status: ObjectiveStatus = ObjectiveStatus.NOT_STARTED;
    if (averageProgress >= 100) {
      status = ObjectiveStatus.COMPLETED;
    } else if (averageProgress > 0) {
      status = ObjectiveStatus.IN_PROGRESS;
    }

    await this.prisma.objective.update({
      where: { id: objectiveId },
      data: {
        progress: averageProgress,
        status,
      },
    });

    // Atualizar o progresso do OKR pai automaticamente
    await this.updateOKRProgress(objective.okrId);
  }

  /**
   * Atualiza automaticamente o progresso e status de um OKR baseado nos objetivos
   */
  private async updateOKRProgress(okrId: string): Promise<void> {
    const okr = await this.prisma.oKR.findUnique({
      where: { id: okrId },
      include: { objectives: true },
    });

    if (!okr || !okr.objectives.length) {
      return;
    }

    // Calcular progresso geral baseado nos objetivos
    let totalProgress = 0;
    okr.objectives.forEach(obj => {
      totalProgress += obj.progress;
    });

    const overallProgress = Math.round(totalProgress / okr.objectives.length);
    
    // Determinar status baseado no progresso
    let status: OKRStatus = okr.status; // Manter status atual por padrão
    
    if (overallProgress >= 100 && okr.status === OKRStatus.ACTIVE) {
      status = OKRStatus.COMPLETED;
    } else if (overallProgress < 100 && okr.status === OKRStatus.COMPLETED) {
      status = OKRStatus.ACTIVE; // Voltar para ativo se progresso diminuiu
    }

    // Só atualizar se houver mudança no status
    if (status !== okr.status) {
      await this.prisma.oKR.update({
        where: { id: okrId },
        data: { status },
      });
    }
  }

  /**
   * Calcula o progresso de um key result (sempre em percentual)
   */
  private calculateKeyResultProgress(keyResult: any): number {
    // Para tipo PERCENTAGE, o currentValue já é uma porcentagem de 0-100
    return Math.min(Math.max(keyResult.currentValue, 0), 100);
  }

  /**
   * Mapeia dados do Prisma para OKRSummaryDto
   */
  private mapToOKRSummary(okr: any): OKRSummaryDto {
    const completedObjectives = okr.objectives.filter(obj => 
      obj.status === ObjectiveStatus.COMPLETED || obj.progress >= 100
    ).length;

    let overallProgress = 0;
    if (okr.objectives.length > 0) {
      const totalProgress = okr.objectives.reduce((sum, obj) => sum + obj.progress, 0);
      overallProgress = Math.round(totalProgress / okr.objectives.length);
    }

    return {
      id: okr.id,
      title: okr.title,
      quarter: okr.quarter,
      year: okr.year,
      status: okr.status,
      overallProgress,
      objectivesCount: okr.objectives.length,
      completedObjectives,
      updatedAt: okr.updatedAt,
    };
  }

  /**
   * Mapeia dados do Prisma para OKRResponseDto
   */
  private mapToOKRResponse(okr: any): OKRResponseDto {
    let overallProgress = 0;
    if (okr.objectives.length > 0) {
      const totalProgress = okr.objectives.reduce((sum, obj) => sum + obj.progress, 0);
      overallProgress = Math.round(totalProgress / okr.objectives.length);
    }

    return {
      id: okr.id,
      userId: okr.userId,
      title: okr.title,
      description: okr.description,
      quarter: okr.quarter,
      year: okr.year,
      status: okr.status,
      overallProgress,
      createdAt: okr.createdAt,
      updatedAt: okr.updatedAt,
      objectives: okr.objectives.map(obj => this.mapToObjectiveResponse(obj)),
    };
  }

  /**
   * Mapeia dados do Prisma para ObjectiveResponseDto
   */
  private mapToObjectiveResponse(objective: any): ObjectiveResponseDto {
    return {
      id: objective.id,
      okrId: objective.okrId,
      title: objective.title,
      description: objective.description,
      status: objective.status,
      progress: objective.progress,
      createdAt: objective.createdAt,
      updatedAt: objective.updatedAt,
      keyResults: objective.keyResults?.map(kr => this.mapToKeyResultResponse(kr)),
    };
  }

  /**
   * Mapeia dados do Prisma para KeyResultResponseDto
   */
  private mapToKeyResultResponse(keyResult: any): KeyResultResponseDto {
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
   * Formata valores para exibição (sempre em porcentagem)
   */
  private formatValue(value: number, type: KeyResultType, unit?: string, targetValue?: number): string {
    return `${value}%`;
  }

  /**
   * Valida se o período é válido para criação de OKRs (a partir de Q3 2025)
   */
  private validateQuarterPeriod(quarter: string, year: number): void {
    // Período mínimo: Q3 2025
    const minYear = 2025;
    const minQuarter = 'Q3';

    if (year < minYear) {
      throw new BadRequestException(`Não é possível criar OKRs para anos anteriores a ${minYear}`);
    }

    if (year === minYear) {
      // Para 2025, só permitir Q3 e Q4
      const quarterNumber = quarter.split('-')[1]; // Extrai 'Q3' de '2025-Q3'
      const validQuarters = ['Q3', 'Q4'];
      
      if (!validQuarters.includes(quarterNumber)) {
        throw new BadRequestException(`Para ${year}, só é possível criar OKRs a partir do Q3`);
      }
    }

    // Anos futuros (2026+) são sempre válidos
  }
} 