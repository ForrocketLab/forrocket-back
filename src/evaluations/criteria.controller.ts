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
} from '@nestjs/swagger';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto, UpdateCriterionDto, CriterionDto } from './dto/criteria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

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
  ): Promise<CriterionDto[]> {
    if (pillar) {
      return this.criteriaService.findByPillar(pillar);
    }

    if (requiredOnly) {
      return this.criteriaService.findRequired();
    }

    if (optionalOnly) {
      return this.criteriaService.findOptional();
    }

    return this.criteriaService.findAll();
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
    @CurrentUser() user: User,
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
    @CurrentUser() user: User,
  ): Promise<CriterionDto> {
    return this.criteriaService.update(id, updateCriterionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover critério permanentemente',
    description: `
      Remove um critério permanentemente do sistema.
      
      **⚠️ ATENÇÃO:**
      - Esta operação é irreversível
      - Só permite remoção se o critério não estiver sendo usado em avaliações
      - Se estiver sendo usado, altere a obrigatoriedade ao invés de remover
      
      **Alternativa recomendada:**
      - Use PATCH /api/criteria/:id/make-optional para tornar opcional
      - Mantém histórico e dados consistentes
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do critério',
    example: 'sentimento-de-dono',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critério removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critério não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Critério está sendo usado em avaliações e não pode ser removido',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    await this.criteriaService.remove(id);
    return {
      message: 'Critério removido permanentemente com sucesso.',
    };
  }

  @Patch(':id/toggle-required')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alternar obrigatoriedade do critério (Toggle)',
    description: `
      Alterna a obrigatoriedade de um critério no preenchimento dos formulários.
      
      **Comportamento:**
      - Se o critério está obrigatório (isRequired: true) → torna opcional (isRequired: false)
      - Se o critério está opcional (isRequired: false) → torna obrigatório (isRequired: true)
      - O critério continuará aparecendo no formulário (sempre aparece)
      - Funciona como um interruptor (toggle) para facilitar a gestão
      
      **Casos de uso:**
      - Critérios de gestão que podem ser opcionais para alguns colaboradores
      - Ajustar formulários conforme a necessidade do momento
      - Facilitar mudanças rápidas sem ter que usar dois endpoints diferentes
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do critério',
    example: 'gestao-gente',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Obrigatoriedade do critério alternada com sucesso',
    type: CriterionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critério não encontrado',
  })
  async toggleRequired(@Param('id') id: string, @CurrentUser() user: User): Promise<CriterionDto> {
    return this.criteriaService.toggleRequired(id);
  }
}
