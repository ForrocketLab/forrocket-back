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
  NotFoundException, 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'; 

import { CreateManagerAssessmentDto } from './assessments/dto';
import { EvaluationsService } from './evaluations.service';
import { ProjectsService } from '../projects/projects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManagerDashboardResponseDto } from './manager/manager-dashboard.dto';
import { SelfAssessmentResponseDto } from './assessments/dto/self-assessment-response.dto'; 

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
      throw new ForbiddenException('Apenas gestores podem visualizar autoavaliações de subordinados.');
    }

    // 2. Chamar o serviço para buscar e validar a autoavaliação
    // A validação de relacionamento gestor-subordinado e ciclo ativo será feita no service.
    return this.evaluationsService.getSubordinateSelfAssessment(
      user.id,
      subordinateId,
    );
  }
}