import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO para criação de feedback de referência
 */
export class CreateReferenceFeedbackDto {
  // Campo cycle removido - será usado automaticamente o ciclo ativo

  @ApiProperty({
    description: 'ID do colega que está sendo referenciado',
    example: 'user-123',
  })
  @IsString()
  @IsNotEmpty()
  referencedUserId: string;

  @ApiProperty({
    description: 'Tópico do feedback (opcional)',
    example: 'Colaboração em projeto',
    required: false,
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiProperty({
    description: 'Feedback sobre o colega referenciado',
    example:
      'Trabalhou comigo no projeto X e demonstrou excelente capacidade de resolução de problemas e colaboração.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
}
