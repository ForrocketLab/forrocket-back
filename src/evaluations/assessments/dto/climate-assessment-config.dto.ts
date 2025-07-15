import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO para configuração da avaliação de clima organizacional
 */
export class ClimateAssessmentConfigDto {
  @ApiProperty({
    description: 'Se a avaliação de clima está ativa para o ciclo atual',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}

/**
 * DTO para resposta da configuração da avaliação de clima organizacional
 */
export class ClimateAssessmentConfigResponseDto {
  @ApiProperty({
    description: 'ID da configuração',
    example: 'config-123',
  })
  id: string;

  @ApiProperty({
    description: 'Ciclo de avaliação',
    example: '2025.1',
  })
  cycle: string;

  @ApiProperty({
    description: 'Se a avaliação de clima está ativa',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'ID do usuário RH que ativou',
    example: 'user-456',
  })
  activatedBy: string;

  @ApiProperty({
    description: 'Nome do usuário RH que ativou',
    example: 'João Silva',
  })
  activatedByUserName: string;

  @ApiProperty({
    description: 'Data de ativação',
    example: '2025-01-15T10:00:00Z',
  })
  activatedAt: string;

  @ApiProperty({
    description: 'Data de desativação (se aplicável)',
    example: '2025-01-20T15:30:00Z',
    required: false,
  })
  deactivatedAt?: string;
} 