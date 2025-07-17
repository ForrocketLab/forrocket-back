import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateMentorAssessmentDto {
  @ApiProperty({
    description: 'ID do colaborador sendo avaliado pelo mentor',
    example: 'cluid123456789',
  })
  @IsString()
  @IsNotEmpty()
  evaluatedUserId: string;

  // Comportamento
  @ApiProperty({
    description: 'Nota para Sentimento de Dono (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  sentimentoDeDonoScore: number;

  @ApiProperty({
    description: 'Justificativa para Sentimento de Dono',
    example: 'Demonstra grande responsabilidade pelos resultados do projeto...',
  })
  @IsString()
  @IsNotEmpty()
  sentimentoDeDonoJustification: string;

  @ApiProperty({
    description: 'Nota para Resiliência e Adversidades (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  resilienciaAdversidadesScore: number;

  @ApiProperty({
    description: 'Justificativa para Resiliência e Adversidades',
    example: 'Mantém-se focado mesmo em situações desafiadoras...',
  })
  @IsString()
  @IsNotEmpty()
  resilienciaAdversidadesJustification: string;

  @ApiProperty({
    description: 'Nota para Organização do Trabalho (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  organizacaoTrabalhoScore: number;

  @ApiProperty({
    description: 'Justificativa para Organização do Trabalho',
    example: 'Muito organizado, sempre entrega no prazo...',
  })
  @IsString()
  @IsNotEmpty()
  organizacaoTrabalhoJustification: string;

  @ApiProperty({
    description: 'Nota para Capacidade de Aprender (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  capacidadeAprenderScore: number;

  @ApiProperty({
    description: 'Justificativa para Capacidade de Aprender',
    example: 'Aprende rapidamente novas tecnologias...',
  })
  @IsString()
  @IsNotEmpty()
  capacidadeAprenderJustification: string;

  @ApiProperty({
    description: 'Nota para Team Player (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  teamPlayerScore: number;

  @ApiProperty({
    description: 'Justificativa para Team Player',
    example: 'Colabora bem com a equipe, sempre disposto a ajudar...',
  })
  @IsString()
  @IsNotEmpty()
  teamPlayerJustification: string;

  // Execução
  @ApiProperty({
    description: 'Nota para Entregar com Qualidade (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  entregarComQualidadeScore: number;

  @ApiProperty({
    description: 'Justificativa para Entregar com Qualidade',
    example: 'Sempre entrega código limpo e bem testado...',
  })
  @IsString()
  @IsNotEmpty()
  entregarComQualidadeJustification: string;

  @ApiProperty({
    description: 'Nota para Atender Prazos (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  atenderPrazosScore: number;

  @ApiProperty({
    description: 'Justificativa para Atender Prazos',
    example: 'Sempre cumpre os prazos estabelecidos...',
  })
  @IsString()
  @IsNotEmpty()
  atenderPrazosJustification: string;

  @ApiProperty({
    description: 'Nota para Fazer Mais com Menos (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  fazerMaisMenosScore: number;

  @ApiProperty({
    description: 'Justificativa para Fazer Mais com Menos',
    example: 'Otimiza processos e busca eficiência...',
  })
  @IsString()
  @IsNotEmpty()
  fazerMaisMenosJustification: string;

  @ApiProperty({
    description: 'Nota para Pensar Fora da Caixa (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  pensarForaCaixaScore: number;

  @ApiProperty({
    description: 'Justificativa para Pensar Fora da Caixa',
    example: 'Propõe soluções criativas para problemas complexos...',
  })
  @IsString()
  @IsNotEmpty()
  pensarForaCaixaJustification: string;

  // Gestão (para níveis seniores)
  @ApiProperty({
    description: 'Nota para Gestão de Gente (1-5) - Opcional para níveis seniores',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  gestaoGenteScore?: number;

  @ApiProperty({
    description: 'Justificativa para Gestão de Gente - Opcional',
    example: 'Demonstra liderança e desenvolve bem a equipe...',
    required: false,
  })
  @IsString()
  gestaoGenteJustification?: string;

  @ApiProperty({
    description: 'Nota para Gestão de Resultados (1-5) - Opcional para níveis seniores',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  gestaoResultadosScore?: number;

  @ApiProperty({
    description: 'Justificativa para Gestão de Resultados - Opcional',
    example: 'Foca em resultados e consegue entregar metas...',
    required: false,
  })
  @IsString()
  gestaoResultadosJustification?: string;

  @ApiProperty({
    description: 'Nota para Evolução Rocket (1-5) - Opcional para níveis seniores',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  evolucaoRocketScore?: number;

  @ApiProperty({
    description: 'Justificativa para Evolução Rocket - Opcional',
    example: 'Representa bem os valores da empresa...',
    required: false,
  })
  @IsString()
  evolucaoRocketJustification?: string;
}
