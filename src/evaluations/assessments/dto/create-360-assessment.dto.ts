import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

enum WorkAgainMotivation {
  STRONGLY_DISAGREE = 'STRONGLY_DISAGREE',
  PARTIALLY_DISAGREE = 'PARTIALLY_DISAGREE',
  NEUTRAL = 'NEUTRAL',
  PARTIALLY_AGREE = 'PARTIALLY_AGREE',
  STRONGLY_AGREE = 'STRONGLY_AGREE',
}

/**
 * DTO para criação de avaliação 360 graus
 */
export class Create360AssessmentDto {
  // Campo cycle removido - será usado automaticamente o ciclo ativo

  @ApiProperty({
    description: 'ID do colega que está sendo avaliado',
    example: 'user-456',
  })
  @IsString()
  @IsNotEmpty()
  evaluatedUserId: string;

  @ApiProperty({
    description: 'Nota geral atribuída ao colega (1 a 5 estrelas)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallScore: number;

  @ApiProperty({
    description: 'Pontos fortes do colega avaliado',
    example:
      'Excelente comunicação, sempre disposto a ajudar a equipe e demonstra grande conhecimento técnico.',
  })
  @IsString()
  @IsNotEmpty()
  strengths: string;

  @ApiProperty({
    description: 'Pontos de melhoria do colega avaliado',
    example: 'Poderia ser mais proativo em reuniões e compartilhar mais conhecimento com juniores.',
  })
  @IsString()
  @IsNotEmpty()
  improvements: string;

  @ApiProperty({
    description: 'Motivação para trabalhar novamente com o colega',
    enum: WorkAgainMotivation,
    example: WorkAgainMotivation.PARTIALLY_AGREE,
    required: false,
  })
  @IsEnum(WorkAgainMotivation)
  @IsOptional()
  workAgainMotivation?: WorkAgainMotivation;
}
