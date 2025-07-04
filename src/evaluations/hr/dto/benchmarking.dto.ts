import { ApiProperty } from '@nestjs/swagger';

export class BenchmarkingDto {
  @ApiProperty({
    description: 'Posição no ranking da unidade de negócios',
    example: 5,
  })
  rankInBusinessUnit: number;

  @ApiProperty({
    description: 'Total de colaboradores na unidade de negócios',
    example: 20,
  })
  totalInBusinessUnit: number;

  @ApiProperty({
    description: 'Percentil na unidade de negócios',
    example: 75,
  })
  percentileInBusinessUnit: number;

  @ApiProperty({
    description: 'Posição no ranking de senioridade',
    example: 3,
  })
  rankInSeniority: number;

  @ApiProperty({
    description: 'Total de colaboradores no mesmo nível de senioridade',
    example: 15,
  })
  totalInSeniority: number;

  @ApiProperty({
    description: 'Percentil entre pares de mesma senioridade',
    example: 80,
  })
  percentileInSeniority: number;
} 