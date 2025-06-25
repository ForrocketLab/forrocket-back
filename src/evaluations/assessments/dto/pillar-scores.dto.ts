import { ApiProperty } from '@nestjs/swagger';
import { CriterionPillar } from '@prisma/client';

export class PillarScores {
  @ApiProperty({
    example: 4.5,
    description: 'Nota média para critérios do pilar de Comportamento.',
    nullable: true,
  })
  [CriterionPillar.BEHAVIOR]: number | null;

  @ApiProperty({
    example: 4.8,
    description: 'Nota média para critérios do pilar de Execução.',
    nullable: true,
  })
  [CriterionPillar.EXECUTION]: number | null;

  @ApiProperty({
    example: null,
    description: 'Nota média para critérios do pilar de Gestão. Nulo se não aplicável.',
    nullable: true,
  })
  [CriterionPillar.MANAGEMENT]: number | null;
}
