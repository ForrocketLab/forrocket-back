import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { MonitoringService } from './monitoring.service';

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
  async getActiveUsers(@Query('timeframeMinutes') timeframeMinutes: number = 5) {
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
  async getHourlyApiCalls(@Query('timeframeHours') timeframeHours: number = 24) {
    return { hourlyApiCalls: await this.monitoringService.getHourlyApiCalls(timeframeHours) };
  }

  @Get('top-api-endpoints')
  @ApiOperation({ summary: 'Obter os endpoints de API mais chamados' })
  @ApiResponse({ status: 200, description: 'Lista dos principais endpoints de API retornada com sucesso.' })
  async getTopApiEndpoints(@Query('limit') limit: number = 5) {
    return { topEndpoints: await this.monitoringService.getTopApiEndpoints(limit) };
  }
}