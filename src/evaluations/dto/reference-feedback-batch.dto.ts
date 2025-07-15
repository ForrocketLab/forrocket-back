import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReferenceFeedbackItemDto {
  @ApiProperty({
    description: 'ID do colaborador referenciado',
    example: 'col-1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Nome completo do colaborador referenciado',
    example: 'Maria Silva Santos',
  })
  @IsString()
  @IsNotEmpty()
  referenceName: string;

  @ApiProperty({
    description: 'Cargo/função do colaborador referenciado',
    example: 'Product Manager',
  })
  @IsString()
  @IsNotEmpty()
  referenceRole: string;

  @ApiProperty({
    description: 'Iniciais do colaborador referenciado',
    example: 'MS',
  })
  @IsString()
  @IsNotEmpty()
  referenceInitials: string;

  @ApiProperty({
    description: 'Justificativa do feedback de referência',
    example: 'Excelente profissional, muito dedicado e colaborativo.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
}

export class UpdateReferenceFeedbackBatchDto {
  @ApiProperty({
    description: 'Array de referências a serem sincronizadas',
    type: [ReferenceFeedbackItemDto],
    example: [
      {
        id: 'col-1',
        referenceName: 'Maria Silva Santos',
        referenceRole: 'Product Manager',
        referenceInitials: 'MS',
        justification: 'Excelente profissional, muito dedicado e colaborativo.',
      },
      {
        id: 'col-6',
        referenceName: 'Rafael Mendes',
        referenceRole: 'DevOps Engineer',
        referenceInitials: 'RM',
        justification: 'Ótimo conhecimento técnico e sempre disposto a ajudar.',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceFeedbackItemDto)
  references: ReferenceFeedbackItemDto[];
}
