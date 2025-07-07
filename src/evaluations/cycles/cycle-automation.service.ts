import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CycleAutomationService {
  private readonly logger = new Logger(CycleAutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa a cada minuto para verificar automações de ciclo
   * Verifica:
   * - Ciclos que devem ser ativados (startDate chegou)
   * - Fases que devem mudar (deadlines passaram)
   * - Ciclos que devem ser fechados (endDate passou)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkCycleAutomations() {
    this.logger.debug('🔄 Verificando automações de ciclo...');
    
    try {
      const now = new Date();
      
      // 1. Verificar ciclos para ativar
      await this.checkCyclesToActivate(now);
      
      // 2. Verificar mudanças de fase
      await this.checkPhaseTransitions(now);
      
      // 3. Verificar ciclos para fechar
      await this.checkCyclesToClose(now);
      
    } catch (error) {
      this.logger.error('❌ Erro na automação de ciclos:', error);
    }
  }

  /**
   * Verifica ciclos UPCOMING que devem ser ativados
   */
  private async checkCyclesToActivate(now: Date) {
    const cyclesToActivate = await this.prisma.evaluationCycle.findMany({
      where: {
        status: 'UPCOMING',
        startDate: {
          lte: now, // Data de início já passou
        },
      },
    });

    for (const cycle of cyclesToActivate) {
      try {
        // Primeiro desativar todos os ciclos ativos
        await this.prisma.evaluationCycle.updateMany({
          where: { status: 'OPEN' },
          data: { status: 'CLOSED' },
        });

        // Depois ativar o novo ciclo
        await this.prisma.evaluationCycle.update({
          where: { id: cycle.id },
          data: { 
            status: 'OPEN',
            phase: 'ASSESSMENTS' // Sempre inicia na fase de avaliações
          },
        });

        this.logger.log(`✅ Ciclo "${cycle.name}" foi automaticamente ativado`);
      } catch (error) {
        this.logger.error(`❌ Erro ao ativar ciclo "${cycle.name}":`, error);
      }
    }
  }

  /**
   * Verifica transições de fase baseadas em deadlines
   */
  private async checkPhaseTransitions(now: Date) {
    const activeCycles = await this.prisma.evaluationCycle.findMany({
      where: { status: 'OPEN' },
    });

    for (const cycle of activeCycles) {
      try {
                 let newPhase: 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION' | null = null;
        let reason = '';

        // Verificar transição para MANAGER_REVIEWS
        if (
          cycle.phase === 'ASSESSMENTS' &&
          cycle.assessmentDeadline &&
          now > cycle.assessmentDeadline
        ) {
          newPhase = 'MANAGER_REVIEWS';
          reason = `deadline de avaliações (${cycle.assessmentDeadline.toLocaleString('pt-BR')}) expirou`;
        }
        
        // Verificar transição para EQUALIZATION  
        else if (
          cycle.phase === 'MANAGER_REVIEWS' &&
          cycle.managerDeadline &&
          now > cycle.managerDeadline
        ) {
          newPhase = 'EQUALIZATION';
          reason = `deadline de gestores (${cycle.managerDeadline.toLocaleString('pt-BR')}) expirou`;
        }

        if (newPhase) {
          await this.prisma.evaluationCycle.update({
            where: { id: cycle.id },
            data: { phase: newPhase },
          });

          this.logger.log(`✅ Ciclo "${cycle.name}" mudou automaticamente de fase "${cycle.phase}" para "${newPhase}" - ${reason}`);
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao verificar fases do ciclo "${cycle.name}":`, error);
      }
    }
  }

  /**
   * Verifica ciclos que devem ser fechados
   */
  private async checkCyclesToClose(now: Date) {
    const cyclesToClose = await this.prisma.evaluationCycle.findMany({
      where: {
        status: 'OPEN',
        endDate: {
          lte: now, // Data de fim já passou
        },
      },
    });

    for (const cycle of cyclesToClose) {
      try {
        await this.prisma.evaluationCycle.update({
          where: { id: cycle.id },
          data: { status: 'CLOSED' },
        });

        this.logger.log(`✅ Ciclo "${cycle.name}" foi automaticamente fechado - data fim (${cycle.endDate?.toLocaleString('pt-BR')}) passou`);
      } catch (error) {
        this.logger.error(`❌ Erro ao fechar ciclo "${cycle.name}":`, error);
      }
    }
  }

  /**
   * Método para forçar verificação manual (útil para testes)
   */
  async forceCheck() {
    this.logger.log('🔧 Verificação manual de automações solicitada');
    await this.checkCycleAutomations();
  }
} 