import { ApiProperty } from '@nestjs/swagger';

export class Received360AssessmentDto {
  @ApiProperty({ example: 'Bruno Mendes' })
  evaluatorName: string;

  @ApiProperty({ example: 'Tech Lead' })
  evaluatorJobTitle: string;

  @ApiProperty({ example: 4.5 })
  rating: number;

  @ApiProperty({ example: 'Excelente liderança técnica...' })
  strengths: string;

  @ApiProperty({ example: 'Poderia melhorar a organização...' })
  weaknesses: string;
}
