import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { User, CriterionPillar } from '@prisma/client';

import { CriteriaService } from './criteria.service';
import { CreateCriterionDto, UpdateCriterionDto, CriterionDto } from './dto/criteria.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessUnit } from '../common/enums/business-unit.enum';

/**
 * Controller para gestão de critérios de avaliação
 *
 * **NOVA ESTRUTURA:**
 * - Todos os critérios sempre aparecem no formulário
 * - Controle apenas da obrigatoriedade (obrigatório vs opcional)
 * - Não há mais conceito de ativar/desativar critérios
 */
@ApiTags('Critérios de Avaliação (RH)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HRRoleGuard)
@Controller('api/criteria')
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os critérios',
    description: `
      Lista todos os critérios de avaliação disponíveis no sistema.
      
      **Nova estrutura:**
      - Todos os critérios sempre aparecem no formulário
      - Apenas distingue entre obrigatórios e opcionais
      
      **Permissões:** Apenas usuários do RH ou ADMIN podem acessar.
      
      **Parâmetros opcionais:**  
      - requiredOnly: Lista apenas critérios obrigatórios
      - optionalOnly: Lista apenas critérios opcionais
      - pillar: Filtra critérios por pilar específico
    `,
  })
  @ApiQuery({
    name: 'requiredOnly',
    required: false,
    type: Boolean,
    description: 'Listar apenas critérios obrigatórios',
    example: false,
  })
  @ApiQuery({
    name: 'optionalOnly',
    required: false,
    type: Boolean,
    description: 'Listar apenas critérios opcionais',
    example: false,
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
    name: 'businessUnit',
    required: false,
    type: String,
    description: 'Filtrar por unidade de negócio específica',
    enum: BusinessUnit,
    example: BusinessUnit.DIGITAL_PRODUCTS,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de critérios recuperada com sucesso',
    type: [CriterionDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado. Apenas usuários do RH podem acessar esta funcionalidade.',
  })
  async findAll(
    @Query('requiredOnly') requiredOnly?: boolean,
    @Query('optionalOnly') optionalOnly?: boolean,
    @Query('pillar') pillar?: string,
    @Query('businessUnit') businessUnit?: string,
  ): Promise<CriterionDto[]> {
    if (pillar) {
      return this.criteriaService.findByPillar(pillar as CriterionPillar);
    }

    if (businessUnit) {
      if (requiredOnly) {
        return this.criteriaService.findRequiredByBusinessUnit(businessUnit);
      }
      if (optionalOnly) {
        return this.criteriaService.findOptionalByBusinessUnit(businessUnit);
      }
      return this.criteriaService.findByBusinessUnit(businessUnit);
    }

    if (requiredOnly) {
      return this.criteriaService.findRequired();
    }

    if (optionalOnly) {
      return this.criteriaService.findOptional();
    }

    return this.criteriaService.findAll();
  }

  @Get('effective')
  @ApiOperation({
    summary: 'Listar critérios efetivos para uma unidade de negócio',
    description: `
      Retorna a junção dos critérios base (formulário padrão) + critérios específicos da unidade,
      removendo os critérios do base que foram removidos para a unidade.
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
    status: HttpStatus.OK,
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
    status: HttpStatus.OK,
    description: 'Critério encontrado com sucesso',
    type: CriterionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critério não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<CriterionDto> {
    return this.criteriaService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar novo critério',
    description: `
      Cria um novo critério de avaliação no sistema.
      
      **Regras de negócio:**
      - O nome deve ser único no sistema
      - O ID é gerado automaticamente baseado no nome
      - Peso padrão é 1.0 (100%)
      - Por padrão, critérios são obrigatórios
      - Todos os critérios sempre aparecem no formulário
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Critério criado com sucesso',
    type: CriterionDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um critério com este nome',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  async create(
    @Body(ValidationPipe) createCriterionDto: CreateCriterionDto,
    @CurrentUser() user,
  ): Promise<CriterionDto> {
    return this.criteriaService.create(createCriterionDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar critério existente',
    description: `
      Atualiza um critério de avaliação existente.
      
      **Campos atualizáveis:**
      - name: Nome do critério
      - description: Descrição detalhada
      - pillar: Pilar do critério
      - weight: Peso na avaliação (0.1 a 5.0)
      - isRequired: Se é obrigatório no formulário
      
      **Regras:**
      - Se alterar o nome, deve ser único no sistema
      - Peso deve estar entre 0.1 e 5.0
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do critério',
    example: 'sentimento-de-dono',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critério atualizado com sucesso',
    type: CriterionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critério não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Nome já existe em outro critério',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCriterionDto: UpdateCriterionDto,
    @CurrentUser() user,
  ): Promise<CriterionDto> {
    return this.criteriaService.update(id, updateCriterionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover critério',
    description: 'Remove um critério do sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do critério',
    example: 'sentimento-de-dono',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critério removido com sucesso',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critério não encontrado',
  })
  async remove(@Param('id') id: string, @CurrentUser() user): Promise<{ message: string }> {
    await this.criteriaService.remove(id);
    return { message: 'Critério removido com sucesso' };
  }

  @Patch(':id/toggle-required')
  @ApiOperation({
    summary: 'Alternar obrigatoriedade do critério',
    description: 'Alterna o campo isRequired de um critério.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do critério',
    example: 'sentimento-de-dono',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critério atualizado com sucesso',
    type: CriterionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critério não encontrado',
  })
  async toggleRequired(@Param('id') id: string, @CurrentUser() user): Promise<CriterionDto> {
    return this.criteriaService.toggleRequired(id);
  }

  @Post('remove-from-unit')
  @ApiOperation({
    summary: 'Remover critério base de uma unidade de negócio',
    description: 'Remove um critério do formulário base apenas para a unidade/trilha informada.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        criterionId: { type: 'string', example: 'sentimento-de-dono' },
        businessUnit: { type: 'string', example: 'Digital Products' },
      },
      required: ['criterionId', 'businessUnit'],
    },
  })
  async removeFromUnit(@Body() body: { criterionId: string; businessUnit: string }) {
    await this.criteriaService.removeFromUnit(body.criterionId, body.businessUnit);
    return { message: 'Critério removido da unidade com sucesso' };
  }

  @Post('restore-to-unit')
  @ApiOperation({
    summary: 'Restaurar critério base em uma unidade de negócio',
    description: 'Restaura um critério do formulário base para a unidade/trilha informada.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        criterionId: { type: 'string', example: 'sentimento-de-dono' },
        businessUnit: { type: 'string', example: 'Digital Products' },
      },
      required: ['criterionId', 'businessUnit'],
    },
  })
  async restoreToUnit(@Body() body: { criterionId: string; businessUnit: string }) {
    await this.criteriaService.restoreToUnit(body.criterionId, body.businessUnit);
    return { message: 'Critério restaurado para a unidade com sucesso' };
  }
}
