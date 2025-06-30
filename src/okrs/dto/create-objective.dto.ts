import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateKeyResultDto } from './create-key-result.dto';

/**
 * DTO para criação de um novo objetivo
 */
export class CreateObjectiveDto {
  @ApiProperty({
    description: 'Título do objetivo',
    example: 'Aumentar a satisfação do time'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do objetivo',
    example: 'Melhorar o ambiente de trabalho e comunicação interna',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Lista de key results do objetivo',
    type: [CreateKeyResultDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateKeyResultDto)
  keyResults?: CreateKeyResultDto[];
} 