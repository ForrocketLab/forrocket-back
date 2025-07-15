import { Controller, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderService, ProjectDetailsDto, AllProjectsDataDto } from './leader.service'; // Importar novo DTO

@ApiTags('Líder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/leader')
export class LeaderController {
  constructor(private readonly leaderService: LeaderService) {}

  // --- NOVO ENDPOINT ADICIONADO ---
  @Get('projects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar todos os projetos para o seletor',
    description: 'Retorna um objeto com todos os projetos para popular o seletor de projetos do líder.',
  })
  @ApiResponse({
    status: 200,
    description: 'Objeto de projetos retornado com sucesso.',
  })
  async getAllProjectsForSelector(): Promise<AllProjectsDataDto> {
    return this.leaderService.getAllProjectsForSelector();
  }

  // --- ENDPOINT EXISTENTE (permanece igual) ---
  @Get('projects/:projectId/dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar detalhes do dashboard de um projeto',
    description: 'Retorna os detalhes completos de um projeto para a visualização do líder.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID do projeto (ex: projeto-api-core)',
    example: 'projeto-alpha',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do projeto retornados com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async getProjectDashboardDetails(
    @Param('projectId') projectId: string,
  ): Promise<ProjectDetailsDto> {
    return this.leaderService.getProjectDashboardDetails(projectId);
  }
  // Em src/leader/leader.controller.ts

  @Get('projects/:projectId/burndown')
  @ApiOperation({ summary: 'Buscar dados de burndown de um projeto' })
  async getProjectBurndownData(@Param('projectId') projectId: string): Promise<any[]> {
    return this.leaderService.getProjectBurndownData(projectId);
  }

}