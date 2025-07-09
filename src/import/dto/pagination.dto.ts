import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página (começando em 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de itens por página',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    enum: ['importedAt', 'fileName', 'status'],
    default: 'importedAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['importedAt', 'fileName', 'status'])
  sortBy?: string = 'importedAt';

  @ApiPropertyOptional({
    description: 'Ordem da ordenação',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: 'Lista de itens da página atual' })
  data: T[];

  @ApiPropertyOptional({ description: 'Metadados da paginação' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  constructor(data: T[], meta: PaginatedResponseDto<T>['meta']) {
    this.data = data;
    this.meta = meta;
  }
}
