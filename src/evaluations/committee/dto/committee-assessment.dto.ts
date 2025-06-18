import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCommitteeAssessmentDto {
  @ApiProperty({
    description: 'ID do colaborador sendo avaliado pelo comitê',
    example: 'cmc2fyb0i0003tzh4bielb765',
  })
  @IsString()
  @IsNotEmpty()
  evaluatedUserId: string;

  @ApiProperty({
    description: 'Nota final de equalização (1 a 5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  finalScore: number;

  @ApiProperty({
    description: 'Justificativa da equalização baseada nas avaliações anteriores',
    example:
      'Com base nas avaliações recebidas (autoavaliação: 4, gestor: 3, 360: 4), o comitê considera que a nota 4 reflete adequadamente o desempenho, considerando os pontos fortes em liderança técnica e oportunidades de melhoria em comunicação.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais do comitê para registro',
    example:
      'Colaborador demonstra potencial para crescimento. Recomenda-se foco em desenvolvimento de soft skills no próximo ciclo.',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}

export class UpdateCommitteeAssessmentDto {
  @ApiPropertyOptional({
    description: 'Nota final de equalização (1 a 5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  finalScore?: number;

  @ApiPropertyOptional({
    description: 'Justificativa da equalização',
    example: 'Justificativa atualizada baseada em nova análise das avaliações.',
  })
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais do comitê',
    example: 'Observações atualizadas.',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}

export class SubmitCommitteeAssessmentDto {
  @ApiProperty({
    description: 'Tipo de avaliação sendo submetida',
    example: 'committee',
    enum: ['committee'],
  })
  @IsString()
  @IsNotEmpty()
  evaluationType: 'committee';
}

export class CollaboratorEvaluationSummaryDto {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'clz1x2y3z4w5v6u7t8s9r0',
  })
  userId: string;

  @ApiProperty({
    description: 'Nome do colaborador',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do colaborador',
    example: 'joao.silva@rocketcorp.com',
  })
  email: string;

  @ApiProperty({
    description: 'Cargo do colaborador',
    example: 'Desenvolvedor Full Stack',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Pleno',
  })
  seniority: string;

  @ApiProperty({
    description: 'Autoavaliação do colaborador',
    example: null,
    nullable: true,
  })
  selfAssessment: any;

  @ApiProperty({
    description: 'Avaliações 360 recebidas',
    isArray: true,
    example: [],
  })
  assessments360Received: any[];

  @ApiProperty({
    description: 'Avaliações de gestor recebidas',
    isArray: true,
    example: [],
  })
  managerAssessmentsReceived: any[];

  @ApiProperty({
    description: 'Avaliações de mentoring recebidas',
    isArray: true,
    example: [],
  })
  mentoringAssessmentsReceived: any[];

  @ApiProperty({
    description: 'Feedbacks de referência recebidos',
    isArray: true,
    example: [],
  })
  referenceFeedbacksReceived: any[];

  @ApiProperty({
    description: 'Avaliação de comitê existente (se houver)',
    example: null,
    nullable: true,
  })
  committeeAssessment: any;

  @ApiProperty({
    description: 'Resumo das avaliações',
    example: {
      totalAssessmentsReceived: 5,
      hasCommitteeAssessment: false,
      isEqualizationComplete: false,
    },
  })
  summary: {
    totalAssessmentsReceived: number;
    hasCommitteeAssessment: boolean;
    isEqualizationComplete: boolean;
  };
}
