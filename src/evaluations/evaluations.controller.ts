import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';

import {
  CreateSelfAssessmentDto,
  UpdateSelfAssessmentDto,
  Create360AssessmentDto,
  CreateMentoringAssessmentDto,
  CreateReferenceFeedbackDto,
  SubmitAssessmentDto,
  SelfAssessmentCompletionByPillarDto,
  OverallCompletionDto,
  PillarProgressDto,
} from './assessments/dto';
import { EvaluationsService } from './evaluations.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerformanceDataDto } from './assessments/dto/performance-data.dto';

@ApiTags('Avaliações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(SelfAssessmentCompletionByPillarDto, OverallCompletionDto, PillarProgressDto)
@Controller('api/evaluations/collaborator')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  // ==========================================
  // ENDPOINTS DE CRIAÇÃO (WRITE)
  // ==========================================

  @Patch(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submeter uma avaliação',
    description: 'Muda o status de uma avaliação de DRAFT para SUBMITTED.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da avaliação a ser submetida',
    example: 'eval-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliação submetida com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Tipo de avaliação inválido ou avaliação já submetida',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação não encontrada ou você não é o autor',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async submitAssessment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() submitDto: SubmitAssessmentDto,
  ) {
    return this.evaluationsService.submitAssessment(id, user.id, submitDto.evaluationType);
  }

  @Post('self-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar autoavaliação',
    description: 'Permite que um colaborador crie sua autoavaliação para um ciclo específico',
  })
  @ApiResponse({
    status: 201,
    description: 'Autoavaliação criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou autoavaliação já existe para este ciclo',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createSelfAssessment(
    @CurrentUser() user: User,
    @Body() createSelfAssessmentDto: CreateSelfAssessmentDto,
  ) {
    return this.evaluationsService.createSelfAssessment(user.id, createSelfAssessmentDto);
  }

  @Patch('self-assessment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar autoavaliação incrementalmente',
    description: 'Permite atualizar campos específicos da autoavaliação de forma incremental. Se não existir autoavaliação, uma nova será criada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autoavaliação atualizada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async updateSelfAssessment(
    @CurrentUser() user: User,
    @Body() updateSelfAssessmentDto: UpdateSelfAssessmentDto,
  ) {
    return this.evaluationsService.updateSelfAssessment(user.id, updateSelfAssessmentDto);
  }

  @Post('360-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar avaliação 360 graus',
    description:
      'Permite que um colaborador avalie um colega de trabalho (mesmo projeto) ou seu gestor direto. Não é possível avaliar mentores ou pessoas fora do escopo de trabalho.',
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliação 360 criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou avaliação já existe para este usuário/ciclo',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário avaliado não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Você só pode avaliar colegas de trabalho (mesmo projeto) ou seu gestor direto',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async create360Assessment(
    @CurrentUser() user: User,
    @Body() create360AssessmentDto: Create360AssessmentDto,
  ) {
    return this.evaluationsService.create360Assessment(user.id, create360AssessmentDto);
  }

  @Post('mentoring-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar avaliação de mentoring',
    description:
      'Permite que um colaborador avalie APENAS seu mentor designado. Não é possível avaliar mentores de outras pessoas.',
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliação de mentoring criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou avaliação já existe para este mentor/ciclo',
  })
  @ApiResponse({
    status: 404,
    description: 'Mentor não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Você só pode avaliar seu mentor designado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createMentoringAssessment(
    @CurrentUser() user: User,
    @Body() createMentoringAssessmentDto: CreateMentoringAssessmentDto,
  ) {
    return this.evaluationsService.createMentoringAssessment(user.id, createMentoringAssessmentDto);
  }

  @Post('reference-feedback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar feedback de referência',
    description: 'Permite que um colaborador dê feedback sobre um colega',
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback de referência criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou feedback já existe para este usuário/ciclo',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário referenciado não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createReferenceFeedback(
    @CurrentUser() user: User,
    @Body() createReferenceFeedbackDto: CreateReferenceFeedbackDto,
  ) {
    return this.evaluationsService.createReferenceFeedback(user.id, createReferenceFeedbackDto);
  }

  // ==========================================
  // ENDPOINTS DE LEITURA (READ)
  // ==========================================

  @Get('cycle/:cycleId')
  @ApiOperation({
    summary: 'Buscar avaliações por ciclo',
    description: 'Retorna todas as avaliações do usuário logado para um ciclo específico',
  })
  @ApiParam({
    name: 'cycleId',
    description: 'ID do ciclo de avaliação',
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliações encontradas com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: { type: 'string', example: '2025.1' },
        selfAssessment: {
          type: 'object',
          nullable: true,
          description: 'Autoavaliação do usuário (null se não existir)',
          properties: {
            // Campos de IBaseEvaluation e ISelfAssessment que você já tinha ou do Prisma
            id: { type: 'string', example: 'eval-123' },
            cycle: { type: 'string', example: '2025.1' },
            authorId: { type: 'string', example: 'user-456' },
            status: { type: 'string', example: 'DRAFT', enum: ['DRAFT', 'SUBMITTED'] }, // Adicione o enum aqui
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            submittedAt: { type: 'string', format: 'date-time', nullable: true },
            answers: {
              type: 'array',
              description: 'Lista de respostas para cada critério',
              items: {
                type: 'object', // Você pode criar um DTO mais detalhado para ISelfAssessmentAnswer também
                properties: {
                  criterionId: { type: 'string' },
                  score: { type: 'number' },
                  justification: { type: 'string' },
                },
              },
            },
            // NOVOS CAMPOS: Referência aos DTOs recém-criados
            completionStatus: {
              // Progresso por pilar
              type: 'object',
              $ref: '#/components/schemas/SelfAssessmentCompletionByPillarDto', // Referência ao DTO
            },
            overallCompletion: {
              // Progresso geral
              type: 'object',
              $ref: '#/components/schemas/OverallCompletionDto', // Referência ao DTO
            },
          },
        },
        assessments360: {
          type: 'array',
          description: 'Lista de avaliações 360 feitas pelo usuário',
          // ... (manter o schema existente para assessments360, mentoringAssessments, referenceFeedbacks)
        },
        mentoringAssessments: {
          type: 'array',
          description: 'Lista de avaliações de mentoring feitas pelo usuário',
        },
        referenceFeedbacks: {
          type: 'array',
          description: 'Lista de feedbacks de referência dados pelo usuário',
        },
        managerAssessments: {
          type: 'array',
          description: 'Lista de avaliações de gestor feitas pelo usuário',
        },
        summary: {
          type: 'object',
          properties: {
            selfAssessmentCompleted: { type: 'boolean' },
            selfAssessmentOverallProgress: {
              // No summary, também referencia o DTO
              type: 'object',
              $ref: '#/components/schemas/OverallCompletionDto',
            },
            assessments360Count: { type: 'number' },
            mentoringAssessmentsCount: { type: 'number' },
            referenceFeedbacksCount: { type: 'number' },
            managerAssessmentsCount: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getUserEvaluationsByCycle(@CurrentUser() user: User, @Param('cycleId') cycleId: string) {
    return this.evaluationsService.getUserEvaluationsByCycle(user.id, cycleId);
  }

  @Get('received/cycle/:cycleId')
  @ApiOperation({
    summary: 'Buscar avaliações RECEBIDAS por ciclo',
    description:
      'Retorna todas as avaliações que o usuário logado RECEBEU para um ciclo específico (360, mentoring, referência)',
  })
  @ApiParam({
    name: 'cycleId',
    description: 'ID do ciclo de avaliação',
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliações recebidas encontradas com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: { type: 'string', example: '2025.1' },
        assessments360Received: {
          type: 'array',
          description: 'Lista de avaliações 360 recebidas pelo usuário',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'eval-123' },
              cycle: { type: 'string', example: '2025.1' },
              overallScore: { type: 'number', example: 4 },
              strengths: { type: 'string', example: 'Excelente comunicação e liderança técnica' },
              improvements: { type: 'string', example: 'Poderia ser mais proativo em reuniões' },
              status: { type: 'string', example: 'SUBMITTED' },
              createdAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time', nullable: true },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-456' },
                  name: { type: 'string', example: 'Ana Oliveira' },
                  email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
                  jobTitle: { type: 'string', example: 'Desenvolvedora Frontend' },
                  seniority: { type: 'string', example: 'Pleno' },
                },
              },
            },
          },
        },
        mentoringAssessmentsReceived: {
          type: 'array',
          description: 'Lista de avaliações de mentoring recebidas (se for mentor de alguém)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'mentor-123' },
              cycle: { type: 'string', example: '2025.1' },
              score: { type: 'number', example: 5 },
              justification: {
                type: 'string',
                example: 'Excelente mentor, sempre disponível para ajudar',
              },
              status: { type: 'string', example: 'SUBMITTED' },
              createdAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time', nullable: true },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-789' },
                  name: { type: 'string', example: 'Felipe Silva' },
                  email: { type: 'string', example: 'felipe.silva@rocketcorp.com' },
                  jobTitle: { type: 'string', example: 'Desenvolvedor Backend' },
                  seniority: { type: 'string', example: 'Júnior' },
                },
              },
            },
          },
        },
        referenceFeedbacksReceived: {
          type: 'array',
          description: 'Lista de feedbacks de referência recebidos',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ref-123' },
              cycle: { type: 'string', example: '2025.1' },
              justification: {
                type: 'string',
                example: 'Profissional exemplar, recomendo fortemente',
              },
              status: { type: 'string', example: 'SUBMITTED' },
              createdAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time', nullable: true },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-101' },
                  name: { type: 'string', example: 'Diana Costa' },
                  email: { type: 'string', example: 'diana.costa@rocketcorp.com' },
                  jobTitle: { type: 'string', example: 'People & Culture Manager' },
                  seniority: { type: 'string', example: 'Sênior' },
                },
              },
            },
          },
        },
        managerAssessmentsReceived: {
          type: 'array',
          description:
            'Lista de avaliações de gestor recebidas (avaliações feitas pelo seu gestor)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'mgr-123' },
              cycle: { type: 'string', example: '2025.1' },
              status: { type: 'string', example: 'SUBMITTED' },
              createdAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time', nullable: true },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'mgr-456' },
                  name: { type: 'string', example: 'Roberto Santos' },
                  email: { type: 'string', example: 'roberto.santos@rocketcorp.com' },
                  jobTitle: { type: 'string', example: 'Tech Lead' },
                  seniority: { type: 'string', example: 'Sênior' },
                },
              },
              answers: {
                type: 'array',
                description: 'Respostas da avaliação de gestor',
              },
            },
          },
        },
        committeeAssessmentsReceived: {
          type: 'array',
          description: 'Lista de avaliações de comitê recebidas (equalização feita pelo comitê)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'cmt-123' },
              cycle: { type: 'string', example: '2025.1' },
              finalScore: { type: 'number', example: 4 },
              justification: { type: 'string', example: 'Justificativa da equalização...' },
              observations: {
                type: 'string',
                example: 'Observações adicionais...',
                nullable: true,
              },
              status: { type: 'string', example: 'SUBMITTED' },
              createdAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time', nullable: true },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmt-456' },
                  name: { type: 'string', example: 'Carla Oliveira' },
                  email: { type: 'string', example: 'carla.oliveira@rocketcorp.com' },
                  jobTitle: { type: 'string', example: 'Head of People' },
                  seniority: { type: 'string', example: 'Sênior' },
                },
              },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            assessments360ReceivedCount: { type: 'number', example: 2 },
            mentoringAssessmentsReceivedCount: { type: 'number', example: 1 },
            referenceFeedbacksReceivedCount: { type: 'number', example: 3 },
            managerAssessmentsReceivedCount: { type: 'number', example: 1 },
            committeeAssessmentsReceivedCount: { type: 'number', example: 1 },
            totalReceivedCount: { type: 'number', example: 8 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getReceivedEvaluationsByCycle(
    @CurrentUser() user: User,
    @Param('cycleId') cycleId: string,
  ) {
    return this.evaluationsService.getReceivedEvaluationsByCycle(user.id, cycleId);
  }

  @Get('performance/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Buscar histórico de performance do usuário logado',
    description:
      'Retorna uma lista consolidada das notas do usuário (autoavaliação, gestor e comitê) agrupadas por ciclo de avaliação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de performance retornado com sucesso.',
    type: [PerformanceDataDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente.',
  })
  async getPerformanceHistory(@CurrentUser() user: User) {
    return this.evaluationsService.getPerformanceHistory(user.id);
  }
}
