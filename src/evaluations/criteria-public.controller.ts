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

import { CriteriaService } from './criteria.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CriterionDto } from './dto/criteria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Critérios de Avaliação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/public/criteria')
export class CriteriaPublicController {
  constructor(private readonly criteriaService: CriteriaService) {}

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
    const userRoles: string[] = Array.isArray(user.roles) 
      ? user.roles as string[]
      : JSON.parse(user.roles || '[]') as string[];
    const isManager: boolean = userRoles.includes('gestor') || userRoles.includes('manager');
    
    return this.criteriaService.findForUserRole(isManager);
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
