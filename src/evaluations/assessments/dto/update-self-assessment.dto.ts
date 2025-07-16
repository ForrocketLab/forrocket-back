import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { CriterionAnswerDto } from './create-self-assessment.dto';

/**
 * DTO para atualização incremental de autoavaliação
 * Aceita critérios por ID com score e justificativa (todos opcionais)
 */
export class UpdateSelfAssessmentDto {
  @ApiProperty({
    description: 'ID do ciclo de avaliação',
    example: '2025.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cycleId?: string;

  // ==========================================
  // PILAR: COMPORTAMENTO (5 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Sentimento de Dono (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'sentimento-de-dono'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Resiliência nas Adversidades (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'resiliencia-adversidades'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Organização no Trabalho (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'organizacao-trabalho'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Capacidade de Aprender (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'capacidade-aprender'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Ser "Team Player" (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'team-player'?: CriterionAnswerDto;

  // ==========================================
  // PILAR: EXECUÇÃO (4 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Entregar com Qualidade (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'entregar-qualidade'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Atender Prazos (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'atender-prazos'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Fazer Mais com Menos (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'fazer-mais-menos'?: CriterionAnswerDto;

  @ApiProperty({
    description: 'Resposta para Pensar Fora da Caixa (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'pensar-fora-caixa'?: CriterionAnswerDto;

  // ==========================================
  // PILAR: EVOLUÇÃO (1 critério)
  // ==========================================

  @ApiProperty({
    description: 'Resposta para Evolução Rocket Corp (opcional)',
    type: CriterionAnswerDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CriterionAnswerDto)
  'evolucao-rocket-corp'?: CriterionAnswerDto;

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
