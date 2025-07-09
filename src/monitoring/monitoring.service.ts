import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditLog } from '@prisma/client';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private prisma: PrismaService) {}

  async getTotalLogsCount(): Promise<number> {
    return this.prisma.auditLog.count();
  }

  async getDailyLogsCount(date?: Date): Promise<number> {
    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    return this.prisma.auditLog.count({
      where: {
        timestamp: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });
  }

  async getActiveUsersCount(timeframeMinutes: number = 5): Promise<number> {
    const threshold = new Date(Date.now() - timeframeMinutes * 60 * 1000);
    return this.prisma.user.count({
      where: {
        isActive: true,
        lastActivityAt: {
          gte: threshold,
        },
      },
    });
  }

  async getTotalApiCallCount(): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        eventType: "API_CALL",
      },
    });
  }

  async getHourlyApiCalls(timeframeHours: number = 24): Promise<any[]> {
    const now = new Date();
    const past = new Date(now.getTime() - timeframeHours * 60 * 60 * 1000);

    const apiCalls = await this.prisma.auditLog.findMany({
      where: {
        eventType: "API_CALL",
        timestamp: {
          gte: past,
          lte: now,
        },
      },
      select: {
        timestamp: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    const hourlyCounts: { [key: string]: number } = {};
    apiCalls.forEach(call => {
      const hour = call.timestamp.toISOString().substring(0, 13); 
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    return Object.keys(hourlyCounts).map(hour => ({ hour, count: hourlyCounts[hour] }));
  }

  async getTopApiEndpoints(limit: number = 5, timeframeMinutes: number = 60): Promise<any[]> {
    const threshold = new Date(Date.now() - timeframeMinutes * 60 * 1000);

    const apiLogs = await this.prisma.auditLog.findMany({
      where: {
        eventType: "API_CALL",
        timestamp: {
          gte: threshold,
        },
      },
      select: {
        details: true,
      },
    });

    const endpointCounts: { [endpoint: string]: number } = {};

    apiLogs.forEach(log => {
      const details = log.details as { endpoint?: string };
      if (details && typeof details === 'object' && details.endpoint) {
        endpointCounts[details.endpoint] = (endpointCounts[details.endpoint] || 0) + 1;
      }
    });

    const sortedEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sortedEndpoints;
  }

  /**
   * Obtém entradas de log recentes com filtros, paginação e opção de exclusão de logs de um userId específico.
   */
  async getRecentLogEntries(
    search?: string,
    limit: number = 10,
    offset: number = 0,
    displayTimeframeMinutes: number = 30, // Padrão: mostrar logs dos últimos 15 minutos
    userIdToExclude?: string, // ID do usuário cujos logs devem ser excluídos
  ): Promise<AuditLog[]> {
    const whereClause: any = {};
    
    // Filtro de tempo
    const fifteenMinutesAgo = new Date(Date.now() - displayTimeframeMinutes * 60 * 1000);
    whereClause.timestamp = { gte: fifteenMinutesAgo };

    // Adiciona a condição para excluir logs de um usuário específico
    if (userIdToExclude) {
      whereClause.NOT = {
        userId: userIdToExclude,
      };
    }

    // Adiciona a condição de busca (se houver)
    if (search) {
      const searchConditions = [
        { eventType: { contains: search } },
        { originIp: { contains: search } },
        { user: { name: { contains: search } } },
        { details: { path: ['endpoint'], string_contains: search } }, 
      ];
      whereClause.AND = whereClause.AND ? [...whereClause.AND, { OR: searchConditions }] : [{ OR: searchConditions }];
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return auditLogs.map(log => ({
      ...log,
      userName: log.user?.name || null,
      userId: log.userId || null,
      user: undefined
    })) as AuditLog[];
  }
}