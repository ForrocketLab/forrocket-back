import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import {
  CreateEvaluationCycleDto,
  ActivateCycleDto,
  UpdateCycleStatusDto,
  UpdateCyclePhaseDto,
} from './dto/evaluation-cycle.dto';
import { PrismaService } from '../../database/prisma.service';
import { DateSerializer } from '../../common/utils/date-serializer.util';

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvaluationCycles() {
    const cycles = await this.prisma.evaluationCycle.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Serializar as datas para strings ISO
    return DateSerializer.serializeArray(cycles, DateSerializer.CYCLE_DATE_FIELDS);
  }

  async getEvaluationCycleById(id: string) {
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { id },
    });
    
    if (!cycle) {
      return null;
    }
    
    // Serializar as datas para strings ISO
    return DateSerializer.serializeObject(cycle, DateSerializer.CYCLE_DATE_FIELDS);
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

    // Função helper para converter strings de data para Date
    const parseDate = (dateValue: string | undefined): Date | null => {
      if (!dateValue) return null;
      
      // Se for formato YYYY-MM-DD, adicionar horário padrão
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return new Date(dateValue + 'T00:00:00.000Z');
      }
      
      // Para outros formatos, usar construtor padrão
      const parsed = new Date(dateValue);
      
      // Verificar se a data é válida
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(`Data inválida: ${dateValue}`);
      }
      
      return parsed;
    };

    // Preparar dados para criação
    const createData = {
      name: dto.name,
      status: 'UPCOMING' as const,
      startDate: parseDate(dto.startDate),
      endDate: parseDate(dto.endDate),
      assessmentDeadline: parseDate(dto.assessmentDeadline),
      managerDeadline: parseDate(dto.managerDeadline),
      equalizationDeadline: parseDate(dto.equalizationDeadline),
    };

    // Validar consistência de datas antes de salvar
    this.validateCycleDatesConsistency(createData);

    // Validar se não há conflito com ciclo ativo
    await this.validateNoCycleConflict(createData);

    const createdCycle = await this.prisma.evaluationCycle.create({
      data: createData,
    });

    // Serializar as datas para strings ISO
    return DateSerializer.serializeObject(createdCycle, DateSerializer.CYCLE_DATE_FIELDS);
  }

  /**
   * Busca um ciclo de avaliação pelo ano e semestre
   */
  async findByYearAndSemester(year: number, semester: number) {
    const name = `${year}.${semester}`;
    const cycle = await this.prisma.evaluationCycle.findUnique({
      where: { name },
    });
    
    if (!cycle) {
      return null;
    }
    
    // Serializar as datas para strings ISO
    return DateSerializer.serializeObject(cycle, DateSerializer.CYCLE_DATE_FIELDS);
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
    const updatedCycle = await this.prisma.$transaction(async (tx) => {
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

    // Serializar as datas para strings ISO
    return DateSerializer.serializeObject(updatedCycle, DateSerializer.CYCLE_DATE_FIELDS);
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
      const updatedCycle = await this.prisma.$transaction(async (tx) => {
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

      // Serializar as datas para strings ISO
      return DateSerializer.serializeObject(updatedCycle, DateSerializer.CYCLE_DATE_FIELDS);
    }

    // Para outros status, apenas atualizar
    const updatedCycle = await this.prisma.evaluationCycle.update({
      where: { id: cycleId },
      data: { status: dto.status },
    });

    // Serializar as datas para strings ISO
    return DateSerializer.serializeObject(updatedCycle, DateSerializer.CYCLE_DATE_FIELDS);
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

    const updatedCycle = await this.prisma.evaluationCycle.update({
      where: { id: cycleId },
      data: { phase: dto.phase },
    });

    // Serializar as datas para strings ISO
    return DateSerializer.serializeObject(updatedCycle, DateSerializer.CYCLE_DATE_FIELDS);
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

    // Usar o utilitário DateSerializer para serializar todas as datas
    return DateSerializer.serializeObject(activeCycle, DateSerializer.CYCLE_DATE_FIELDS);
  }

  /**
   * Valida se não há conflito com ciclo ativo
   */
  private async validateNoCycleConflict(data: any) {
    const { startDate, endDate } = data;
    
    if (!startDate) return; // Se não tem data de início, não há conflito

    // Função helper para converter strings de data para Date
    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      
      const dateString = dateValue.toString();
      
      // Se for formato YYYY-MM-DD, adicionar horário padrão
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(dateString + 'T00:00:00.000Z');
      }
      
      return new Date(dateString);
    };

    const newStart = parseDate(startDate);
    const newEnd = parseDate(endDate);
    
    if (!newStart) return;

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

    // Função helper para converter strings de data para Date
    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      
      // Se for string, tentar converter
      const dateString = dateValue.toString();
      
      // Se for formato YYYY-MM-DD, adicionar horário padrão
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(dateString + 'T00:00:00.000Z');
      }
      
      // Para outros formatos, usar construtor padrão
      const parsed = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(`Data inválida: ${dateString}`);
      }
      
      return parsed;
    };

    // Converter strings para Date se necessário
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const assessment = parseDate(assessmentDeadline);
    const manager = parseDate(managerDeadline);
    const equalization = parseDate(equalizationDeadline);

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

    // Serializar as datas dos deadlines
    const serializedDeadlines = deadlines.map(deadline => ({
      ...deadline,
      deadline: DateSerializer.toISOString(deadline.deadline),
    }));

    return {
      cycle: DateSerializer.serializeObject({
        id: cycle.id,
        name: cycle.name,
        status: cycle.status,
        phase: cycle.phase,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      }, DateSerializer.CYCLE_DATE_FIELDS),
      deadlines: serializedDeadlines,
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
