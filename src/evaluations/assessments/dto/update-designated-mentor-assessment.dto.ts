import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateDesignatedMentorAssessmentDto {
  @ApiProperty({
    description: 'Nota atribuída ao mentor (1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Justificativa da avaliação do mentor',
    example: 'Excelente mentor, sempre disponível para ajudar',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
} 