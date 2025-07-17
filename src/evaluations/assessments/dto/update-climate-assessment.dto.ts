import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';

/**
 * DTO para atualização incremental de avaliação de clima organizacional
 * Todos os campos são opcionais para permitir atualizações parciais
 */
export class UpdateClimateAssessmentDto {
  // ==========================================
  // CRITÉRIOS DE CLIMA ORGANIZACIONAL (4 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Nota para Relacionamento com a Liderança (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  relacionamentoLiderancaScore?: number;

  @ApiProperty({
    description: 'Justificativa para Relacionamento com a Liderança',
    example: 'Me sinto respeitado e apoiado pela minha liderança direta, que sempre está disponível para ouvir minhas preocupações.',
    required: false,
  })
  @IsOptional()
  @IsString()
  relacionamentoLiderancaJustification?: string;

  @ApiProperty({
    description: 'Nota para Relacionamento com Colegas (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  relacionamentoColegasScore?: number;

  @ApiProperty({
    description: 'Justificativa para Relacionamento com Colegas',
    example: 'A colaboração e respeito entre colegas é excelente, criando um ambiente de trabalho muito positivo.',
    required: false,
  })
  @IsOptional()
  @IsString()
  relacionamentoColegasJustification?: string;

  @ApiProperty({
    description: 'Nota para Reconhecimento e Valorização (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  reconhecimentoValorizacaoScore?: number;

  @ApiProperty({
    description: 'Justificativa para Reconhecimento e Valorização',
    example: 'Sinto que meu trabalho é reconhecido e valorizado pela empresa através de feedbacks e oportunidades de crescimento.',
    required: false,
  })
  @IsOptional()
  @IsString()
  reconhecimentoValorizacaoJustification?: string;

  @ApiProperty({
    description: 'Nota para Carga de Trabalho e Equilíbrio (1 a 5)',
    example: 3,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cargaTrabalhoEquilibrioScore?: number;

  @ApiProperty({
    description: 'Justificativa para Carga de Trabalho e Equilíbrio',
    example: 'A carga de trabalho está equilibrada, permitindo um bom balanço entre vida profissional e pessoal.',
    required: false,
  })
  @IsOptional()
  @IsString()
  cargaTrabalhoEquilibrioJustification?: string;
} 