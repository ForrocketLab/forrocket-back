import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClimateService } from './climate.service';
import {
  CreateClimateAssessmentDto,
  UpdateClimateAssessmentDto,
  ClimateAssessmentConfigDto,
  ClimateAssessmentConfigResponseDto,
} from '../assessments/dto';
import { ClimateSentimentAnalysisResponseDto } from '../assessments/dto/climate-sentiment-analysis.dto';

@ApiTags('Avaliação de Clima Organizacional')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/evaluations/climate')
export class ClimateController {
  constructor(private readonly climateService: ClimateService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar avaliação de clima organizacional',
    description: 'Cria uma nova avaliação de clima organizacional para o usuário autenticado',
  })
  @ApiBody({ type: CreateClimateAssessmentDto })
  @ApiResponse({
    status: 201,
    description: 'Avaliação de clima criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou avaliação já existe',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar avaliações de clima',
  })
  async createClimateAssessment(
    @Request() req: any,
    @Body() dto: CreateClimateAssessmentDto,
  ) {
    return this.climateService.createClimateAssessment(req.user.id, dto);
  }

  @Put()
  @ApiOperation({
    summary: 'Atualizar avaliação de clima organizacional',
    description: 'Atualiza a avaliação de clima organizacional existente do usuário autenticado',
  })
  @ApiBody({ type: UpdateClimateAssessmentDto })
  @ApiResponse({
    status: 200,
    description: 'Avaliação de clima atualizada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou avaliação já submetida',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar avaliações de clima',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação de clima não encontrada',
  })
  async updateClimateAssessment(
    @Request() req: any,
    @Body() dto: UpdateClimateAssessmentDto,
  ) {
    return this.climateService.updateClimateAssessment(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Buscar avaliação de clima organizacional',
    description: 'Busca a avaliação de clima organizacional do usuário autenticado para o ciclo ativo',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliação de clima encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar avaliações de clima',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação de clima não encontrada',
  })
  async getClimateAssessment(@Request() req: any) {
    return this.climateService.getClimateAssessment(req.user.id);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submeter avaliação de clima organizacional',
    description: 'Submete a avaliação de clima organizacional do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliação de clima submetida com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Avaliação incompleta ou já submetida',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar avaliações de clima',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação de clima não encontrada',
  })
  async submitClimateAssessment(@Request() req: any) {
    return this.climateService.submitClimateAssessment(req.user.id);
  }

  @Post('config')
  @ApiOperation({
    summary: 'Configurar avaliação de clima organizacional (RH)',
    description: 'Ativa ou desativa a avaliação de clima organizacional para o ciclo ativo (apenas RH)',
  })
  @ApiBody({ type: ClimateAssessmentConfigDto })
  @ApiResponse({
    status: 201,
    description: 'Configuração de clima atualizada com sucesso',
    type: ClimateAssessmentConfigResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas RH pode configurar avaliações de clima',
  })
  async configureClimateAssessment(
    @Request() req: any,
    @Body() dto: ClimateAssessmentConfigDto,
  ): Promise<ClimateAssessmentConfigResponseDto> {
    return this.climateService.configureClimateAssessment(req.user.id, dto);
  }

  @Get('config')
  @ApiOperation({
    summary: 'Buscar configuração da avaliação de clima',
    description: 'Busca a configuração atual da avaliação de clima organizacional',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuração encontrada',
    type: ClimateAssessmentConfigResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Configuração não encontrada',
  })
  async getClimateAssessmentConfig(): Promise<ClimateAssessmentConfigResponseDto | null> {
    return this.climateService.getClimateAssessmentConfig();
  }

  @Get('cycles')
  @ApiOperation({
    summary: 'Listar ciclos com avaliação de clima',
    description: 'Retorna todos os ciclos que possuem configuração de clima organizacional.'
  })
  async getClimateCycles() {
    return this.climateService.getClimateCycles();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Buscar estatísticas da avaliação de clima (RH)',
    description: 'Busca estatísticas da avaliação de clima organizacional (apenas RH). Se cycle for informado, busca do ciclo correspondente.'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas encontradas',
  })
  @ApiResponse({
    status: 400,
    description: 'Avaliação de clima não está ativa',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas RH pode acessar estatísticas de clima',
  })
  async getClimateAssessmentStats(@Request() req: any, @Query('cycle') cycle?: string) {
    return this.climateService.getClimateAssessmentStats(req.user.id, cycle);
  }

  @Post('sentiment-analysis')
  @ApiOperation({
    summary: 'Gerar análise de sentimento da avaliação de clima (RH)',
    description: 'Gera análise de sentimento e recomendações usando IA (apenas RH)',
  })
  @ApiResponse({
    status: 201,
    description: 'Análise de sentimento gerada com sucesso',
    type: ClimateSentimentAnalysisResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Avaliação de clima não está ativa ou não há avaliações submetidas',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas RH pode gerar análise de sentimento',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async generateClimateSentimentAnalysis(@Request() req: any): Promise<ClimateSentimentAnalysisResponseDto> {
    return this.climateService.generateClimateSentimentAnalysis(req.user.id);
  }

  @Get('sentiment-analysis')
  @ApiOperation({
    summary: 'Buscar análise de sentimento da avaliação de clima (RH)',
    description: 'Busca análise de sentimento já gerada para o ciclo atual ou para o ciclo informado (apenas RH)'
  })
  @ApiResponse({
    status: 200,
    description: 'Análise encontrada',
    type: ClimateSentimentAnalysisResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhuma análise encontrada para o ciclo',
  })
  async getClimateSentimentAnalysis(@Request() req: any, @Query('cycle') cycle?: string): Promise<ClimateSentimentAnalysisResponseDto | null> {
    return this.climateService.getClimateSentimentAnalysis(req.user.id, cycle);
  }
} 