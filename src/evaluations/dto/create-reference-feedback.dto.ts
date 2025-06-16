import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para criação de feedback de referência
 */
export class CreateReferenceFeedbackDto {
  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1'
  })
  @IsString()
  @IsNotEmpty()
  cycle: string;

  @ApiProperty({
    description: 'ID do colega que está sendo referenciado',
    example: 'user-123'
  })
  @IsString()
  @IsNotEmpty()
  referencedUserId: string;

  @ApiProperty({
    description: 'Feedback sobre o colega referenciado',
    example: 'Trabalhou comigo no projeto X e demonstrou excelente capacidade de resolução de problemas e colaboração.'
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
} 