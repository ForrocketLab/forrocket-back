import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsNotEmpty, IsUUID } from 'class-validator';

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
}
