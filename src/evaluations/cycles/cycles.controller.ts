import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CyclesService } from './cycles.service';
import { EvaluationCycleDto } from './dto/evaluation-cycle.dto';

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
    description: 'Retorna o ciclo de avaliação atualmente ativo (status OPEN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciclo ativo retornado com sucesso',
    type: EvaluationCycleDto,
  })
  async getActiveCycle() {
    return this.cyclesService.getActiveCycle();
  }
} 