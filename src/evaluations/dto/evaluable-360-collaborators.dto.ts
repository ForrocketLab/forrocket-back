import { ApiProperty } from '@nestjs/swagger';
import { WorkAgainMotivation, AssessmentStatus } from '@prisma/client';

export class EvaluableCollaboratorUserDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@empresa.com',
  })
  email: string;

  @ApiProperty({
    description: 'Cargo do usuário',
    example: 'Desenvolvedor Senior',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Unidade de negócio do usuário',
    example: 'Tecnologia',
  })
  businessUnit: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Senior',
  })
  seniority: string;
}

export class Evaluable360CollaboratorDto {
  @ApiProperty({
    description: 'Informações do usuário',
    type: EvaluableCollaboratorUserDto,
  })
  user: EvaluableCollaboratorUserDto;

  @ApiProperty({
    description: 'Nota geral da avaliação 360 (1-5)',
    example: 4,
    nullable: true,
  })
  overallScore: number | null;

  @ApiProperty({
    description: 'Pontos fortes (descriptografados)',
    example: 'Excelente comunicação e trabalho em equipe',
  })
  strengths: string;

  @ApiProperty({
    description: 'Pontos de melhoria (descriptografados)',
    example: 'Pode melhorar habilidades de liderança',
  })
  improvements: string;

  @ApiProperty({
    description: 'Motivação para trabalhar novamente',
    enum: WorkAgainMotivation,
    nullable: true,
  })
  motivationToWorkAgain: WorkAgainMotivation | null;

  @ApiProperty({
    description: 'Status da avaliação',
    enum: AssessmentStatus,
    example: 'SUBMITTED',
  })
  status: AssessmentStatus;

  @ApiProperty({
    description: 'Data de submissão da avaliação',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  submittedAt: Date | null;
}
