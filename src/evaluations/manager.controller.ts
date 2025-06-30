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
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenAiService } from '../gen-ai/gen-ai.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateManagerAssessmentDto } from './assessments/dto';
import { PerformanceDataDto } from './assessments/dto/performance-data.dto';
import { PerformanceHistoryDto } from './assessments/dto/performance-history-dto';
import { SelfAssessmentResponseDto } from './assessments/dto/self-assessment-response.dto';
import { EvaluationsService } from './evaluations.service';
import { BrutalFactsMetricsDto } from './manager/dto/brutal-facts-metrics.dto';
import { Received360AssessmentDto } from './manager/dto/received-assessment360.dto';
import { TeamEvaluationSummaryResponseDto } from './manager/dto/team-evaluation-summary.dto';
import { TeamScoreAnalysisResponseDto } from './manager/dto/team-score-analysis.dto';
import { ManagerDashboardResponseDto } from './manager/manager-dashboard.dto';

@ApiTags('Avaliações de Gestores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluations/manager')
export class ManagerController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly projectsService: ProjectsService,
    private readonly genAiService: GenAiService,
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

  // NOVO ENDPOINT: Visualizar autoavaliação de subordinado
  @Get('subordinate/:subordinateId/self-assessment')
  @ApiOperation({
    summary: 'Visualizar autoavaliação detalhada de um subordinado',
    description: `
      Permite que um gestor visualize a autoavaliação completa e detalhada de um de seus subordinados
      para o ciclo de avaliação ativo. Inclui as notas por critério e justificativas.
      
      **Regras de Negócio:**
      - Apenas usuários com role de MANAGER podem acessar.
      - O gestor logado DEVE ser o gestor direto do subordinado.
      - A autoavaliação do subordinado deve estar disponível (status SUBMITTED).
      - Deve haver um ciclo de avaliação ativo e na fase MANAGER_REVIEWS ou EQUALIZATION.
    `,
  })
  @ApiParam({
    name: 'subordinateId',
    description: 'ID do subordinado cuja autoavaliação será visualizada',
    example: 'cluid123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autoavaliação do subordinado retornada com sucesso',
    type: SelfAssessmentResponseDto, // Usando a classe DTO aqui
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Não há ciclo ativo ou não está na fase correta.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado: Você não é gestor deste subordinado ou não tem permissão.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subordinado não encontrado ou autoavaliação não encontrada.',
  })
  async getSubordinateSelfAssessment(
    @CurrentUser() user: User,
    @Param('subordinateId') subordinateId: string,
  ) {
    // 1. Verificar se o usuário logado é gestor
    const isManager = await this.projectsService.isManager(user.id);
    if (!isManager) {
      throw new ForbiddenException(
        'Apenas gestores podem visualizar autoavaliações de subordinados.',
      );
    }

    // 2. Chamar o serviço para buscar e validar a autoavaliação
    // A validação de relacionamento gestor-subordinado e ciclo ativo será feita no service.
    return this.evaluationsService.getSubordinateSelfAssessment(user.id, subordinateId);
  }

  // Visualiza avaliações 360 recebidas por um subordinado
  @Get('subordinate/:subordinateId/360-assessments')
  @ApiOperation({
    summary: 'Visualizar avaliações 360 recebidas por um subordinado',
    description: `Permite que um gestor visualize as avaliações 360 que um de seus liderados recebeu de outros colaboradores no ciclo especificado.`,
  })
  @ApiParam({
    name: 'subordinateId',
    description: 'ID do subordinado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de avaliações 360 recebidas retornada com sucesso.',
    type: [Received360AssessmentDto],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Acesso negado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subordinado não encontrado.' })
  async getSubordinateReceived360s(
    @CurrentUser() user: User,
    @Param('subordinateId') subordinateId: string,
    @Query('cycle') cycle: string,
  ) {
    if (!cycle) {
      throw new BadRequestException('O parâmetro "cycle" é obrigatório.');
    }

    return this.evaluationsService.getSubordinateReceived360s(user.id, subordinateId, cycle);
  }

  @Get('performance/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Buscar histórico de performance do colaborador',
    description:
      'Retorna uma lista consolidada das notas do usuário (autoavaliação, gestor e comitê) agrupadas por ciclo de avaliação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de performance retornado com sucesso.',
    type: [PerformanceHistoryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente.',
  })
  async getCollaboratorPerformanceHistory(
    @CurrentUser() user: User,
    @Param('subordinateId') subordinateId: string,
  ) {
    const isManager = await this.projectsService.isManager(user.id);
    if (!isManager) {
      throw new ForbiddenException(
        'Apenas gestores podem visualizar autoavaliações de subordinados.',
      );
    }
    return this.evaluationsService.getPerformanceHistory(subordinateId);
  }

  @Get('team-evaluation-summary')
  @ApiOperation({
    summary: 'Obter resumo inteligente da equipe',
    description: `
      Gera uma análise estratégica da equipe usando IA baseada em todas as avaliações.
      
      **Funcionalidades:**
      - Coleta médias de todos os colaboradores da equipe
      - Analisa avaliações 360 e de gestor
      - Gera insights estratégicos sobre performance da equipe
      - Identifica padrões e tendências comportamentais
      - Fornece recomendações para liderança
      
      **Regras de negócio:**
      - Apenas gestores podem acessar esta funcionalidade
      - Considera apenas avaliações submetidas (status SUBMITTED)
      - Prioriza notas do comitê quando disponíveis
    `,
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação para análise (ex: "2025.1")',
    example: '2025.1',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo da equipe gerado com sucesso.',
    type: TeamEvaluationSummaryResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para acessar dados da equipe.',
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum colaborador encontrado para este gestor.',
  })
  async getTeamEvaluationSummary(
    @CurrentUser() user: User,
    @Query('cycle') cycle: string,
  ): Promise<TeamEvaluationSummaryResponseDto> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(user.id);
    if (!isManager) {
      throw new ForbiddenException('Apenas gestores podem acessar análises de equipe.');
    }

    if (!cycle) {
      throw new BadRequestException('O parâmetro cycle é obrigatório.');
    }

    // Coletar dados estruturados da equipe
    const teamData = await this.evaluationsService.getTeamEvaluationData(user.id, cycle);

    // Gerar resumo usando IA
    const teamSummary = await this.genAiService.getTeamEvaluationSummary(teamData);

    return {
      cycle: teamData.cycle,
      teamSummary,
      teamStats: {
        totalCollaborators: teamData.totalCollaborators,
        teamAverageScore: teamData.teamAverageScore,
        highPerformers: teamData.highPerformers,
        lowPerformers: teamData.lowPerformers,
      },
    };
  }

  @Get('team-score-analysis')
  @ApiOperation({
    summary: 'Obter análise quantitativa da equipe por pilar',
    description: `
      Gera uma análise estratégica baseada nas notas finais dos colaboradores por pilar e nota do comitê.
      
      **Funcionalidades:**
      - Coleta notas finais de todos os colaboradores (prioriza comitê)
      - Calcula médias por pilar (Comportamento, Execução)
      - Gera insights estratégicos sobre distribuição de notas
      - Identifica colaboradores de alto desempenho e zona crítica
      - Fornece resumo quantitativo conciso
      
      **Regras de negócio:**
      - Apenas gestores podem acessar esta funcionalidade
      - Considera apenas avaliações submetidas (status SUBMITTED)
      - Prioriza notas do comitê quando disponíveis
      - Excluindo pilar Management conforme solicitado
    `,
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação para análise (ex: "2025.1")',
    example: '2025.1',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Análise de notas da equipe gerada com sucesso.',
    type: TeamScoreAnalysisResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para acessar dados da equipe.',
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum colaborador encontrado para este gestor.',
  })
  async getTeamScoreAnalysis(
    @CurrentUser() user: User,
    @Query('cycle') cycle: string,
  ): Promise<TeamScoreAnalysisResponseDto> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(user.id);
    if (!isManager) {
      throw new ForbiddenException('Apenas gestores podem acessar análises de equipe.');
    }

    if (!cycle) {
      throw new BadRequestException('O parâmetro cycle é obrigatório.');
    }

    // Coletar dados de notas por pilar da equipe
    const teamScoreData = await this.evaluationsService.getTeamScoreAnalysisData(user.id, cycle);

    // Gerar análise usando IA
    const scoreAnalysis = await this.genAiService.getTeamScoreAnalysis(teamScoreData);

    return {
      cycle: teamScoreData.cycle,
      scoreAnalysis,
      teamStats: {
        totalCollaborators: teamScoreData.totalCollaborators,
        teamAverageScore: teamScoreData.teamAverageScore,
        behaviorAverage: teamScoreData.behaviorAverage,
        executionAverage: teamScoreData.executionAverage,
        highPerformers: teamScoreData.highPerformers,
        criticalPerformers: teamScoreData.criticalPerformers,
      },
    };
  }

  @Get('brutal-facts-metrics')
  @ApiOperation({
    summary: 'Obter métricas de brutal facts da equipe',
    description: `
      Fornece métricas objetivas e quantitativas sobre a performance da equipe, conhecidas como "brutal facts".
      
      **Funcionalidades:**
      - Nota média geral do time (overallScore das avaliações 360)
      - Melhoria de desempenho em relação ao ciclo anterior
      - Número de colaboradores avaliados pelo gestor
      - Desempenho do time por diferentes tipos de avaliação
      - Métricas detalhadas de cada colaborador (autoavaliação, 360, gestor, final)
      
      **Regras de negócio:**
      - Apenas gestores podem acessar esta funcionalidade
      - Considera apenas avaliações submetidas (status SUBMITTED)
      - Compara automaticamente com o ciclo anterior para calcular melhoria
      - Inclui breakdown por colaborador para análise detalhada
    `,
  })
  @ApiQuery({
    name: 'cycle',
    description: 'Ciclo de avaliação para análise (ex: "2025.1")',
    example: '2025.1',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de brutal facts geradas com sucesso.',
    type: BrutalFactsMetricsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para acessar métricas da equipe.',
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum colaborador encontrado para este gestor.',
  })
  async getBrutalFactsMetrics(
    @CurrentUser() user: User,
    @Query('cycle') cycle: string,
  ): Promise<BrutalFactsMetricsDto> {
    if (!cycle) {
      throw new BadRequestException('O parâmetro cycle é obrigatório.');
    }

    return await this.evaluationsService.getBrutalFactsMetrics(user.id, cycle);
  }
}
