import { ApiProperty } from '@nestjs/swagger';

export class ProjectEvaluationDto {
  @ApiProperty({
    example: '2025.1',
    description: 'O ciclo de avaliação.',
  })
  cycle: string;

  @ApiProperty({
    example: 4.6,
    description: 'A nota da avaliação do projeto para o ciclo.',
  })
  score: number;

  @ApiProperty({
    example: 'O projeto foi desenvolvido da melhor maneira possível.',
    description: 'A justificativa para a nota da avaliação.',
  })
  justification: string;
}

