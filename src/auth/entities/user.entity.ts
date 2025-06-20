import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidade User para representar usuários no sistema RPE
 * Baseada na interface IUser com todos os campos necessários
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

  // ==========================================
  // DADOS DE ESTRUTURA ORGANIZACIONAL
  // ==========================================

  @ApiProperty({
    description: 'Cargo/Posição do colaborador',
    example: 'Desenvolvedora Frontend'
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Pleno'
  })
  seniority: string;

  @ApiProperty({
    description: 'Trilha de carreira',
    example: 'Tech'
  })
  careerTrack: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products'
  })
  businessUnit: string;

  // ==========================================
  // DADOS DE ALOCAÇÃO E RELACIONAMENTO
  // ==========================================

  @ApiProperty({
    description: 'Projetos em que o usuário está alocado',
    example: ['projeto-app-mobile', 'projeto-dashboard']
  })
  projects: string[];

  @ApiProperty({
    description: 'ID do gestor direto',
    example: 'gestor-id-123',
    required: false
  })
  managerId?: string;

  @ApiProperty({
    description: 'IDs dos liderados diretos (apenas para gestores)',
    example: ['liderado-1', 'liderado-2'],
    required: false
  })
  directReports?: string[];

  @ApiProperty({
    description: 'ID do mentor designado',
    example: 'mentor-id-123',
    required: false
  })
  mentorId?: string;

  // ==========================================
  // METADADOS DE CONTROLE
  // ==========================================

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