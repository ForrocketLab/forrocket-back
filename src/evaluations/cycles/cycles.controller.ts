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

import { CycleAutomationService } from './cycle-automation.service';
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
import { RoleCheckerService } from '../../auth/role-checker.service';

@ApiTags('Ciclos de Avaliação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluation-cycles')
export class CyclesController {
  constructor(
    private readonly cyclesService: CyclesService,
    private readonly cycleAutomationService: CycleAutomationService,
    private readonly roleChecker: RoleCheckerService,
  ) {}

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
    const isAdmin = await this.roleChecker.isAdmin(user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Apenas administradores podem criar ciclos de avaliação');
    }

    return this.cyclesService.createEvaluationCycle(createCycleDto);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativar ciclo de avaliação com deadlines',
    description: `
      Ativa um ciclo específico (muda status para OPEN) e desativa outros ciclos ativos. 
      Permite configurar deadlines completas e automatizar o fim do ciclo.
      Apenas administradores podem ativar ciclos.
      
      **Funcionalidades:**
      - Configuração de deadlines por fase (avaliações, gestores, equalização)
      - Automatização do fim do ciclo baseado na deadline de equalização
      - Validação de consistência de datas e prazos
      - Tratamento de inconsistências de dados
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ciclo a ser ativado',
    example: 'cycle-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo ativado com sucesso com deadlines configuradas',
    type: EvaluationCycleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ciclo já está ativo, dados inválidos ou inconsistências de datas',
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
    const isAdmin = await this.roleChecker.isAdmin(user.id);
    if (!isAdmin) {
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
    const isAdmin = await this.roleChecker.isAdmin(user.id);
    if (!isAdmin) {
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
    const isAdmin = await this.roleChecker.isAdmin(user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Apenas administradores podem alterar fases de ciclos');
    }

    return this.cyclesService.updateCyclePhase(id, updatePhaseDto);
  }

  @Get(':id/deadlines')
  @ApiOperation({
    summary: 'Obter informações de deadlines e prazos do ciclo',
    description: `
      Retorna informações detalhadas sobre deadlines, prazos e status de um ciclo específico.
      
      **Informações retornadas:**
      - Status de cada deadline (OK, URGENT, OVERDUE)
      - Dias restantes para cada prazo
      - Resumo de deadlines (total, atrasadas, urgentes)
      - Inconsistências de datas detectadas
      - Validações de consistência de prazos
      
      **Status de deadline:**
      - OK: Mais de 3 dias restantes
      - URGENT: 3 dias ou menos restantes
      - OVERDUE: Prazo vencido
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do ciclo',
    example: 'cycle-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações de deadlines retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' },
            phase: { type: 'string' },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        deadlines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              name: { type: 'string' },
              deadline: { type: 'string', format: 'date-time' },
              daysUntil: { type: 'number' },
              status: { type: 'string', enum: ['OK', 'URGENT', 'OVERDUE'] },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalDeadlines: { type: 'number' },
            overdueCount: { type: 'number' },
            urgentCount: { type: 'number' },
            okCount: { type: 'number' },
          },
        },
        inconsistencies: {
          type: 'array',
          items: { type: 'string' },
        },
        hasInconsistencies: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ciclo não encontrado',
  })
  async getCycleDeadlines(@Param('id') id: string) {
    return this.cyclesService.getCycleDeadlinesInfo(id);
  }

  @Post('automation/force-check')
  @ApiOperation({
    summary: 'Forçar verificação de automações (ADMIN ONLY)',
    description: `
      Força uma verificação manual das automações de ciclo.
      
      **Verificações realizadas:**
      - Ciclos que devem ser ativados automaticamente
      - Mudanças de fase baseadas em deadlines
      - Ciclos que devem ser fechados automaticamente
      
      **⚠️ ADMIN ONLY:** Apenas administradores podem usar esta funcionalidade.
      
      **Uso típico:**
      - Testes de automação
      - Verificação manual após mudanças
      - Debugging de problemas de timing
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação de automação executada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores',
  })
  @HttpCode(HttpStatus.OK)
  async forceAutomationCheck(@CurrentUser() user: User) {
    // Verificar se o usuário é admin
    const isAdmin = await this.roleChecker.isAdmin(user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Apenas administradores podem forçar verificações de automação');
    }

    await this.cycleAutomationService.forceCheck();

    return {
      message: 'Verificação de automação executada com sucesso',
      timestamp: new Date().toISOString(),
    };
  }
}
