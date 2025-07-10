import { Controller, Get, Query, UseGuards, DefaultValuePipe, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { MonitoringService } from './monitoring.service';
import { AuditLog } from '@prisma/client';
import { User as RequestUser } from '@prisma/client';

@ApiTags('Monitoramento em Tempo Real')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HRRoleGuard)
@Controller('api/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('total-logs')
  @ApiOperation({ summary: 'Obter o número total de eventos/logs no sistema' })
  @ApiResponse({ status: 200, description: 'Total de logs retornado com sucesso.' })
  async getTotalLogs() {
    return { totalLogs: await this.monitoringService.getTotalLogsCount() };
  }

  @Get('daily-logs')
  @ApiOperation({ summary: 'Obter o número de eventos/logs registrados hoje' })
  @ApiResponse({ status: 200, description: 'Total de logs diários retornado com sucesso.' })
  async getDailyLogs() {
    return { dailyLogs: await this.monitoringService.getDailyLogsCount() };
  }

  @Get('active-users')
  @ApiOperation({ summary: 'Obter o número de usuários ativos em um período (em minutos)' })
  @ApiResponse({ status: 200, description: 'Total de usuários ativos retornado com sucesso.' })
  async getActiveUsers(@Query('timeframeMinutes', new DefaultValuePipe(5), ParseIntPipe) timeframeMinutes: number) {
    return { activeUsers: await this.monitoringService.getActiveUsersCount(timeframeMinutes) };
  }

  @Get('total-api-calls')
  @ApiOperation({ summary: 'Obter o número total de chamadas de API registradas' })
  @ApiResponse({ status: 200, description: 'Total de chamadas de API retornado com sucesso.' })
  async getTotalApiCalls() {
    return { totalApiCalls: await this.monitoringService.getTotalApiCallCount() };
  }

  @Get('hourly-api-calls')
  @ApiOperation({ summary: 'Obter o número de chamadas de API por hora nas últimas 24h' })
  @ApiResponse({ status: 200, description: 'Chamadas de API por hora retornadas com sucesso.' })
  async getHourlyApiCalls(@Query('timeframeHours', new DefaultValuePipe(24), ParseIntPipe) timeframeHours: number) {
    return { hourlyApiCalls: await this.monitoringService.getHourlyApiCalls(timeframeHours) };
  }

  @Get('top-api-endpoints')
  @ApiOperation({ summary: 'Obter os endpoints de API mais chamados' })
  @ApiResponse({ status: 200, description: 'Lista dos principais endpoints de API retornada com sucesso.' })
  async getTopApiEndpoints(@Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number) {
    return { topEndpoints: await this.monitoringService.getTopApiEndpoints(limit) };
  }

  /**
   * Obtém entradas de log recentes com filtros e paginação.
   * Filtra ADMINS: Opcionalmente exclui logs gerados por usuários admin.
   */
  @Get('recent-logs')
  @ApiOperation({ summary: 'Obter entradas de log de auditoria recentes com filtros e paginação.' })
  @ApiResponse({ status: 200, description: 'Lista de entradas de log retornada com sucesso.' })
  async getRecentLogEntries(
    @Req() req,
    @Query('search') search?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
    @Query('excludeAdminLogs', new DefaultValuePipe('true')) excludeAdminLogsString: string = 'true', 
  ): Promise<AuditLog[]> {
    const currentUser = req.user as RequestUser;
    const excludeAdminLogs = excludeAdminLogsString === 'true';

    const filterOutAdminSelfLogs = currentUser.roles.includes('admin') && excludeAdminLogs;
    const userIdToExclude = filterOutAdminSelfLogs ? currentUser.id : undefined;

    return this.monitoringService.getRecentLogEntries(
      search,
      limit,
      offset,
      undefined,
      userIdToExclude
    );
  }
}