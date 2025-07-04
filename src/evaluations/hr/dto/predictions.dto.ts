import { ApiProperty } from '@nestjs/swagger';

export class PredictionsDto {
  @ApiProperty({
    description: 'Previsão para a próxima avaliação',
    example: 4.2,
  })
  nextEvaluationPrediction: number;

  @ApiProperty({
    description: 'Nível de confiança da previsão (0-100)',
    example: 85,
  })
  confidenceLevel: number;

  @ApiProperty({
    description: 'Áreas que precisam de melhoria',
    example: ['Comunicação', 'Organização'],
  })
  improvementAreas: string[];

  @ApiProperty({
    description: 'Pontos fortes identificados',
    example: ['Liderança', 'Inovação'],
  })
  strengths: string[];
} 