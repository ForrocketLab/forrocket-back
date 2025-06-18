import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, Min, Max, IsNotEmpty, ValidateNested, IsInt } from 'class-validator';

/**
 * DTO para criação de autoavaliação completa
 * Inclui todos os 12 critérios obrigatoriamente
 */
export class CreateSelfAssessmentDto {
  // Campo cycle removido - será usado automaticamente o ciclo ativo

  // ==========================================
  // PILAR: COMPORTAMENTO (5 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Nota para Sentimento de Dono (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  sentimentoDeDonoScore: number;

  @ApiProperty({
    description: 'Justificativa para Sentimento de Dono',
    example:
      'Demonstro responsabilidade pelos resultados da equipe e tomo iniciativa em projetos importantes.',
  })
  @IsString()
  @IsNotEmpty()
  sentimentoDeDonoJustification: string;

  @ApiProperty({
    description: 'Nota para Resiliência nas Adversidades (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  resilienciaAdversidadesScore: number;

  @ApiProperty({
    description: 'Justificativa para Resiliência nas Adversidades',
    example: 'Mantenho-me firme e positivo diante de desafios, adaptando-me bem a mudanças.',
  })
  @IsString()
  @IsNotEmpty()
  resilienciaAdversidadesJustification: string;

  @ApiProperty({
    description: 'Nota para Organização no Trabalho (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  organizacaoTrabalhoScore: number;

  @ApiProperty({
    description: 'Justificativa para Organização no Trabalho',
    example:
      'Mantenho organização pessoal, planejo bem as atividades e gerencio eficientemente o tempo.',
  })
  @IsString()
  @IsNotEmpty()
  organizacaoTrabalhoJustification: string;

  @ApiProperty({
    description: 'Nota para Capacidade de Aprender (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  capacidadeAprenderScore: number;

  @ApiProperty({
    description: 'Justificativa para Capacidade de Aprender',
    example:
      'Demonstro curiosidade, busco constantemente novos conhecimentos e aplico o que aprendo.',
  })
  @IsString()
  @IsNotEmpty()
  capacidadeAprenderJustification: string;

  @ApiProperty({
    description: 'Nota para Ser "Team Player" (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  teamPlayerScore: number;

  @ApiProperty({
    description: 'Justificativa para Ser "Team Player"',
    example:
      'Trabalho bem em equipe, colaboro ativamente, compartilho conhecimento e ajudo colegas.',
  })
  @IsString()
  @IsNotEmpty()
  teamPlayerJustification: string;

  // ==========================================
  // PILAR: EXECUÇÃO (4 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Nota para Entregar com Qualidade (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  entregarQualidadeScore: number;

  @ApiProperty({
    description: 'Justificativa para Entregar com Qualidade',
    example:
      'Entrego trabalhos com alta qualidade, atenção aos detalhes e seguindo padrões estabelecidos.',
  })
  @IsString()
  @IsNotEmpty()
  entregarQualidadeJustification: string;

  @ApiProperty({
    description: 'Nota para Atender aos Prazos (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  atenderPrazosScore: number;

  @ApiProperty({
    description: 'Justificativa para Atender aos Prazos',
    example:
      'Cumpro prazos estabelecidos, gerencio bem o tempo e comunico antecipadamente possíveis atrasos.',
  })
  @IsString()
  @IsNotEmpty()
  atenderPrazosJustification: string;

  @ApiProperty({
    description: 'Nota para Fazer Mais com Menos (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  fazerMaisMenosScore: number;

  @ApiProperty({
    description: 'Justificativa para Fazer Mais com Menos',
    example:
      'Otimizo recursos, encontro soluções eficientes e maximizo resultados com recursos limitados.',
  })
  @IsString()
  @IsNotEmpty()
  fazerMaisMenosJustification: string;

  @ApiProperty({
    description: 'Nota para Pensar Fora da Caixa (1 a 5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  pensarForaCaixaScore: number;

  @ApiProperty({
    description: 'Justificativa para Pensar Fora da Caixa',
    example:
      'Demonstro criatividade, proponho soluções inovadoras e abordo problemas de forma não convencional.',
  })
  @IsString()
  @IsNotEmpty()
  pensarForaCaixaJustification: string;

  // ==========================================
  // PILAR: GESTÃO E LIDERANÇA (3 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Nota para Gente (1 a 5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  gestaoGenteScore: number;

  @ApiProperty({
    description: 'Justificativa para Gente',
    example:
      'Desenvolvo pessoas, inspiro e motivo a equipe, promovo um ambiente colaborativo e de crescimento.',
  })
  @IsString()
  @IsNotEmpty()
  gestaoGenteJustification: string;

  @ApiProperty({
    description: 'Nota para Resultados (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  gestaoResultadosScore: number;

  @ApiProperty({
    description: 'Justificativa para Resultados',
    example:
      'Foco na entrega de resultados, defino metas claras e acompanho o desempenho da equipe.',
  })
  @IsString()
  @IsNotEmpty()
  gestaoResultadosJustification: string;

  @ApiProperty({
    description: 'Nota para Evolução da Rocket Corp (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  evolucaoRocketScore: number;

  @ApiProperty({
    description: 'Justificativa para Evolução da Rocket Corp',
    example:
      'Contribuo ativamente para o crescimento e evolução da empresa, proponho melhorias e inovações.',
  })
  @IsString()
  @IsNotEmpty()
  evolucaoRocketJustification: string;
}
