import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class ProjectCollaborator360Dto {
  @ApiProperty({
    description: 'ID do colaborador',
    example: 'col-1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Nome completo do colaborador',
    example: 'Maria Silva Santos',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Cargo/função do colaborador',
    example: 'Product Manager',
  })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({
    description: 'Iniciais do colaborador',
    example: 'MS',
  })
  @IsString()
  @IsNotEmpty()
  initials: string;

  @ApiProperty({
    description: 'Senioridade do colaborador',
    example: 'Pleno',
  })
  @IsString()
  @IsOptional()
  seniority?: string;

  @ApiProperty({
    description: 'Avaliação 360 existente (se houver)',
    required: false,
  })
  @IsOptional()
  assessment360?: {
    id: string;
    overallScore: number;
    strengths: string;
    improvements: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({
    description: 'Indica se já foi avaliado pelo usuário atual',
    example: false,
  })
  @IsBoolean()
  isAssessed: boolean;
}
