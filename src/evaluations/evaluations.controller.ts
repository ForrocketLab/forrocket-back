import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import {
  CreateSelfAssessmentDto,
  Create360AssessmentDto,
  CreateMentoringAssessmentDto,
  CreateReferenceFeedbackDto
} from './dto';

@ApiTags('Avaliações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluations/collaborator')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  // ==========================================
  // ENDPOINTS DE CRIAÇÃO (WRITE)
  // ==========================================

  @Post('self-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar autoavaliação',
    description: 'Permite que um colaborador crie sua autoavaliação para um ciclo específico'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Autoavaliação criada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou autoavaliação já existe para este ciclo' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou ausente' 
  })
  async createSelfAssessment(
    @CurrentUser() user: User,
    @Body() createSelfAssessmentDto: CreateSelfAssessmentDto
  ) {
    return this.evaluationsService.createSelfAssessment(
      user.id, 
      createSelfAssessmentDto
    );
  }

  @Post('360-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar avaliação 360 graus',
    description: 'Permite que um colaborador avalie um colega de trabalho'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Avaliação 360 criada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou avaliação já existe para este usuário/ciclo' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuário avaliado não encontrado' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou ausente' 
  })
  async create360Assessment(
    @CurrentUser() user: User,
    @Body() create360AssessmentDto: Create360AssessmentDto
  ) {
    return this.evaluationsService.create360Assessment(
      user.id, 
      create360AssessmentDto
    );
  }

  @Post('mentoring-assessment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar avaliação de mentoring',
    description: 'Permite que um colaborador avalie seu mentor'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Avaliação de mentoring criada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou avaliação já existe para este mentor/ciclo' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Mentor não encontrado' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou ausente' 
  })
  async createMentoringAssessment(
    @CurrentUser() user: User,
    @Body() createMentoringAssessmentDto: CreateMentoringAssessmentDto
  ) {
    return this.evaluationsService.createMentoringAssessment(
      user.id, 
      createMentoringAssessmentDto
    );
  }

  @Post('reference-feedback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar feedback de referência',
    description: 'Permite que um colaborador dê feedback sobre um colega'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Feedback de referência criado com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou feedback já existe para este usuário/ciclo' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuário referenciado não encontrado' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou ausente' 
  })
  async createReferenceFeedback(
    @CurrentUser() user: User,
    @Body() createReferenceFeedbackDto: CreateReferenceFeedbackDto
  ) {
    return this.evaluationsService.createReferenceFeedback(
      user.id, 
      createReferenceFeedbackDto
    );
  }

  // ==========================================
  // ENDPOINTS DE LEITURA (READ)
  // ==========================================

  @Get('cycle/:cycleId')
  @ApiOperation({ 
    summary: 'Buscar avaliações por ciclo',
    description: 'Retorna todas as avaliações do usuário logado para um ciclo específico'
  })
  @ApiParam({
    name: 'cycleId',
    description: 'ID do ciclo de avaliação',
    example: '2025.1'
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
          description: 'Autoavaliação do usuário (null se não existir)'
        },
        assessments360: { 
          type: 'array',
          description: 'Lista de avaliações 360 feitas pelo usuário'
        },
        mentoringAssessments: { 
          type: 'array',
          description: 'Lista de avaliações de mentoring feitas pelo usuário'
        },
        referenceFeedbacks: { 
          type: 'array',
          description: 'Lista de feedbacks de referência dados pelo usuário'
        },
        summary: {
          type: 'object',
          properties: {
            selfAssessmentCompleted: { type: 'boolean' },
            assessments360Count: { type: 'number' },
            mentoringAssessmentsCount: { type: 'number' },
            referenceFeedbacksCount: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou ausente' 
  })
  async getUserEvaluationsByCycle(
    @CurrentUser() user: User,
    @Param('cycleId') cycleId: string
  ) {
    return this.evaluationsService.getUserEvaluationsByCycle(user.id, cycleId);
  }
} 