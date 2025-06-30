import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ObjectiveStatus } from '@prisma/client';

/**
 * DTO para atualização de um objetivo existente
 */
export class UpdateObjectiveDto {
  @ApiProperty({
    description: 'Título do objetivo',
    example: 'Aumentar a satisfação do time',
    required: false
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada do objetivo',
    example: 'Melhorar o ambiente de trabalho e comunicação interna',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Status do objetivo',
    enum: ObjectiveStatus,
    example: ObjectiveStatus.IN_PROGRESS,
    required: false
  })
  @IsEnum(ObjectiveStatus)
  @IsOptional()
  status?: ObjectiveStatus;

  @ApiProperty({
    description: 'Progresso do objetivo (0-100%)',
    example: 75.5,
    minimum: 0,
    maximum: 100,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
} 