import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateOKRDto, 
  UpdateOKRDto, 
  OKRResponseDto,
  OKRSummaryDto,
} from './dto';
import { OKRStatus, ObjectiveStatus, KeyResultType } from '@prisma/client';
import { ObjectiveService } from './objective.service';
import { DateSerializer } from '../common/utils/date-serializer.util';

/**
 * Service responsável pela lógica de negócio dos OKRs (Nível OKR)
 */
@Injectable()
export class OkrService { 
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ObjectiveService))
    private objectiveService: ObjectiveService,
  ) {}

  // ==========================================
  // OPERAÇÕES DE OKR
  // ==========================================

  /**
   * Cria um novo OKR para o usuário
   */
  async createOKR(userId: string, createOKRDto: CreateOKRDto): Promise<OKRResponseDto> {
    this.validateQuarterPeriod(createOKRDto.quarter, createOKRDto.year);

    const existingOKR = await this.prisma.oKR.findFirst({
      where: { userId, quarter: createOKRDto.quarter, year: createOKRDto.year },
    });

    if (existingOKR) {
      throw new ConflictException(`Já existe um OKR para ${createOKRDto.quarter}/${createOKRDto.year}`);
    }

    const okr = await this.prisma.oKR.create({
      data: {
        userId,
        title: createOKRDto.title,
        description: createOKRDto.description,
        quarter: createOKRDto.quarter,
        year: createOKRDto.year,
        status: OKRStatus.ACTIVE,
      },
    });

    if (createOKRDto.objectives && createOKRDto.objectives.length > 0) {
      for (const objectiveDto of createOKRDto.objectives) {
        await this.objectiveService.createObjective(okr.id, objectiveDto);
      }
    }

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
    const existingOKR = await this.prisma.oKR.findFirst({
      where: { id: okrId, userId },
    });

    if (!existingOKR) {
      throw new NotFoundException('OKR não encontrado ou você não tem permissão para editá-lo');
    }

    if (updateOKRDto.quarter || updateOKRDto.year) {
      const quarter = updateOKRDto.quarter || existingOKR.quarter;
      const year = updateOKRDto.year || existingOKR.year;

      this.validateQuarterPeriod(quarter, year);

      const conflictOKR = await this.prisma.oKR.findFirst({
        where: { userId, quarter, year, id: { not: okrId } },
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
  // MÉTODOS PÚBLICOS AUXILIARES (Chamados por outros serviços)
  // ==========================================

  /**
   * Atualiza automaticamente o progresso e status de um OKR baseado nos objetivos
   */
  public async updateOKRProgress(okrId: string): Promise<void> {
    const okr = await this.prisma.oKR.findUnique({
      where: { id: okrId },
      include: { objectives: true },
    });

    if (!okr || !okr.objectives.length) {
      return;
    }

    let totalProgress = 0;
    okr.objectives.forEach(obj => {
      totalProgress += obj.progress;
    });

    const overallProgress = Math.round(totalProgress / okr.objectives.length);
    
    let status: OKRStatus = okr.status;
    
    if (overallProgress >= 100 && okr.status === OKRStatus.ACTIVE) {
      status = OKRStatus.COMPLETED;
    } else if (overallProgress < 100 && okr.status === OKRStatus.COMPLETED) {
      status = OKRStatus.ACTIVE;
    }

    if (status !== okr.status) {
      await this.prisma.oKR.update({
        where: { id: okrId },
        data: { status },
      });
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS AUXILIARES (Usados apenas internamente neste serviço)
  // ==========================================

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

    const summary = {
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

    // Serializar datas antes de retornar
    return DateSerializer.serializeObject(summary, ['updatedAt']);
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

    const response = {
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
      objectives: okr.objectives.map(obj => this.objectiveService.mapToObjectiveResponse(obj)),
    };

    // Serializar datas antes de retornar
    return DateSerializer.serializeObject(response, ['createdAt', 'updatedAt']);
  }

  /**
   * Valida se o período é válido para criação de OKRs (a partir de Q3 2025)
   */
  private validateQuarterPeriod(quarter: string, year: number): void {
    const minYear = 2025;
    const minQuarter = 'Q3';

    if (year < minYear) {
      throw new BadRequestException(`Não é possível criar OKRs para anos anteriores a ${minYear}`);
    }

    if (year === minYear) {
      const quarterNumber = quarter.split('-')[1];
      const validQuarters = ['Q3', 'Q4'];
      
      if (!validQuarters.includes(quarterNumber)) {
        throw new BadRequestException(`Para ${year}, só é possível criar OKRs a partir do Q3`);
      }
    }
  }
}