import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { CommitteeService } from './committee.service';
import {
  CreateCommitteeAssessmentDto,
  UpdateCommitteeAssessmentDto,
  SubmitCommitteeAssessmentDto,
} from './dto/committee-assessment.dto';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Avaliações de Comitê')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluations/committee')
export class CommitteeController {
  constructor(private readonly committeeService: CommitteeService) {}

  @Get('collaborators')
  @ApiOperation({
    summary: 'Listar colaboradores para equalização',
    description:
      'Retorna todos os colaboradores que precisam de avaliação de equalização no ciclo ativo. Apenas disponível na fase EQUALIZATION.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de colaboradores retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: { type: 'string', example: '2025.1' },
        phase: { type: 'string', example: 'EQUALIZATION' },
        collaborators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clz1x2y3z4w5v6u7t8s9r0' },
              name: { type: 'string', example: 'João Silva' },
              email: { type: 'string', example: 'joao.silva@rocketcorp.com' },
              jobTitle: { type: 'string', example: 'Desenvolvedor Full Stack' },
              seniority: { type: 'string', example: 'Pleno' },
              businessUnit: { type: 'string', example: 'Technology' },
              hasCommitteeAssessment: { type: 'boolean', example: false },
              committeeAssessment: { type: 'object', nullable: true },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalCollaborators: { type: 'number', example: 15 },
            withCommitteeAssessment: { type: 'number', example: 3 },
            pendingEqualization: { type: 'number', example: 12 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Não há ciclo ativo ou não está na fase de equalização',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro do comitê',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getCollaboratorsForEqualization(@CurrentUser() user: User) {
    return this.committeeService.getCollaboratorsForEqualization();
  }

  @Get('collaborator/:collaboratorId/summary')
  @ApiOperation({
    summary: 'Obter resumo de avaliações de um colaborador',
    description:
      'Retorna todas as avaliações recebidas por um colaborador no ciclo ativo para análise de equalização.',
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'clz1x2y3z4w5v6u7t8s9r0',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo de avaliações retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: { type: 'string', example: '2025.1' },
        collaborator: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clz1x2y3z4w5v6u7t8s9r0' },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao.silva@rocketcorp.com' },
            jobTitle: { type: 'string', example: 'Desenvolvedor Full Stack' },
            seniority: { type: 'string', example: 'Pleno' },
          },
        },
        selfAssessment: { type: 'object', nullable: true },
        assessments360Received: { type: 'array' },
        managerAssessmentsReceived: { type: 'array' },
        mentoringAssessmentsReceived: { type: 'array' },
        referenceFeedbacksReceived: { type: 'array' },
        committeeAssessment: { type: 'object', nullable: true },
        summary: {
          type: 'object',
          properties: {
            totalAssessmentsReceived: { type: 'number', example: 5 },
            hasCommitteeAssessment: { type: 'boolean', example: false },
            isEqualizationComplete: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Não há ciclo ativo ou não está na fase de equalização',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro do comitê',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getCollaboratorEvaluationSummary(
    @CurrentUser() user: User,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.committeeService.getCollaboratorEvaluationSummary(collaboratorId);
  }

  @Post('assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar avaliação de comitê',
    description:
      'Cria uma nova avaliação de equalização para um colaborador. Apenas membros do comitê podem realizar esta ação na fase EQUALIZATION.',
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliação de comitê criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clz1x2y3z4w5v6u7t8s9r0' },
        cycle: { type: 'string', example: '2025.1' },
        finalScore: { type: 'number', example: 4 },
        justification: { type: 'string', example: 'Justificativa baseada nas avaliações...' },
        observations: { type: 'string', example: 'Observações adicionais...', nullable: true },
        status: { type: 'string', example: 'DRAFT' },
        createdAt: { type: 'string', format: 'date-time' },
        author: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cmte-123' },
            name: { type: 'string', example: 'Maria Santos' },
            email: { type: 'string', example: 'maria.santos@rocketcorp.com' },
          },
        },
        evaluatedUser: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-456' },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao.silva@rocketcorp.com' },
            jobTitle: { type: 'string', example: 'Desenvolvedor Full Stack' },
            seniority: { type: 'string', example: 'Pleno' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos, colaborador não encontrado, ou já existe avaliação de comitê para este colaborador',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro do comitê',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createCommitteeAssessment(
    @CurrentUser() user: User,
    @Body() createDto: CreateCommitteeAssessmentDto,
  ) {
    return this.committeeService.createCommitteeAssessment(user.id, createDto);
  }

  @Put('assessment/:assessmentId')
  @ApiOperation({
    summary: 'Atualizar avaliação de comitê',
    description:
      'Atualiza uma avaliação de comitê existente. Apenas avaliações em status DRAFT podem ser editadas.',
  })
  @ApiParam({
    name: 'assessmentId',
    description: 'ID da avaliação de comitê',
    example: 'clz1x2y3z4w5v6u7t8s9r0',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliação de comitê atualizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação de comitê não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Avaliação já foi submetida e não pode ser editada',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro do comitê',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async updateCommitteeAssessment(
    @CurrentUser() user: User,
    @Param('assessmentId') assessmentId: string,
    @Body() updateDto: UpdateCommitteeAssessmentDto,
  ) {
    return this.committeeService.updateCommitteeAssessment(assessmentId, user.id, updateDto);
  }

  @Patch('assessment/:assessmentId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submeter avaliação de comitê',
    description: 'Submete uma avaliação de comitê, mudando seu status de DRAFT para SUBMITTED.',
  })
  @ApiParam({
    name: 'assessmentId',
    description: 'ID da avaliação de comitê',
    example: 'clz1x2y3z4w5v6u7t8s9r0',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliação de comitê submetida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação de comitê não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Avaliação já foi submetida',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro do comitê',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async submitCommitteeAssessment(
    @CurrentUser() user: User,
    @Param('assessmentId') assessmentId: string,
    @Body() submitDto: SubmitCommitteeAssessmentDto,
  ) {
    return this.committeeService.submitCommitteeAssessment(assessmentId, user.id);
  }

  @Get('assessments')
  @ApiOperation({
    summary: 'Listar todas as avaliações de comitê',
    description: 'Retorna todas as avaliações de comitê do ciclo ativo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações de comitê retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: { type: 'string', example: '2025.1' },
        phase: { type: 'string', example: 'EQUALIZATION' },
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clz1x2y3z4w5v6u7t8s9r0' },
              finalScore: { type: 'number', example: 4 },
              justification: { type: 'string' },
              observations: { type: 'string', nullable: true },
              status: { type: 'string', example: 'SUBMITTED' },
              createdAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time', nullable: true },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              evaluatedUser: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  jobTitle: { type: 'string' },
                  seniority: { type: 'string' },
                  businessUnit: { type: 'string' },
                },
              },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 15 },
            draft: { type: 'number', example: 3 },
            submitted: { type: 'number', example: 12 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Não há ciclo ativo',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro do comitê',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getCommitteeAssessmentsByCycle(@CurrentUser() user: User) {
    return this.committeeService.getCommitteeAssessmentsByCycle();
  }
}
