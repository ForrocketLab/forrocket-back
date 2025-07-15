import { ApiProperty } from '@nestjs/swagger';
import { WorkAgainMotivation } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class BatchUpdate360AssessmentItemDto {
  @ApiProperty({
    description: 'ID do colaborador que está sendo avaliado',
    example: 'cmd4ug9gq0005azu80y05vlo2',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nota geral atribuída ao colaborador (1 a 5 estrelas)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Pontos fortes do colaborador avaliado',
    example: 'Excelente comunicação e trabalho em equipe. Sempre disposto a ajudar colegas.',
  })
  @IsString()
  strengths: string;

  @ApiProperty({
    description: 'Pontos de melhoria do colaborador avaliado',
    example: 'Poderia ser mais proativo em reuniões e compartilhar mais conhecimento.',
  })
  @IsString()
  improvements: string;

  @ApiProperty({
    description: 'Motivação para trabalhar novamente com este colaborador',
    example: 'PARTIALLY_AGREE',
    enum: WorkAgainMotivation,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(WorkAgainMotivation)
  workAgainMotivation?: WorkAgainMotivation | null;
}

export class BatchUpdate360AssessmentDto {
  @ApiProperty({
    description: 'Array de avaliações 360 para atualizar/criar',
    type: [BatchUpdate360AssessmentItemDto],
    example: [
      {
        id: 'cmd4ug9gq0005azu80y05vlo2',
        rating: 4,
        strengths: 'Excelente comunicação e trabalho em equipe. Sempre disposto a ajudar colegas.',
        improvements: 'Poderia ser mais proativo em reuniões e compartilhar mais conhecimento.',
        workAgainMotivation: 'PARTIALLY_AGREE',
      },
      {
        id: 'cmd4ug9gq0005azu80y05vlo3',
        rating: 5,
        strengths: 'Liderança técnica excepcional. Resolve problemas complexos com facilidade.',
        improvements: 'Poderia melhorar a documentação de código.',
        workAgainMotivation: 'STRONGLY_AGREE',
      },
      {
        id: 'cmd4ug9gq0005azu80y05vlo4',
        rating: 3,
        strengths: 'Bom conhecimento técnico e cumpre prazos.',
        improvements: 'Precisa melhorar habilidades de comunicação e ser mais colaborativo.',
        workAgainMotivation: 'NEUTRAL',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdate360AssessmentItemDto)
  assessments: BatchUpdate360AssessmentItemDto[];
}
