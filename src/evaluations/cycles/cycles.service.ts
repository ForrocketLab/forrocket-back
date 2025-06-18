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

    return this.prisma.evaluationCycle.create({
      data: {
        name: dto.name,
        status: 'UPCOMING',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
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
        data: {
          status: 'OPEN',
          startDate: dto.startDate ? new Date(dto.startDate) : cycle.startDate,
          endDate: dto.endDate ? new Date(dto.endDate) : cycle.endDate,
        },
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
    };
  }
}
