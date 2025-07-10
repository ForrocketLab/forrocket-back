import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LogPurgeService {
  private readonly logger = new Logger(LogPurgeService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE) 
  async handleCron() {
    this.logger.log('Iniciando tarefa de limpeza de logs antigos...');

    // Define a janela de retenção para 30 minutos
    const retentionMinutes = 30; 
    const thresholdDate = new Date(Date.now() - retentionMinutes * 60 * 1000);

    try {
      const { count } = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: thresholdDate, // Deleta logs anteriores à data limite (30 minutos atrás)
          },
        },
      });
      this.logger.log(`Limpeza concluída: ${count} logs antigos deletados.`);
    } catch (error) {
      this.logger.error('Erro ao deletar logs antigos:', error.message, error.stack);
    }
  }
}