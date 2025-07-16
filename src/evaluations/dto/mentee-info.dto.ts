import { ApiProperty } from '@nestjs/swagger';

export class MenteeReceived360AssessmentDto {
  @ApiProperty({
    description: 'ID da avaliação 360',
    example: 'cmx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Nota geral da avaliação 360',
    example: 4,
  })
  overallScore: number;

  @ApiProperty({
    description: 'Pontos fortes mencionados',
    example: 'Excelente comunicação e trabalho em equipe',
    nullable: true,
  })
  strengths: string | null;

  @ApiProperty({
    description: 'Pontos de melhoria mencionados',
    example: 'Pode melhorar habilidades de liderança',
    nullable: true,
  })
  improvements: string | null;

  @ApiProperty({
    description: 'Motivação para trabalhar novamente',
    example: 'AGREE',
    enum: ['STRONGLY_AGREE', 'AGREE', 'NEUTRAL', 'DISAGREE', 'STRONGLY_DISAGREE'],
    nullable: true,
  })
  motivationToWorkAgain: string | null;

  @ApiProperty({
    description: 'Status da avaliação',
    example: 'SUBMITTED',
    enum: ['DRAFT', 'SUBMITTED'],
  })
  status: string;

  @ApiProperty({
    description: 'Informações do autor da avaliação',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'author-123' },
      name: { type: 'string', example: 'João Silva' },
      jobTitle: { type: 'string', example: 'Desenvolvedor Senior' },
      seniority: { type: 'string', example: 'Senior' },
    },
  })
  author: {
    id: string;
    name: string;
    jobTitle: string;
    seniority: string;
  };

  @ApiProperty({
    description: 'Data de criação da avaliação',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de submissão da avaliação',
    example: '2025-01-15T14:45:00Z',
    nullable: true,
  })
  submittedAt: Date | null;
}

export class MenteeInfoDto {
  @ApiProperty({
    description: 'ID único do mentorado',
    example: 'cmbyavwvd0000tzsgo55812qo',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do mentorado',
    example: 'Ana Beatriz Oliveira Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Cargo/posição do mentorado',
    example: 'Desenvolvedora Frontend',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade do mentorado',
    example: 'Pleno',
  })
  seniority: string;

  @ApiProperty({
    description: 'Autoavaliação do mentorado formatada para o frontend',
    example: {
      'sentimento-de-dono': {
        score: 4,
        justification: 'Demonstro responsabilidade pelos resultados.',
      },
      'resiliencia-adversidades': {
        score: 3,
        justification: 'Mantenho-me calmo em situações difíceis.',
      },
      'organizacao-trabalho': {
        score: 5,
        justification: 'Sou muito organizado com minhas tarefas.',
      },
    },
    nullable: true,
  })
  selfAssessment: Record<string, { score: number; justification: string }> | null;

  @ApiProperty({
    description: 'Status da autoavaliação',
    example: 'SUBMITTED',
    enum: ['DRAFT', 'SUBMITTED', 'NOT_STARTED'],
  })
  selfAssessmentStatus: 'DRAFT' | 'SUBMITTED' | 'NOT_STARTED';

  @ApiProperty({
    description: 'Ciclo da avaliação',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Lista de avaliações 360 recebidas pelo mentorado',
    type: [MenteeReceived360AssessmentDto],
    example: [
      {
        id: 'cmx1y2z3a4b5c6d7e8f9g0h1',
        overallScore: 4,
        strengths: 'Excelente comunicação e trabalho em equipe',
        improvements: 'Pode melhorar habilidades de liderança',
        motivationToWorkAgain: 'AGREE',
        status: 'SUBMITTED',
        author: {
          id: 'author-123',
          name: 'João Silva',
          jobTitle: 'Desenvolvedor Senior',
          seniority: 'Senior',
        },
        createdAt: '2025-01-15T10:30:00Z',
        submittedAt: '2025-01-15T14:45:00Z',
      },
    ],
  })
  received360Assessments: MenteeReceived360AssessmentDto[];
}
