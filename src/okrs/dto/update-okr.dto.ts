import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { OKRStatus } from '@prisma/client';

/**
 * DTO para atualização de um OKR existente
 */
export class UpdateOKRDto {
  @ApiProperty({
    description: 'Título do OKR',
    example: 'Melhorar Performance da Equipe Q1 2025',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição opcional do OKR',
    example: 'Focar em aumentar a produtividade e qualidade das entregas do time',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Trimestre do OKR',
    example: '2025-Q1',
    required: false
  })
  @IsString()
  @IsOptional()
  quarter?: string;

  @ApiProperty({
    description: 'Ano do OKR',
    example: 2025,
    required: false
  })
  @IsInt()
  @Min(2020)
  @Max(2030)
  @IsOptional()
  year?: number;

  @ApiProperty({
    description: 'Status do OKR',
    enum: OKRStatus,
    example: OKRStatus.ACTIVE,
    required: false
  })
  @IsEnum(OKRStatus)
  @IsOptional()
  status?: OKRStatus;
} 