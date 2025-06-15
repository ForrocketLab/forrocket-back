import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidade User para representar usuários no sistema
 */
export class User {
  @ApiProperty({
    description: 'ID único do usuário (UUID)',
    example: '12345678-90ab-cdef-1234-567890abcdef'
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira'
  })
  name: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'ana.oliveira@rocketcorp.com'
  })
  email: string;

  passwordHash: string;

  @ApiProperty({
    description: 'Papéis/funções do usuário no sistema',
    example: ['colaborador', 'gestor']
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica se o usuário está ativo',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação do usuário'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário'
  })
  updatedAt: Date;

  /**
   * Método para converter entidade em objeto público (sem senha)
   */
  toPublic() {
    const { passwordHash, ...publicUser } = this;
    return publicUser;
  }
} 