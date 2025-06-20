import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  ForbiddenException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CreateManagerAssessmentDto } from './assessments/dto';
import { EvaluationsService } from './evaluations.service';
import { ProjectsService } from '../projects/projects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Avaliações de Gestores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluations/manager')
export class ManagerController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('subordinate-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar avaliação de liderado',
    description: `
      Permite que um gestor avalie um de seus liderados para um ciclo específico.
      
      **Regras de negócio:**
      - Apenas usuários com role de MANAGER em pelo menos um projeto podem usar esta rota
      - O gestor só pode avaliar liderados dos projetos onde ele é gestor
      - Não é possível avaliar a si mesmo
      - Não é possível avaliar um usuário que já foi avaliado pelo gestor no mesmo ciclo
      - O liderado deve existir e estar ativo no sistema
      
      **Critérios de avaliação:**
      - **Comportamento (5 critérios):** Sentimento de Dono, Resiliência, Organização, Capacidade de Aprender, Team Player
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliação de liderado criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cluid123456789' },
        cycle: { type: 'string', example: '2025.1' },
        authorId: { type: 'string', example: 'manager-id' },
        evaluatedUserId: { type: 'string', example: 'subordinate-id' },
        status: { type: 'string', example: 'DRAFT' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        evaluatedUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            jobTitle: { type: 'string' },
            seniority: { type: 'string' },
          },
        },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              criterionId: { type: 'string', example: 'sentimento-de-dono' },
              score: { type: 'number', example: 4 },
              justification: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou avaliação já existe para este liderado/ciclo',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas gestores podem criar avaliações ou você não pode avaliar este usuário',
  })
  @ApiResponse({
    status: 404,
    description: 'Liderado não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createSubordinateAssessment(
    @CurrentUser() user: User,
    @Body() createManagerAssessmentDto: CreateManagerAssessmentDto,
  ) {
    return this.evaluationsService.createManagerAssessment(user.id, createManagerAssessmentDto);
  }

  @Get('subordinates')
  @ApiOperation({
    summary: 'Listar liderados disponíveis para avaliação',
    description: `
      Retorna uma lista de todos os liderados que o gestor logado pode avaliar.
      
      **Regras:**
      - Apenas usuários com role de MANAGER em pelo menos um projeto podem usar esta rota
      - Retorna usuários dos projetos onde o gestor tem role de MANAGER
      - Agrupa os liderados por projeto
      - Exclui o próprio gestor da lista
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de liderados disponíveis para avaliação',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          projectId: { type: 'string', example: 'project-123' },
          projectName: { type: 'string', example: 'Projeto Alpha' },
          subordinates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-456' },
                name: { type: 'string', example: 'João Silva' },
                email: { type: 'string', example: 'joao.silva@rocket.com' },
                jobTitle: { type: 'string', example: 'Desenvolvedor Senior' },
                seniority: { type: 'string', example: 'Senior' },
                role: { type: 'string', example: 'COLLABORATOR' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas gestores podem acessar esta funcionalidade',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getEvaluableSubordinates(@CurrentUser() user: User) {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(user.id);
    if (!isManager) {
      throw new ForbiddenException('Apenas gestores podem acessar esta funcionalidade');
    }

    return this.projectsService.getEvaluableSubordinates(user.id);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Obter dados do painel de acompanhamento do gestor',
    description:
      'Retorna uma lista de projetos e seus respectivos liderados com o status de preenchimento das avaliações para um ciclo específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do dashboard retornados com sucesso.',
    // A resposta seguiria a estrutura do ManagerDashboardDto que definimos anteriormente
  })
  @ApiResponse({ status: 403, description: 'Apenas gestores podem acessar esta funcionalidade' })
  async getDashboard(@CurrentUser() user: User, @Query('cycle') cycle: string) {
    if (!cycle) {
      throw new BadRequestException('O parâmetro "cycle" é obrigatório.');
    }

    // A lógica de negócio principal é delegada ao serviço de avaliações
    return this.evaluationsService.getManagerDashboard(user.id, cycle);
  }
}
