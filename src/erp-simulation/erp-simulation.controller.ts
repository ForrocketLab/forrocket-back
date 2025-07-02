// src/erp-simulation/erp-simulation.controller.tsAdd commentMore actions

import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ErpSimulationService } from './erp-simulation.service';

// Usamos '/api' como prefixo, pois a configuração do seu frontend (api.ts) parece usar isso como base.
@Controller('api') 
export class ErpSimulationController {
  constructor(private readonly erpService: ErpSimulationService) {}

  // Rota para o dashboard do gestor
  @Get('evaluations/manager/dashboard')
  getManagerDashboard(@Query('cycle') cycle: string) {
    const managerUserId = '2'; // ID fixo do Bruno para simulação
    return this.erpService.getManagerDashboard(cycle, managerUserId);
  }

  // Rota para buscar a autoavaliação de um liderado
  @Get('evaluations/manager/subordinate/:id/self-assessment')
  getSelfAssessment(@Param('id') subordinateId: string) {
    return this.erpService.getSelfAssessment(subordinateId);
  }

  // Rota para submeter a avaliação do gestor
  @Post('evaluations/manager/subordinate-assessment')
  submitManagerAssessment(@Body() payload: any) {
    const managerId = "2"; // ID do Bruno como avaliador
    return this.erpService.submitManagerAssessment(payload, managerId);
  }
}