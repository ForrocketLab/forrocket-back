import { ApiProperty } from '@nestjs/swagger';

export interface ClimateSentimentAnalysisData {
  cycle: string;
  totalAssessments: number;
  criteria: {
    id: string;
    name: string;
    averageScore: number;
    totalResponses: number;
    justifications: string[];
  }[];
}

export class ClimateSentimentAnalysisResponseDto {
  @ApiProperty({
    description: 'Análise de sentimento geral do clima organizacional',
    example: 'A análise revela um clima organizacional predominantemente positivo...',
  })
  sentimentAnalysis: string;

  @ApiProperty({
    description: 'Dicas e recomendações para melhorar o clima organizacional',
    example: '1. Implementar programas de reconhecimento...',
  })
  improvementTips: string;

  @ApiProperty({
    description: 'Pontos fortes identificados',
    example: 'Relacionamento entre colegas é muito positivo...',
  })
  strengths: string;

  @ApiProperty({
    description: 'Áreas que precisam de atenção',
    example: 'Carga de trabalho e equilíbrio precisam de atenção...',
  })
  areasOfConcern: string;

  @ApiProperty({
    description: 'Score geral de sentimento (0-100)',
    example: 75,
  })
  overallSentimentScore: number;

  @ApiProperty({
    description: 'Ciclo analisado',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Total de avaliações consideradas',
    example: 45,
  })
  totalAssessments: number;

  @ApiProperty({
    description: 'Data de geração da análise',
    example: '2025-01-15T10:30:00Z',
  })
  generatedAt: string;
} 