import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para submeter uma avaliação
 */
export class SubmitAssessmentDto {
  @ApiProperty({
    description: 'Tipo da avaliação a ser submetida',
    example: 'self',
    enum: ['self', '360', 'mentoring', 'reference', 'manager'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['self', '360', 'mentoring', 'reference', 'manager'])
  evaluationType: 'self' | '360' | 'mentoring' | 'reference' | 'manager';
}