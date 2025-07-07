import {
  Controller,
  Get,
  UseGuards,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HRRoleGuard } from '../../auth/guards/hr-role.guard';
import { HRService } from './hr.service';
import {
  CollaboratorEvolutionSummaryDto,
  CollaboratorDetailedEvolutionDto,
  HRDashboardDto,
  EvolutionComparisonDto,
} from './dto';

@ApiTags('RH - Evolução Histórica')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HRRoleGuard)
@Controller('api/hr/evolution')
export class HRController {
  constructor(private readonly hrService: HRService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard de evolução geral (RH)',
    description: `
      Retorna um dashboard consolidado com estatísticas gerais de evolução 
      de todos os colaboradores, incluindo médias por ciclo, distribuição 
      de performance, tendências e insights.
      
      **Permissões:** Apenas RH ou Admin
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retornado com sucesso',
    type: () => HRDashboardDto,
  })
  async getEvolutionDashboard(): Promise<HRDashboardDto> {
    return this.hrService.getEvolutionDashboard();
  }

  @Get('collaborators/summary')
  @ApiOperation({
    summary: 'Resumo de evolução de todos os colaboradores (RH)',
    description: `
      Retorna uma lista com resumo da evolução histórica de todos os 
      colaboradores, incluindo tendência de melhoria/piora, média geral,
      e indicadores por pilar.
      
      **Permissões:** Apenas RH ou Admin
    `,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo para ordenação',
    enum: ['name', 'latestScore', 'evolution', 'totalCycles'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Ordem da classificação',
    enum: ['asc', 'desc'],
  })
  @ApiQuery({
    name: 'filterBy',
    required: false,
    description: 'Filtro por tendência',
    enum: ['improving', 'declining', 'stable', 'high-performers', 'low-performers'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de colaboradores retornada com sucesso',
    type: [CollaboratorEvolutionSummaryDto],
  })
  async getCollaboratorsEvolutionSummary(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('filterBy') filterBy?: string,
  ): Promise<CollaboratorEvolutionSummaryDto[]> {
    return this.hrService.getCollaboratorsEvolutionSummary({
      sortBy,
      sortOrder,
      filterBy,
    });
  }

  @Get('collaborators/:collaboratorId/detailed')
  @ApiOperation({
    summary: 'Evolução detalhada de um colaborador específico (RH)',
    description: `
      Retorna evolução histórica completa e detalhada de um colaborador,
      incluindo todas as avaliações por ciclo, comparação por pilares,
      tendências, insights e recomendações.
      
      **Permissões:** Apenas RH ou Admin
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'user-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Evolução detalhada retornada com sucesso',
    type: CollaboratorDetailedEvolutionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaboratorDetailedEvolution(
    @Param('collaboratorId') collaboratorId: string,
  ): Promise<CollaboratorDetailedEvolutionDto> {
    const result = await this.hrService.getCollaboratorDetailedEvolution(collaboratorId);
    
    if (!result) {
      throw new NotFoundException('Colaborador não encontrado');
    }
    
    return result;
  }

  @Get('comparison')
  @ApiOperation({
    summary: 'Comparação de evolução entre colaboradores (RH)',
    description: `
      Permite comparar a evolução histórica de múltiplos colaboradores
      lado a lado, útil para análises comparativas e tomada de decisões.
      
      **Permissões:** Apenas RH ou Admin
    `,
  })
  @ApiQuery({
    name: 'collaboratorIds',
    required: true,
    description: 'IDs dos colaboradores para comparar (separados por vírgula)',
    example: 'user-123,user-456,user-789',
  })
  @ApiQuery({
    name: 'cycles',
    required: false,
    description: 'Ciclos específicos para comparar (separados por vírgula)',
    example: '2024.1,2024.2,2025.1',
  })
  @ApiQuery({
    name: 'pillar',
    required: false,
    description: 'Pilar específico para comparar',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT', 'overall'],
  })
  @ApiResponse({
    status: 200,
    description: 'Comparação retornada com sucesso',
    type: EvolutionComparisonDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos ou colaboradores não encontrados',
  })
  async compareCollaboratorsEvolution(
    @Query('collaboratorIds') collaboratorIds: string,
    @Query('cycles') cycles?: string,
    @Query('pillar') pillar?: string,
  ): Promise<EvolutionComparisonDto> {
    if (!collaboratorIds) {
      throw new BadRequestException('colaboratorIds é obrigatório');
    }

    const collaboratorIdArray = collaboratorIds.split(',').map(id => id.trim());
    
    if (collaboratorIdArray.length < 2) {
      throw new BadRequestException('É necessário pelo menos 2 colaboradores para comparação');
    }

    if (collaboratorIdArray.length > 5) {
      throw new BadRequestException('Máximo de 5 colaboradores por comparação');
    }

    const cycleArray = cycles ? cycles.split(',').map(cycle => cycle.trim()) : undefined;

    return this.hrService.compareCollaboratorsEvolution({
      collaboratorIds: collaboratorIdArray,
      cycles: cycleArray,
      pillar,
    });
  }

  @Get('trends')
  @ApiOperation({
    summary: 'Análise de tendências organizacionais (RH)',
    description: `
      Retorna análise de tendências da organização como um todo,
      incluindo evolução média por ciclo, pilares com mais crescimento,
      identificação de padrões e insights estratégicos.
      
      **Permissões:** Apenas RH ou Admin
    `,
  })
  @ApiQuery({
    name: 'startCycle',
    required: false,
    description: 'Ciclo inicial para análise',
    example: '2024.1',
  })
  @ApiQuery({
    name: 'endCycle',
    required: false,
    description: 'Ciclo final para análise',
    example: '2025.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Análise de tendências retornada com sucesso',
  })
  async getOrganizationalTrends(
    @Query('startCycle') startCycle?: string,
    @Query('endCycle') endCycle?: string,
  ) {
    return this.hrService.getOrganizationalTrends({
      startCycle,
      endCycle,
    });
  }

  @Get('collaborators/:collaboratorId/pillar-evolution/:pillar')
  @ApiOperation({
    summary: 'Evolução de um pilar específico de um colaborador (RH)',
    description: `
      Retorna evolução detalhada de um pilar específico (BEHAVIOR, EXECUTION, MANAGEMENT)
      para um colaborador, incluindo breakdown por critérios individuais.
      
      **Permissões:** Apenas RH ou Admin
    `,
  })
  @ApiParam({
    name: 'collaboratorId',
    description: 'ID do colaborador',
    example: 'user-123',
  })
  @ApiParam({
    name: 'pillar',
    description: 'Pilar para análise detalhada',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'],
  })
  @ApiResponse({
    status: 200,
    description: 'Evolução do pilar retornada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
  })
  async getCollaboratorPillarEvolution(
    @Param('collaboratorId') collaboratorId: string,
    @Param('pillar') pillar: 'BEHAVIOR' | 'EXECUTION' | 'MANAGEMENT',
  ) {
    return this.hrService.getCollaboratorPillarEvolution(collaboratorId, pillar);
  }
} 