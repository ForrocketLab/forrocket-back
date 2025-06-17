import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para role específica em um projeto
 */
export class UserProjectRoleDto {
  @ApiProperty({
    description: 'ID do projeto',
    example: 'projeto-alpha',
    type: String
  })
  projectId: string;

  @ApiProperty({
    description: 'Nome do projeto',
    example: 'Projeto Alpha',
    type: String
  })
  projectName: string;

  @ApiProperty({
    description: 'Roles específicas do usuário neste projeto',
    example: ['COLLABORATOR', 'TECH_LEAD'],
    type: [String],
    enum: ['COLLABORATOR', 'MANAGER', 'COMMITTEE', 'HR', 'ADMIN'],
  })
  roles: string[];
}

/**
 * DTO para informações básicas do usuário autenticado
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

/**
 * DTO para informações completas do perfil do usuário
 */
export class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 'cmbyavwvd0000tzsgo55812qo',
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
    type: [String],
    enum: ['colaborador', 'gestor', 'comite', 'rh', 'admin']
  })
  roles: string[];

  // ==========================================
  // DADOS ORGANIZACIONAIS
  // ==========================================

  @ApiProperty({
    description: 'Cargo/Posição do colaborador',
    example: 'Desenvolvedora Frontend',
    type: String
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Pleno',
    type: String,
    enum: ['Júnior', 'Pleno', 'Sênior', 'Principal', 'Staff']
  })
  seniority: string;

  @ApiProperty({
    description: 'Trilha de carreira',
    example: 'Tech',
    type: String,
    enum: ['Tech', 'Business']
  })
  careerTrack: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products',
    type: String,
    enum: ['Digital Products', 'Operations']
  })
  businessUnit: string;

  // ==========================================
  // DADOS DE ALOCAÇÃO E RELACIONAMENTO
  // ==========================================

  @ApiProperty({
    description: 'Projetos em que o usuário está alocado com suas roles específicas',
    example: [
      {
        projectId: 'projeto-alpha',
        projectName: 'Projeto Alpha',
        roles: ['COLLABORATOR']
      },
      {
        projectId: 'projeto-beta',
        projectName: 'Projeto Beta',
        roles: ['COLLABORATOR', 'TECH_LEAD']
      }
    ],
    type: [UserProjectRoleDto]
  })
  projectRoles: UserProjectRoleDto[];

  @ApiProperty({
    description: 'ID do gestor direto',
    example: 'cmbyavwvh0001tzsg5owfxwbq',
    type: String,
    required: false
  })
  managerId?: string;

  @ApiProperty({
    description: 'Nome do gestor direto',
    example: 'Bruno Mendes',
    type: String,
    required: false
  })
  managerName?: string;

  @ApiProperty({
    description: 'IDs dos liderados diretos (apenas para gestores)',
    example: ['cmbyavwvd0000tzsgo55812qo', 'cmbyavwvo0004tzsgxyz123abc'],
    type: [String],
    required: false
  })
  directReports?: string[];

  @ApiProperty({
    description: 'Nomes dos liderados diretos (apenas para gestores)',
    example: ['Ana Oliveira', 'Felipe Silva'],
    type: [String],
    required: false
  })
  directReportsNames?: string[];

  @ApiProperty({
    description: 'ID do mentor designado',
    example: 'cmbyavwvk0002tzsgi5r3edy5',
    type: String,
    required: false
  })
  mentorId?: string;

  @ApiProperty({
    description: 'Nome do mentor designado',
    example: 'Carla Dias',
    type: String,
    required: false
  })
  mentorName?: string;

  // ==========================================
  // METADADOS
  // ==========================================

  @ApiProperty({
    description: 'Indica se o usuário está ativo',
    example: true,
    type: Boolean
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2024-01-15T10:00:00.000Z',
    type: String,
    format: 'date-time'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    example: '2024-01-15T10:00:00.000Z',
    type: String,
    format: 'date-time'
  })
  updatedAt: Date;
} 