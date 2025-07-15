import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateMentorAssessmentDto {
  @ApiProperty({
    description: 'Nota da avaliação do mentor (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'Justificativa da avaliação do mentor',
    example: 'Excelente mentor, sempre disponível para ajudar com dúvidas técnicas.',
  })
  @IsString()
  @IsOptional()
  justification?: string;
}
