import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CriteriaService } from './criteria.service';
import { CriterionDto } from './dto/criteria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessUnit } from '../common/enums/business-unit.enum';

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
      return this.criteriaService.findByPillar(pillar);
    }

    if (requiredOnly) {
      return this.criteriaService.findRequired();
    }

    return this.criteriaService.findAll();
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
