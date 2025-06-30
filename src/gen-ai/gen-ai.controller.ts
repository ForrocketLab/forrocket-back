import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthCheckResponseDto, SummaryResponseDto, TestSummaryDto } from './dto/gen-ai-test.dto';
import { GenAiService } from './gen-ai.service';

@ApiTags('gen-ai')
@Controller('gen-ai')
export class GenAiController {
  constructor(private readonly genAiService: GenAiService) {}

  @Post('test-summary')
  @ApiOperation({ summary: 'Testa a geração de summary a partir de um texto de avaliação' })
  @ApiResponse({ status: 200, description: 'Summary gerado com sucesso', type: SummaryResponseDto })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async testSummary(@Body() body: TestSummaryDto): Promise<SummaryResponseDto> {
    const summary = await this.genAiService.getSummary(body.evaluationText);
    return { summary };
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Verifica se o serviço está funcionando' })
  @ApiResponse({
    status: 200,
    description: 'Serviço funcionando corretamente',
    type: HealthCheckResponseDto,
  })
  healthCheck(): HealthCheckResponseDto {
    return {
      status: 'ok',
      message: 'GenAI Service está funcionando corretamente',
    };
  }
}
