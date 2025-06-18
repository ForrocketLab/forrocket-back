import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

/**
 * DTO para criação de avaliação de mentoring
 */
export class CreateMentoringAssessmentDto {
  // Campo cycle removido - será usado automaticamente o ciclo ativo

  @ApiProperty({
    description: 'ID do mentor que está sendo avaliado',
    example: 'user-789',
  })
  @IsString()
  @IsNotEmpty()
  mentorId: string;

  @ApiProperty({
    description: 'Nota atribuída ao mentor (1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @ApiProperty({
    description: 'Justificativa para a avaliação do mentor',
    example:
      'Excelente mentor, sempre disponível para tirar dúvidas e me ajudou muito no desenvolvimento técnico.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
}
