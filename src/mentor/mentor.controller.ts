import { Controller, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { User } from '@prisma/client';

import {
  MentorDashboardResponseDto,
  Collaborator360AssessmentDto,
  CollaboratorPerformanceDto,
  CollaboratorCycleMeanDto,
} from './dto';
import { MentorService } from './mentor.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Avaliações de Mentoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Obter dashboard do mentor',
    description: `
      Retorna dados completos do dashboard do mentor para um ciclo específico.
      
      **Funcionalidades:**
      - Resumo estatístico (média de avaliações recebidas, avaliações pendentes, etc.)
      - Lista de colaboradores mentorados com status das avaliações
      - Médias de autoavaliação e avaliações de gestor de cada colaborador
      - Percentual de conclusão das avaliações
    `,
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação (ex: "2025.1")',
    required: true,
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard do mentor retornado com sucesso',
    type: MentorDashboardResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é mentor de nenhum colaborador',
  })
  async getMentorDashboard(
    @CurrentUser() user: User,
    @Query('cycle') cycle: string,
  ): Promise<MentorDashboardResponseDto> {
    if (!cycle) {
      throw new Error('Ciclo é obrigatório');
    }

    return this.mentorService.getMentorDashboard(user.id, cycle);
  }

  @Get('mentored-collaborators')
  @ApiOperation({
    summary: 'Listar colaboradores mentorados',
    description:
      'Retorna lista de todos os colaboradores que estão sob mentoria do usuário logado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de colaboradores mentorados',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          jobTitle: { type: 'string' },
          seniority: { type: 'string' },
        },
      },
    },
  })
  async getMentoredCollaborators(@CurrentUser() user: User) {
    return this.mentorService.getMentoredCollaborators(user.id);
  }

  @Get('collaborator/:collaboratorId/360-assessments')
  @ApiOperation({
    summary: 'Obter avaliações 360 de um colaborador',
    description: `
      Retorna todas as avaliações 360 recebidas por um colaborador em um ciclo específico.
      
      **Funcionalidades:**
      - Busca todas as avaliações de gestor/mentor recebidas pelo colaborador
      - Descriptografa justificativas para visualização
      - Inclui informações dos autores das avaliações
      - Mapeia critérios com seus respectivos pilares (BEHAVIOR, EXECUTION, MANAGEMENT)
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliações 360 encontradas com sucesso',
    type: [Collaborator360AssessmentDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaborator360Assessments(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    return this.mentorService.getCollaborator360Assessments(collaboratorId, cycle);
  }

  @Get('collaborator/:collaboratorId/performance-metrics')
  @ApiOperation({
    summary: 'Obter métricas de performance de um colaborador',
    description: `
      Retorna métricas detalhadas de performance para um colaborador em um ciclo específico.
      
      **Funcionalidades:**
      - Score geral do comitê (overall score)
      - Crescimento de performance vs. ciclo anterior (% positivo ou negativo)
      - Total de avaliações completadas (autoavaliação + 360s recebidos)
      - Detalhamento por tipo de avaliação
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de performance calculadas com sucesso',
    type: CollaboratorPerformanceDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaboratorPerformanceMetrics(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    return this.mentorService.getCollaboratorPerformanceMetrics(collaboratorId, cycle);
  }

  @Get('collaborator/:collaboratorId/cycle-means')
  @ApiOperation({
    summary: 'Obter médias por ciclo de um colaborador',
    description: `
      Retorna médias de performance por ciclo para um colaborador.
      
      **Funcionalidades:**
      - Média da autoavaliação por ciclo
      - Média dos critérios EXECUTION dados por mentores/gestores
      - Média dos critérios BEHAVIOR dados por mentores/gestores
      - Média geral de todas as avaliações 360 recebidas
      - Histórico ordenado por ciclo (mais recentes primeiro)
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Médias por ciclo calculadas com sucesso',
    type: [CollaboratorCycleMeanDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaboratorCyclePerformances(@Param('collaboratorId') collaboratorId: string) {
    return this.mentorService.getCollaboratorCyclePerformances(collaboratorId);
  }

  @Get('collaborator/:collaboratorId/complete-performance')
  @ApiOperation({
    summary: 'Obter performance completa de um colaborador',
    description: `
      Retorna dados completos de performance para um colaborador em um ciclo específico.
      
      **Funcionalidades:**
      - Todas as avaliações 360 recebidas no ciclo
      - Métricas de performance (score comitê, crescimento, total avaliações)
      - Histórico de médias por ciclo
      - Dados consolidados em uma única consulta
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance completa obtida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaboratorCompletePerformance(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    return this.mentorService.getCollaboratorCompletePerformance(collaboratorId, cycle);
  }

  @Get('collaborator/:collaboratorId/assessments')
  @ApiOperation({
    summary: 'Obter todas as avaliações de um colaborador',
    description: `
      Retorna todas as avaliações recebidas/feitas por um colaborador em um ciclo específico.
      
      **Tipos de avaliações incluídas:**
      - **Self Assessment:** Autoavaliação feita pelo próprio colaborador
      - **Manager Assessments:** Avaliações feitas por gestores ao colaborador
      - **Feedback 360:** Avaliações feitas por outros colaboradores
      
      **Dados retornados:**
      - Informações dos autores das avaliações
      - Respostas descriptografadas
      - Status e datas de submissão
      - Critérios avaliados (para Manager Assessments)
      - Pontos fortes e melhorias (para Feedback 360)
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação (ex: "2025.1")',
    required: true,
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas as avaliações do colaborador retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        selfAssessment: {
          type: 'object',
          description: 'Autoavaliação do colaborador',
          nullable: true,
        },
        managerAssessments: {
          type: 'array',
          description: 'Avaliações de gestores recebidas pelo colaborador',
          items: { type: 'object' },
        },
        feedback360: {
          type: 'array',
          description: 'Feedbacks 360 recebidos pelo colaborador',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaboratorAllAssessments(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    if (!cycle) {
      throw new Error('Ciclo é obrigatório');
    }

    return this.mentorService.getCollaboratorAllAssessments(collaboratorId, cycle);
  }

  @Get('collaborator/:collaboratorId/self-assessment')
  @ApiOperation({
    summary: 'Obter autoavaliação de um colaborador',
    description: 'Retorna a autoavaliação feita pelo colaborador em um ciclo específico.',
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação (ex: "2025.1")',
    required: true,
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Autoavaliação retornada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Autoavaliação não encontrada',
  })
  async getCollaboratorSelfAssessment(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    if (!cycle) {
      throw new Error('Ciclo é obrigatório');
    }

    return this.mentorService.getCollaboratorSelfAssessment(collaboratorId, cycle);
  }

  @Get('collaborator/:collaboratorId/manager-assessments')
  @ApiOperation({
    summary: 'Obter avaliações de gestores de um colaborador',
    description:
      'Retorna todas as avaliações feitas por gestores ao colaborador em um ciclo específico.',
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação (ex: "2025.1")',
    required: true,
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliações de gestores retornadas com sucesso',
  })
  async getCollaboratorManagerAssessments(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    if (!cycle) {
      throw new Error('Ciclo é obrigatório');
    }

    return this.mentorService.getCollaboratorManagerAssessments(collaboratorId, cycle);
  }

  @Get('collaborator/:collaboratorId/feedback-360')
  @ApiOperation({
    summary: 'Obter feedbacks 360 de um colaborador',
    description:
      'Retorna todos os feedbacks 360 recebidos pelo colaborador em um ciclo específico.',
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'cluid123456789',
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação (ex: "2025.1")',
    required: true,
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedbacks 360 retornados com sucesso',
  })
  async getCollaboratorFeedback360(
    @Param('collaboratorId') collaboratorId: string,
    @Query('cycle') cycle: string,
  ) {
    if (!cycle) {
      throw new Error('Ciclo é obrigatório');
    }

    return this.mentorService.getCollaboratorFeedback360(collaboratorId, cycle);
  }
}
