import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TestSummaryDto {
  @ApiProperty({
    description: 'Texto da avaliação para extrair o summary',
    example:
      'Os colaboradores apresentaram performance variada. João teve nota 3.2, Maria 4.1, e Pedro 2.8. Alguns pontos de melhoria incluem comunicação e gestão de tempo.',
  })
  @IsString()
  @IsNotEmpty()
  evaluationText: string;
}

export class SummaryResponseDto {
  @ApiProperty({
    description: 'Summary extraído da avaliação',
    example:
      'Nenhum colaborador alcançou o status de alto desempenho (nota 4.5+). Isso indica ou uma evitação de inflação nas notas ou um problema fundamental na aquisição ou desenvolvimento de talentos.',
  })
  summary: string;
}

export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Status do serviço',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Mensagem descritiva do status',
    example: 'GenAI Service está funcionando corretamente',
  })
  message: string;
}
