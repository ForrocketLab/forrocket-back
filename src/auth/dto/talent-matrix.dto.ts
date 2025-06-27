import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class TalentMatrixPositionDto {
  @ApiProperty({ description: 'ID do colaborador' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Nome do colaborador' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cargo do colaborador' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ description: 'Unidade de negócio' })
  @IsString()
  businessUnit: string;

  @ApiProperty({ description: 'Senioridade' })
  @IsString()
  seniority: string;

  @ApiProperty({ description: 'Score de performance (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  performanceScore: number;

  @ApiProperty({ description: 'Score de potencial (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  potentialScore: number;

  @ApiProperty({ description: 'Categoria na matriz (1-9)' })
  @IsNumber()
  @Min(1)
  @Max(9)
  matrixPosition: number;

  @ApiProperty({ description: 'Label da categoria' })
  @IsString()
  matrixLabel: string;

  @ApiProperty({ description: 'Cor da categoria para visualização' })
  @IsString()
  matrixColor: string;

  @ApiProperty({ description: 'Iniciais do colaborador para exibição' })
  @IsString()
  initials: string;

  @ApiProperty({ description: 'Dados detalhados das avaliações', required: false })
  @IsOptional()
  evaluationDetails?: {
    selfAssessmentScore?: number;
    managerAssessmentScore?: number;
    assessment360Score?: number;
    committeeScore?: number;
    totalEvaluations: number;
  };
}

export class TalentMatrixStatsDto {
  @ApiProperty({ description: 'Total de colaboradores na matriz' })
  @IsNumber()
  totalCollaborators: number;

  @ApiProperty({ description: 'Distribuição por categoria' })
  categoryDistribution: Record<string, number>;

  @ApiProperty({ description: 'Distribuição por unidade de negócio' })
  businessUnitDistribution: Record<string, number>;

  @ApiProperty({ description: 'Colaboradores de alta performance e alto potencial' })
  @IsNumber()
  topTalents: number;

  @ApiProperty({ description: 'Colaboradores que precisam de atenção' })
  @IsNumber()
  lowPerformers: number;
}

export class TalentMatrixResponseDto {
  @ApiProperty({ description: 'Ciclo de avaliação' })
  @IsString()
  cycle: string;

  @ApiProperty({ description: 'Posições dos colaboradores na matriz', type: [TalentMatrixPositionDto] })
  positions: TalentMatrixPositionDto[];

  @ApiProperty({ description: 'Estatísticas da matriz' })
  stats: TalentMatrixStatsDto;

  @ApiProperty({ description: 'Data de geração dos dados' })
  generatedAt: Date;

  @ApiProperty({ description: 'Indica se há dados insuficientes para gerar a matriz', required: false })
  @IsOptional()
  hasInsufficientData?: boolean;

  @ApiProperty({ description: 'Mensagem explicativa quando há dados insuficientes', required: false })
  @IsOptional()
  message?: string;
} 