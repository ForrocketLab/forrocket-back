import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, Min, Max, IsNotEmpty, ValidateNested, IsInt, IsOptional } from 'class-validator';

/**
 * DTO para uma resposta de critério (score + justificativa)
 */
export class CriterionAnswerDto {
  @ApiProperty({
    description: 'Nota para o critério (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @ApiProperty({
    description: 'Justificativa para o critério',
    example: 'Demonstro responsabilidade pelos resultados da equipe.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
}

/**
 * DTO para criação de autoavaliação completa
 * Aceita critérios por ID com score e justificativa
 */
export class CreateSelfAssessmentDto {
  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: '2025.1',
  })
  @IsString()
  @IsNotEmpty()
  cycleId: string;

  // ==========================================
  // PILAR: COMPORTAMENTO (5 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Sentimento de Dono',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'sentimento-de-dono': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Resiliência nas Adversidades',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'resiliencia-adversidades': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Organização no Trabalho',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'organizacao-trabalho': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Capacidade de Aprender',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'capacidade-aprender': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Ser "Team Player"',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'team-player': CriterionAnswerDto;

  // ==========================================
  // PILAR: EXECUÇÃO (4 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Entregar com Qualidade',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'entregar-qualidade': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Atender Prazos',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'atender-prazos': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Fazer Mais com Menos',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'fazer-mais-menos': CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Pensar Fora da Caixa',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'pensar-fora-caixa': CriterionAnswerDto;

  // ==========================================
  // PILAR: EVOLUÇÃO (1 critério)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Evolução Rocket Corp',
    type: CriterionAnswerDto,
  })
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'evolucao-rocket-corp': CriterionAnswerDto;

  // ==========================================
  // PILAR: GESTÃO E LIDERANÇA (2 critérios - OPCIONAL para não-gestores)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Gestão de Gente (opcional - apenas para gestores)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'gestao-gente'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Gestão de Resultados (opcional - apenas para gestores)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'gestao-resultados'?: CriterionAnswerDto;
}
