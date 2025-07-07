import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import {
  CreateEvaluationCycleDto,
  ActivateCycleDto,
  UpdateCycleStatusDto,
  UpdateCyclePhaseDto,
} from './dto/evaluation-cycle.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvaluationCycles() {
    return await this.prisma.evaluationCycle.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getEvaluationCycleById(id: string) {
    return await this.prisma.evaluationCycle.findUnique({
      where: { id },
    });
  }

  async getActiveCycle() {
    return await this.prisma.evaluationCycle.findFirst({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cria um novo ciclo de avaliação
   */
  async createEvaluationCycle(dto: CreateEvaluationCycleDto) {
    // Verificar se já existe um ciclo com o mesmo nome
    const existingCycle = await this.prisma.evaluationCycle.findUnique({
      where: { name: dto.name },
    });

    if (existingCycle) {
      throw new BadRequestException(`Já existe um ciclo com o nome "${dto.name}"`);
    }

    // Preparar dados para criação
    const createData = {
      name: dto.name,
      status: 'UPCOMING' as const,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      assessmentDeadline: dto.assessmentDeadline ? new Date(dto.assessmentDeadline) : null,
      managerDeadline: dto.managerDeadline ? new Date(dto.managerDeadline) : null,
      equalizationDeadline: dto.equalizationDeadline ? new Date(dto.equalizationDeadline) : null,
    };

    // Validar consistência de datas antes de salvar
    this.validateCycleDatesConsistency(createData);

    // Validar se não há conflito com ciclo ativo
    await this.validateNoCycleConflict(createData);

    return this.prisma.evaluationCycle.create({
      data: createData,
    });
  }

  /**
   * Busca um ciclo de avaliação pelo ano e semestre
   */
  async findByYearAndSemester(year: number, semester: number) {
  const name = `${year}.${semester}`;
  return this.prisma.evaluationCycle.findUnique({
    where: { name },
  });
  }

  /**
   * Ativa um ciclo (muda status para OPEN) e desativa outros ciclos ativos
   */
  async activateCycle(cycleId: string, dto: ActivateCycleDto) {
    // Verificar se o ciclo existe
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo não encontrado');
    }

    // Verificar se o ciclo já está ativo
    if (cycle.status === 'OPEN') {
      throw new BadRequestException('Este ciclo já está ativo');
    }

    // Preparar dados para atualização
    const updateData: any = {
      status: 'OPEN',
      startDate: dto.startDate ? new Date(dto.startDate) : cycle.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : cycle.endDate,
    };

    // Adicionar deadlines se fornecidas
    if (dto.assessmentDeadline) {
      updateData.assessmentDeadline = new Date(dto.assessmentDeadline);
    }
    if (dto.managerDeadline) {
      updateData.managerDeadline = new Date(dto.managerDeadline);
    }
    if (dto.equalizationDeadline) {
      updateData.equalizationDeadline = new Date(dto.equalizationDeadline);
    }

    // Automatizar endDate baseado na equalizationDeadline se solicitado
    if (dto.autoSetEndDate !== false && dto.equalizationDeadline) {
      const equalizationDate = new Date(dto.equalizationDeadline);
      // Adicionar 7 dias após a deadline de equalização para dar margem
      const autoEndDate = new Date(equalizationDate);
      autoEndDate.setDate(autoEndDate.getDate() + 7);
      updateData.endDate = autoEndDate;
    }

    // Validar consistência de datas antes de salvar
    this.validateCycleDatesConsistency(updateData);

    // Usar transação para garantir atomicidade
    return this.prisma.$transaction(async (tx) => {
      // Primeiro, desativar todos os ciclos ativos (mudar para CLOSED)
      await tx.evaluationCycle.updateMany({
        where: { status: 'OPEN' },
        data: { status: 'CLOSED' },
      });

      // Depois, ativar o ciclo escolhido
      return tx.evaluationCycle.update({
        where: { id: cycleId },
        data: updateData,
      });
    });
  }

  /**
   * Atualiza o status de um ciclo
   */
  async updateCycleStatus(cycleId: string, dto: UpdateCycleStatusDto) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo não encontrado');
    }

    // Se estiver ativando um ciclo (mudando para OPEN), desativar outros
    if (dto.status === 'OPEN' && cycle.status !== 'OPEN') {
      return this.prisma.$transaction(async (tx) => {
        // Desativar todos os ciclos ativos
        await tx.evaluationCycle.updateMany({
          where: { status: 'OPEN' },
          data: { status: 'CLOSED' },
        });

        // Ativar o ciclo escolhido
        return tx.evaluationCycle.update({
          where: { id: cycleId },
          data: { status: dto.status },
        });
      });
    }

    // Para outros status, apenas atualizar
    return this.prisma.evaluationCycle.update({
      where: { id: cycleId },
      data: { status: dto.status },
    });
  }

  /**
   * Valida se existe um ciclo ativo
   */
  async validateActiveCycleExists(): Promise<{ id: string; name: string }> {
    const activeCycle = await this.getActiveCycle();

    if (!activeCycle) {
      throw new BadRequestException(
        'Não há nenhum ciclo de avaliação ativo. Um administrador deve ativar um ciclo primeiro.',
      );
    }

    return { id: activeCycle.id, name: activeCycle.name };
  }

  /**
   * Valida se um ciclo específico é o ciclo ativo
   */
  async validateCycleIsActive(cycleName: string): Promise<boolean> {
    const activeCycle = await this.getActiveCycle();
    return activeCycle?.name === cycleName;
  }

  /**
   * Atualiza a fase de um ciclo
   */
  async updateCyclePhase(cycleId: string, dto: UpdateCyclePhaseDto) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo não encontrado');
    }

    // Apenas ciclos ativos (OPEN) podem ter suas fases alteradas
    if (cycle.status !== 'OPEN') {
      throw new BadRequestException('Apenas ciclos ativos podem ter suas fases alteradas');
    }

    // Validar transições de fase
    const currentPhase = cycle.phase as 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION';
    this.validatePhaseTransition(currentPhase, dto.phase);

    return this.prisma.evaluationCycle.update({
      where: { id: cycleId },
      data: { phase: dto.phase },
    });
  }

  /**
   * Valida se a transição de fase é permitida
   */
  private validatePhaseTransition(currentPhase: string, newPhase: string) {
    const validTransitions = {
      ASSESSMENTS: ['MANAGER_REVIEWS'], // Da fase 1 só pode ir para fase 2
      MANAGER_REVIEWS: ['EQUALIZATION'], // Da fase 2 só pode ir para fase 3
      EQUALIZATION: [], // Da fase 3 não pode voltar
    };

    const allowed = validTransitions[currentPhase] || [];

    if (!allowed.includes(newPhase)) {
      throw new BadRequestException(
        `Transição de fase inválida: não é possível ir de ${currentPhase} para ${newPhase}`,
      );
    }
  }

  /**
   * Valida se o ciclo ativo está na fase correta para um tipo de avaliação
   */
  async validateActiveCyclePhase(
    requiredPhase: 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION',
  ) {
    const activeCycle = await this.getActiveCycle();

    if (!activeCycle) {
      throw new BadRequestException(
        'Não há nenhum ciclo de avaliação ativo. Um administrador deve ativar um ciclo primeiro.',
      );
    }

    if (activeCycle.phase !== requiredPhase) {
      const phaseNames = {
        ASSESSMENTS: 'Avaliações (Autoavaliação, 360, Mentoring, Reference)',
        MANAGER_REVIEWS: 'Avaliações de Gestor',
        EQUALIZATION: 'Equalização',
      };

      throw new BadRequestException(
        `Esta ação não está disponível na fase atual. Fase atual: ${phaseNames[activeCycle.phase]}. Fase necessária: ${phaseNames[requiredPhase]}.`,
      );
    }

    return { id: activeCycle.id, name: activeCycle.name, phase: activeCycle.phase };
  }

  /**
   * Obtém informações sobre o ciclo ativo incluindo fase
   */
  async getActiveCycleWithPhase() {
    const activeCycle = await this.getActiveCycle();

    if (!activeCycle) {
      return null;
    }

    return {
      id: activeCycle.id,
      name: activeCycle.name,
      status: activeCycle.status,
      phase: activeCycle.phase,
      startDate: activeCycle.startDate,
      endDate: activeCycle.endDate,
      assessmentDeadline: activeCycle.assessmentDeadline,
      managerDeadline: activeCycle.managerDeadline,
      equalizationDeadline: activeCycle.equalizationDeadline,
    };
  }

  /**
   * Valida se não há conflito com ciclo ativo
   */
  private async validateNoCycleConflict(data: any) {
    const { startDate, endDate } = data;
    
    if (!startDate) return; // Se não tem data de início, não há conflito

    const newStart = startDate instanceof Date ? startDate : new Date(startDate);
    const newEnd = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;

    // Buscar ciclo ativo
    const activeCycle = await this.getActiveCycle();
    
    if (!activeCycle || !activeCycle.startDate || !activeCycle.endDate) {
      return; // Não há ciclo ativo ou ciclo ativo não tem datas definidas
    }

    const activeStart = activeCycle.startDate;
    const activeEnd = activeCycle.endDate;

    // Verificar se a data de início do novo ciclo está dentro do período do ciclo ativo
    if (newStart >= activeStart && newStart <= activeEnd) {
      throw new BadRequestException(
        `Não é possível criar um ciclo com data de início ${newStart.toLocaleDateString('pt-BR')} pois há um ciclo ativo (${activeCycle.name}) no período de ${activeStart.toLocaleDateString('pt-BR')} a ${activeEnd.toLocaleDateString('pt-BR')}`
      );
    }

    // Se o novo ciclo tem data de fim, verificar se há sobreposição
    if (newEnd) {
      // Verificar se há qualquer sobreposição entre os períodos
      const hasOverlap = (newStart <= activeEnd && newEnd >= activeStart);
      
      if (hasOverlap) {
        throw new BadRequestException(
          `Não é possível criar um ciclo no período de ${newStart.toLocaleDateString('pt-BR')} a ${newEnd.toLocaleDateString('pt-BR')} pois há sobreposição com o ciclo ativo (${activeCycle.name}) no período de ${activeStart.toLocaleDateString('pt-BR')} a ${activeEnd.toLocaleDateString('pt-BR')}`
        );
      }
    }
  }

  /**
   * Valida consistência de datas do ciclo
   */
  private validateCycleDatesConsistency(data: any) {
    const {
      startDate,
      endDate,
      assessmentDeadline,
      managerDeadline,
      equalizationDeadline,
    } = data;

    // Converter strings para Date se necessário
    const start = startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : null;
    const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;
    const assessment = assessmentDeadline ? (assessmentDeadline instanceof Date ? assessmentDeadline : new Date(assessmentDeadline)) : null;
    const manager = managerDeadline ? (managerDeadline instanceof Date ? managerDeadline : new Date(managerDeadline)) : null;
    const equalization = equalizationDeadline ? (equalizationDeadline instanceof Date ? equalizationDeadline : new Date(equalizationDeadline)) : null;

    // Validar se endDate é posterior a startDate
    if (start && end && end <= start) {
      throw new BadRequestException('A data de término deve ser posterior à data de início');
    }

    // Validar se assessment deadline é posterior a startDate
    if (start && assessment && assessment <= start) {
      throw new BadRequestException('O prazo de avaliações deve ser posterior à data de início');
    }

    // Validar sequência de deadlines: assessment < manager < equalization
    if (assessment && manager && manager <= assessment) {
      throw new BadRequestException('O prazo de avaliações de gestor deve ser posterior ao prazo de avaliações');
    }

    if (manager && equalization && equalization <= manager) {
      throw new BadRequestException('O prazo de equalização deve ser posterior ao prazo de avaliações de gestor');
    }

    if (assessment && equalization && equalization <= assessment) {
      throw new BadRequestException('O prazo de equalização deve ser posterior ao prazo de avaliações');
    }

    // Validar se equalization deadline é anterior a endDate
    if (equalization && end && equalization >= end) {
      throw new BadRequestException('O prazo de equalização deve ser anterior à data de término do ciclo');
    }

    // Validar se todas as deadlines estão dentro do período do ciclo
    if (start && assessment && assessment <= start) {
      throw new BadRequestException('O prazo de avaliações deve estar dentro do período do ciclo');
    }

    if (start && manager && manager <= start) {
      throw new BadRequestException('O prazo de avaliações de gestor deve estar dentro do período do ciclo');
    }

    if (start && equalization && equalization <= start) {
      throw new BadRequestException('O prazo de equalização deve estar dentro do período do ciclo');
    }

    if (end && assessment && assessment >= end) {
      throw new BadRequestException('O prazo de avaliações deve estar dentro do período do ciclo');
    }

    if (end && manager && manager >= end) {
      throw new BadRequestException('O prazo de avaliações de gestor deve estar dentro do período do ciclo');
    }
  }

  /**
   * Obtém informações detalhadas sobre deadlines e prazos de um ciclo
   */
  async getCycleDeadlinesInfo(cycleId: string) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo não encontrado');
    }

    const now = new Date();
    const deadlines: Array<{
      phase: string;
      name: string;
      deadline: Date;
      daysUntil: number;
      status: string;
    }> = [];

    // Deadline de avaliações
    if (cycle.assessmentDeadline) {
      const daysUntil = Math.ceil((cycle.assessmentDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      deadlines.push({
        phase: 'ASSESSMENTS',
        name: 'Avaliações (Autoavaliação, 360°, Mentoring, Reference)',
        deadline: cycle.assessmentDeadline,
        daysUntil,
        status: daysUntil < 0 ? 'OVERDUE' : daysUntil <= 3 ? 'URGENT' : 'OK',
      });
    }

    // Deadline de gestores
    if (cycle.managerDeadline) {
      const daysUntil = Math.ceil((cycle.managerDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      deadlines.push({
        phase: 'MANAGER_REVIEWS',
        name: 'Avaliações de Gestor',
        deadline: cycle.managerDeadline,
        daysUntil,
        status: daysUntil < 0 ? 'OVERDUE' : daysUntil <= 3 ? 'URGENT' : 'OK',
      });
    }

    // Deadline de equalização
    if (cycle.equalizationDeadline) {
      const daysUntil = Math.ceil((cycle.equalizationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      deadlines.push({
        phase: 'EQUALIZATION',
        name: 'Equalização do Comitê',
        deadline: cycle.equalizationDeadline,
        daysUntil,
        status: daysUntil < 0 ? 'OVERDUE' : daysUntil <= 3 ? 'URGENT' : 'OK',
      });
    }

    // Verificar inconsistências de datas
    const inconsistencies: string[] = [];
    try {
      this.validateCycleDatesConsistency(cycle);
    } catch (error: any) {
      inconsistencies.push(error.message);
    }

    return {
      cycle: {
        id: cycle.id,
        name: cycle.name,
        status: cycle.status,
        phase: cycle.phase,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      },
      deadlines,
      summary: {
        totalDeadlines: deadlines.length,
        overdueCount: deadlines.filter(d => d.status === 'OVERDUE').length,
        urgentCount: deadlines.filter(d => d.status === 'URGENT').length,
        okCount: deadlines.filter(d => d.status === 'OK').length,
      },
      inconsistencies,
      hasInconsistencies: inconsistencies.length > 0,
    };
  }
}
