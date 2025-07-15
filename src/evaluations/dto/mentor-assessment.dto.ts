import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class MentorAssessmentDto {
  @ApiProperty({
    description: 'ID do mentor',
    example: 'mentor-1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Nome completo do mentor',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Cargo/função do mentor',
    example: 'Tech Lead',
  })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({
    description: 'Iniciais do mentor',
    example: 'JS',
  })
  @IsString()
  @IsNotEmpty()
  initials: string;

  @ApiProperty({
    description: 'Avaliação de mentoring existente (se houver)',
    required: false,
  })
  @IsOptional()
  mentoringAssessment?: {
    id: string;
    rating: number;
    justification: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
