import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsNotEmpty, IsInt } from 'class-validator';

/**
 * DTO para criação de avaliação de gestor para liderado
 * Inclui os 5 critérios de comportamento obrigatoriamente
 */
export class CreateManagerAssessmentDto {
  @ApiProperty({
    description: 'ID do colaborador sendo avaliado',
    example: 'cluid123456789',
  })
  @IsString()
  @IsNotEmpty()
  evaluatedUserId: string;

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
      'O colaborador demonstra responsabilidade pelos resultados da equipe e toma iniciativa em projetos importantes.',
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
    example: 'Mantém-se firme e positivo diante de desafios, adaptando-se bem a mudanças.',
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
      'Mantém organização pessoal, planeja bem as atividades e gerencia eficientemente o tempo.',
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
      'Demonstra curiosidade, busca constantemente novos conhecimentos e aplica o que aprende.',
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
      'Trabalha bem em equipe, colabora ativamente, compartilha conhecimento e ajuda colegas.',
  })
  @IsString()
  @IsNotEmpty()
  teamPlayerJustification: string;

  // ==========================================
  // PILAR: EXECUÇÃO (4 critérios)
  // ==========================================

  @ApiProperty({
    description: 'Nota para Qualidade de Entrega (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  entregarComQualidadeScore: number;

  @ApiProperty({
    description: 'Justificativa para Qualidade de Entrega',
    example:
      'Entrega trabalhos com alta qualidade, atenção aos detalhes e seguindo padrões estabelecidos',
  })
  @IsString()
  @IsNotEmpty()
  entregarComQualidadeJustification: string;

  @ApiProperty({
    description: 'Nota para Cumprimento de Prazos (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  atenderPrazosScore: number;

  @ApiProperty({
    description: 'Justificativa para Cumprimento de Prazos',
    example: 'Cumpre prazos estabelecidos, gerencia bem o tempo e comunica antecipadamente possíveis atrasos.',
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
    example: 'Otimiza recursos, encontra soluções eficientes e maximiza resultados com recursos limitados.',
  })
  @IsString()
  @IsNotEmpty()
  fazerMaisMenosJustification: string;

  @ApiProperty({
    description: 'Nota para Pensar Fora da Caixa (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  pensarForaCaixaScore: number;

  @ApiProperty({
    description: 'Justificativa para Pensar Fora da Caixa',
    example: 'Demonstra criatividade, propõe soluções inovadoras e aborda problemas de forma não convencional.',
  })
  @IsString()
  @IsNotEmpty()
  pensarForaCaixaJustification: string;
}
