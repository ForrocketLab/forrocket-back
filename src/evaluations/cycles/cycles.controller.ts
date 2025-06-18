import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { CyclesService } from './cycles.service';
import {
  EvaluationCycleDto,
  CreateEvaluationCycleDto,
  ActivateCycleDto,
  UpdateCycleStatusDto,
  UpdateCyclePhaseDto,
} from './dto/evaluation-cycle.dto';
import { CurrentUser } from '../../auth/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Ciclos de Avaliação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluation-cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar ciclos de avaliação',
    description: 'Retorna todos os ciclos de avaliação ordenados por data de criação',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciclos retornada com sucesso',
    type: [EvaluationCycleDto],
  })
  async getCycles() {
    return this.cyclesService.getEvaluationCycles();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Obter ciclo ativo',
    description: 'Retorna informações do ciclo de avaliação ativo, incluindo fase atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo ativo encontrado',
    type: EvaluationCycleDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum ciclo ativo encontrado',
  })
  async getActiveCycle() {
    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();

    if (!activeCycle) {
      throw new NotFoundException('Nenhum ciclo de avaliação ativo encontrado');
    }

    return activeCycle;
  }

  @Get('active/phase')
  @ApiOperation({
    summary: 'Verificar fase atual do ciclo ativo',
    description: `
      Retorna informações sobre a fase atual do ciclo de avaliação ativo.
      
      **Fases possíveis:**
      - ASSESSMENTS: Autoavaliação, 360, Mentoring, Reference estão liberadas
      - MANAGER_REVIEWS: Apenas avaliações de gestor estão liberadas
      - EQUALIZATION: Fase de equalização (todas as avaliações bloqueadas)
      
      **Útil para o frontend decidir quais botões/funcionalidades mostrar**
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Fase atual retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycleId: { type: 'string', example: 'cluid123456789' },
        cycleName: { type: 'string', example: '2025.1' },
        currentPhase: {
          type: 'string',
          example: 'ASSESSMENTS',
          enum: ['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'],
        },
        phaseDescription: {
          type: 'string',
          example: 'Avaliações (Autoavaliação, 360, Mentoring, Reference)',
        },
        allowedEvaluations: {
          type: 'object',
          properties: {
            selfAssessment: { type: 'boolean', example: true },
            assessment360: { type: 'boolean', example: true },
            mentoringAssessment: { type: 'boolean', example: true },
            referenceFeedback: { type: 'boolean', example: true },
            managerAssessment: { type: 'boolean', example: false },
          },
        },
        nextPhase: {
          type: 'string',
          example: 'MANAGER_REVIEWS',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum ciclo ativo encontrado',
  })
  async getActivePhase() {
    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();

    if (!activeCycle) {
      throw new NotFoundException('Nenhum ciclo de avaliação ativo encontrado');
    }

    // Mapear descrições das fases
    const phaseDescriptions = {
      ASSESSMENTS: 'Avaliações (Autoavaliação, 360, Mentoring, Reference)',
      MANAGER_REVIEWS: 'Avaliações de Gestor',
      EQUALIZATION: 'Equalização',
    };

    // Mapear quais avaliações estão permitidas em cada fase
    const allowedEvaluationsByPhase = {
      ASSESSMENTS: {
        selfAssessment: true,
        assessment360: true,
        mentoringAssessment: true,
        referenceFeedback: true,
        managerAssessment: false,
      },
      MANAGER_REVIEWS: {
        selfAssessment: false,
        assessment360: false,
        mentoringAssessment: false,
        referenceFeedback: false,
        managerAssessment: true,
      },
      EQUALIZATION: {
        selfAssessment: false,
        assessment360: false,
        mentoringAssessment: false,
        referenceFeedback: false,
        managerAssessment: false,
      },
    };

    // Mapear próxima fase possível
    const nextPhaseMap = {
      ASSESSMENTS: 'MANAGER_REVIEWS',
      MANAGER_REVIEWS: 'EQUALIZATION',
      EQUALIZATION: null, // Fase final
    };

    return {
      cycleId: activeCycle.id,
      cycleName: activeCycle.name,
      currentPhase: activeCycle.phase,
      phaseDescription: phaseDescriptions[activeCycle.phase],
      allowedEvaluations: allowedEvaluationsByPhase[activeCycle.phase],
      nextPhase: nextPhaseMap[activeCycle.phase],
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo ciclo de avaliação',
    description:
      'Cria um novo ciclo de avaliação com status UPCOMING. Apenas administradores podem criar ciclos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ciclo criado com sucesso',
    type: EvaluationCycleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou ciclo já existe',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas administradores podem criar ciclos',
  })
  async createCycle(@CurrentUser() user: User, @Body() createCycleDto: CreateEvaluationCycleDto) {
    // Verificar se o usuário é admin
    if (!user.roles.includes('admin')) {
      throw new ForbiddenException('Apenas administradores podem criar ciclos de avaliação');
    }

    return this.cyclesService.createEvaluationCycle(createCycleDto);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativar ciclo de avaliação',
    description:
      'Ativa um ciclo específico (muda status para OPEN) e desativa outros ciclos ativos. Apenas administradores podem ativar ciclos.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ciclo a ser ativado',
    example: 'cycle-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo ativado com sucesso',
    type: EvaluationCycleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ciclo já está ativo ou dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas administradores podem ativar ciclos',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciclo não encontrado',
  })
  async activateCycle(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() activateCycleDto: ActivateCycleDto,
  ) {
    // Verificar se o usuário é admin
    if (!user.roles.includes('admin')) {
      throw new ForbiddenException('Apenas administradores podem ativar ciclos de avaliação');
    }

    return this.cyclesService.activateCycle(id, activateCycleDto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar status do ciclo',
    description:
      'Atualiza o status de um ciclo específico. Apenas administradores podem alterar status.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ciclo a ser atualizado',
    example: 'cycle-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do ciclo atualizado com sucesso',
    type: EvaluationCycleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Status inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas administradores podem alterar status de ciclos',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciclo não encontrado',
  })
  async updateCycleStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCycleStatusDto,
  ) {
    // Verificar se o usuário é admin
    if (!user.roles.includes('admin')) {
      throw new ForbiddenException('Apenas administradores podem alterar status de ciclos');
    }

    return this.cyclesService.updateCycleStatus(id, updateStatusDto);
  }

  @Patch(':id/phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar fase do ciclo de avaliação',
    description: `
      Atualiza a fase de um ciclo de avaliação ativo. Apenas administradores podem alterar fases.
      
      **Fases disponíveis:**
      - ASSESSMENTS: Fase 1 - Permite autoavaliação, 360, mentoring e reference
      - MANAGER_REVIEWS: Fase 2 - Permite apenas avaliações de gestor
      - EQUALIZATION: Fase 3 - Fase de equalização (ainda não implementada)
      
      **Regras de transição:**
      - ASSESSMENTS → MANAGER_REVIEWS (permitido)
      - MANAGER_REVIEWS → EQUALIZATION (permitido)  
      - Não é possível voltar para fases anteriores
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ciclo',
    example: 'cycle-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Fase do ciclo atualizada com sucesso',
    type: EvaluationCycleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Transição de fase inválida ou ciclo não está ativo',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas administradores podem alterar fases',
  })
  @ApiResponse({
    status: 404,
    description: 'Ciclo não encontrado',
  })
  async updateCyclePhase(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updatePhaseDto: UpdateCyclePhaseDto,
  ) {
    // Verificar se o usuário é admin
    if (!user.roles.includes('admin')) {
      throw new ForbiddenException('Apenas administradores podem alterar fases de ciclos');
    }

    return this.cyclesService.updateCyclePhase(id, updatePhaseDto);
  }
}
