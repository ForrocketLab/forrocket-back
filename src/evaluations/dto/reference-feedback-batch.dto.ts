import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReferenceFeedbackItemDto {
  @ApiProperty({
    description: 'ID do usuário referenciado',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Nome do usuário referenciado',
    example: 'Bruno André Mendes Carvalho',
  })
  @IsString()
  @IsNotEmpty()
  referenceName: string;

  @ApiProperty({
    description: 'Cargo do usuário referenciado',
    example: 'Tech Lead',
  })
  @IsString()
  @IsNotEmpty()
  referenceRole: string;

  @ApiProperty({
    description: 'Iniciais do usuário referenciado',
    example: 'BA',
  })
  @IsString()
  @IsNotEmpty()
  referenceInitials: string;

  @ApiProperty({
    description: 'Justificativa do feedback',
    example: 'Bruno demonstra excelente liderança técnica, sempre orientando a equipe com clareza e paciência',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
}

export class UpdateReferenceFeedbackBatchDto {
  @ApiProperty({
    description: 'Array de referências para atualizar',
    type: [ReferenceFeedbackItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceFeedbackItemDto)
  references: ReferenceFeedbackItemDto[];
}
