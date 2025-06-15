import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para informações do usuário autenticado
 */
export class UserInfoDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '12345678-90ab-cdef-1234-567890abcdef',
    type: String
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira',
    type: String
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'ana.oliveira@rocketcorp.com',
    type: String
  })
  email: string;

  @ApiProperty({
    description: 'Papéis/funções do usuário no sistema',
    example: ['colaborador'],
    type: [String]
  })
  roles: string[];
} 