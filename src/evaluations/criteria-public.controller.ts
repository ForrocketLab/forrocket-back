import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { User, CriterionPillar } from '@prisma/client';
import { ProjectsService } from 'src/projects/projects.service';

import { CriteriaService } from './criteria.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CriterionDto } from './dto/criteria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessUnit } from '../common/enums/business-unit.enum';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Critérios de Avaliação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/public/criteria')
export class CriteriaPublicController {
  constructor(
    private readonly criteriaService: CriteriaService,
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os critérios',
    description: `
      Lista todos os critérios de avaliação disponíveis no sistema.
      
      **Nova estrutura:**
      - Todos os critérios sempre aparecem no formulário
      - Distingue entre obrigatórios e opcionais
      
      **Permissões:** Qualquer usuário autenticado pode acessar.
      
      **Uso:** Usado para popular formulários de avaliação.
    `,
  })
  @ApiQuery({
    name: 'pillar',
    required: false,
    type: String,
    description: 'Filtrar por pilar específico',
    enum: ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'],
    example: 'BEHAVIOR',
  })
  @ApiQuery({
    name: 'requiredOnly',
    required: false,
    type: Boolean,
    description: 'Listar apenas critérios obrigatórios',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de critérios recuperada com sucesso',
    type: [CriterionDto],
  })
  async findAll(
    @Query('pillar') pillar?: string,
    @Query('requiredOnly') requiredOnly?: boolean,
  ): Promise<CriterionDto[]> {
    if (pillar) {
      return this.criteriaService.findByPillar(pillar as CriterionPillar);
    }

    if (requiredOnly) {
      return this.criteriaService.findRequired();
    }

    return this.criteriaService.findAll();
  }

  @Get('for-user')
  @ApiOperation({
    summary: 'Listar critérios baseados no papel do usuário',
    description: `
      Lista critérios de avaliação baseados no papel do usuário logado.
      
      **Regras de negócio:**
      - Gestores: recebem todos os critérios (incluindo MANAGEMENT)
      - Outros usuários: recebem critérios exceto do pilar MANAGEMENT
      
      **Permissões:** Qualquer usuário autenticado pode acessar.
      
      **Uso:** Este endpoint é usado para montar formulários de avaliação 
      onde apenas gestores podem avaliar critérios de gestão.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de critérios baseada no papel do usuário',
    type: [CriterionDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou não fornecido',
  })
  async findForUser(@CurrentUser() user: User): Promise<CriterionDto[]> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(user.id);

    // Buscar os dados completos do usuário para obter o businessUnit
    const userWithBusinessUnit = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { businessUnit: true },
    });

    return this.criteriaService.findForUserRole(isManager, userWithBusinessUnit?.businessUnit);
  }
  @Get('effective')
  @ApiOperation({
    summary: 'Listar critérios efetivos para uma unidade de negócio',
    description: `
      Retorna a junção dos critérios base (formulário padrão) + critérios específicos da unidade,
      removendo os critérios do base que foram removidos para a unidade.
      
      **Uso:** Usado para popular formulários de autoavaliação do colaborador.
    `,
  })
  @ApiQuery({
    name: 'businessUnit',
    required: true,
    type: String,
    description: 'Unidade de negócio/trilha',
    enum: BusinessUnit,
    example: BusinessUnit.DIGITAL_PRODUCTS,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de critérios efetivos recuperada com sucesso',
    type: [CriterionDto],
  })
  async findEffectiveByBusinessUnit(
    @Query('businessUnit') businessUnit: string,
  ): Promise<CriterionDto[]> {
    return this.criteriaService.findEffectiveByBusinessUnit(businessUnit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar critério por ID',
    description: 'Retorna os detalhes de um critério específico pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do critério',
    example: 'sentimento-de-dono',
  })
  @ApiResponse({
    status: 200,
    description: 'Critério encontrado com sucesso',
    type: CriterionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Critério não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<CriterionDto> {
    return this.criteriaService.findOne(id);
  }
}
