import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { OkrService } from './okr.service';
import { ObjectiveService } from './objective.service'; 
import { KeyResultService } from './key-result.service';
import { 
  CreateOKRDto, 
  UpdateOKRDto, 
  CreateObjectiveDto, 
  UpdateObjectiveDto, 
  CreateKeyResultDto, 
  UpdateKeyResultDto,
  OKRResponseDto,
  OKRSummaryDto,
  ObjectiveResponseDto,
  KeyResultResponseDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';

/**
 * Controller responsável pelos endpoints de OKRs
 */
@ApiTags('OKRs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels( 
  CreateOKRDto,
  UpdateOKRDto,
  CreateObjectiveDto,
  UpdateObjectiveDto,
  CreateKeyResultDto,
  UpdateKeyResultDto,
  OKRResponseDto,
  OKRSummaryDto,
  ObjectiveResponseDto,
  KeyResultResponseDto
)
@Controller('api/okrs')
export class OKRsController {
  constructor(
    private readonly okrService: OkrService,
    private readonly objectiveService: ObjectiveService, 
    private readonly keyResultService: KeyResultService, 
  ) {}

  // ==========================================
  // ENDPOINTS DE OKR
  // ==========================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo OKR',
    description: 'Permite que um colaborador crie um novo OKR para um trimestre/ano específico',
  })
  @ApiResponse({
    status: 201,
    description: 'OKR criado com sucesso',
    type: OKRResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um OKR para o trimestre/ano especificado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createOKR(
    @CurrentUser() user: User,
    @Body() createOKRDto: CreateOKRDto,
  ): Promise<OKRResponseDto> {
    return this.okrService.createOKR(user.id, createOKRDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar OKRs do usuário',
    description: 'Busca todos os OKRs do colaborador logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de OKRs do usuário',
    type: [OKRSummaryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getUserOKRs(@CurrentUser() user: User): Promise<OKRSummaryDto[]> {
    return this.okrService.getUserOKRs(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar OKR específico',
    description: 'Busca um OKR específico com todos os detalhes',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do OKR',
    example: 'okr1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do OKR',
    type: OKRResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'OKR não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getOKRById(@Param('id') id: string): Promise<OKRResponseDto> {
    return this.okrService.getOKRById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar OKR',
    description: 'Atualiza um OKR existente do colaborador',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do OKR',
    example: 'okr1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'OKR atualizado com sucesso',
    type: OKRResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'OKR não encontrado ou sem permissão',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito com outro OKR existente',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async updateOKR(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateOKRDto: UpdateOKRDto,
  ): Promise<OKRResponseDto> {
    return this.okrService.updateOKR(id, user.id, updateOKRDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar OKR',
    description: 'Remove um OKR do colaborador',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do OKR',
    example: 'okr1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'OKR deletado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'OKR não encontrado ou sem permissão',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async deleteOKR(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    return this.okrService.deleteOKR(id, user.id);
  }

  // ==========================================
  // ENDPOINTS DE OBJETIVOS
  // ==========================================

  @Post(':okrId/objectives')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar objetivo',
    description: 'Adiciona um novo objetivo a um OKR',
  })
  @ApiParam({
    name: 'okrId',
    description: 'ID do OKR',
    example: 'okr1234567890abcdef',
  })
  @ApiResponse({
    status: 201,
    description: 'Objetivo criado com sucesso',
    type: ObjectiveResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'OKR não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createObjective(
    @Param('okrId') okrId: string,
    @Body() createObjectiveDto: CreateObjectiveDto,
  ): Promise<ObjectiveResponseDto> {
    return this.objectiveService.createObjective(okrId, createObjectiveDto);
  }

  @Get('objectives/:id')
  @ApiOperation({
    summary: 'Buscar objetivo específico',
    description: 'Busca um objetivo específico com todos os detalhes',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do objetivo',
    example: 'obj1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do objetivo',
    type: ObjectiveResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getObjectiveById(@Param('id') id: string): Promise<ObjectiveResponseDto> {
    return this.objectiveService.getObjectiveById(id);
  }

  @Put('objectives/:id')
  @ApiOperation({
    summary: 'Atualizar objetivo',
    description: 'Atualiza um objetivo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do objetivo',
    example: 'obj1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Objetivo atualizado com sucesso',
    type: ObjectiveResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async updateObjective(
    @Param('id') id: string,
    @Body() updateObjectiveDto: UpdateObjectiveDto,
  ): Promise<ObjectiveResponseDto> {
    return this.objectiveService.updateObjective(id, updateObjectiveDto);
  }

  @Delete('objectives/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar objetivo',
    description: 'Remove um objetivo de um OKR',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do objetivo',
    example: 'obj1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Objetivo deletado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async deleteObjective(@Param('id') id: string): Promise<void> {
    return this.objectiveService.deleteObjective(id);
  }

  // ==========================================
  // ENDPOINTS DE KEY RESULTS
  // ==========================================

  @Post('objectives/:objectiveId/key-results')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar key result',
    description: 'Adiciona um novo key result a um objetivo',
  })
  @ApiParam({
    name: 'objectiveId',
    description: 'ID do objetivo',
    example: 'obj1234567890abcdef',
  })
  @ApiResponse({
    status: 201,
    description: 'Key result criado com sucesso',
    type: KeyResultResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Objetivo não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async createKeyResult(
    @Param('objectiveId') objectiveId: string,
    @Body() createKeyResultDto: CreateKeyResultDto,
  ): Promise<KeyResultResponseDto> {
    return this.keyResultService.createKeyResult(objectiveId, createKeyResultDto);
  }

  @Get('key-results/:id')
  @ApiOperation({
    summary: 'Buscar key result específico',
    description: 'Busca um key result específico com todos os detalhes',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do key result',
    example: 'kr1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do key result',
    type: KeyResultResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Key result não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getKeyResultById(@Param('id') id: string): Promise<KeyResultResponseDto> {
    return this.keyResultService.getKeyResultById(id);
  }

  @Put('key-results/:id')
  @ApiOperation({
    summary: 'Atualizar key result',
    description: 'Atualiza um key result existente e recalcula o progresso do objetivo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do key result',
    example: 'kr1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Key result atualizado com sucesso',
    type: KeyResultResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Key result não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async updateKeyResult(
    @Param('id') id: string,
    @Body() updateKeyResultDto: UpdateKeyResultDto,
  ): Promise<KeyResultResponseDto> {
    return this.keyResultService.updateKeyResult(id, updateKeyResultDto);
  }

  @Delete('key-results/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar key result',
    description: 'Remove um key result de um objetivo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do key result',
    example: 'kr1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Key result deletado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Key result não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async deleteKeyResult(@Param('id') id: string): Promise<void> {
    return this.keyResultService.deleteKeyResult(id);
  }
}