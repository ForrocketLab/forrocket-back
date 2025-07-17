import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para role específica em um projeto
 */
export class UserProjectRoleDto {
  @ApiProperty({
    description: 'ID do projeto',
    example: 'projeto-alpha',
    type: String,
  })
  projectId: string;

  @ApiProperty({
    description: 'Nome do projeto',
    example: 'Projeto Alpha',
    type: String,
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
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'ana.oliveira@rocketcorp.com',
    type: String,
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
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'ana.oliveira@rocketcorp.com',
    type: String,
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
    type: String,
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

  @ApiProperty({
    description: 'Hub de negócio',
    example: 'Technology Hub',
    type: String,
    required: false,
    nullable: true
  })
  businessHub?: string | null;

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
    required: false,
    nullable: true
  })
  managerId?: string | null;

  @ApiProperty({
    description: 'Nome do gestor direto',
    example: 'Bruno Mendes',
    type: String,
    required: false,
    nullable: true
  })
  managerName?: string | null;

  @ApiProperty({
    description: 'IDs dos liderados diretos (apenas para gestores)',
    example: ['cmbyavwvd0000tzsgo55812qo', 'cmbyavwvo0004tzsgxyz123abc'],
    type: [String],
    required: false,
    nullable: true
  })
  directReports?: string[] | null; 

  @ApiProperty({
    description: 'Nomes dos liderados diretos (apenas para gestores)',
    example: ['Ana Oliveira', 'Felipe Silva'],
    type: [String],
    required: false,
    nullable: true
  })
  directReportsNames?: string[] | null;

  @ApiProperty({
    description: 'ID do mentor designado',
    example: 'cmbyavwvk0002tzsgi5r3edy5',
    type: String,
    required: false,
    nullable: true
  })
  mentorId?: string | null;

  @ApiProperty({
    description: 'Nome do mentor designado',
    example: 'Carla Dias',
    type: String,
    required: false,
    nullable: true
  })
  mentorName?: string | null;

  // ==========================================
  // NOVOS CAMPOS DE LIDERANÇA
  // ==========================================

  @ApiProperty({
    description: 'ID do líder direto',
    example: 'cmbyavwvh0001tzsg5owfxwbq',
    type: String,
    required: false,
    nullable: true
  })
  leaderId?: string | null;

  @ApiProperty({
    description: 'Nome do líder direto',
    example: 'Lucas Fernandes',
    type: String,
    required: false,
    nullable: true
  })
  leaderName?: string | null;

  @ApiProperty({
    description: 'IDs das pessoas que esta pessoa lidera diretamente (apenas para líderes)',
    example: ['cmbyavwvd0000tzsgo55812qo', 'cmbyavwvo0004tzsgxyz123abc'],
    type: [String],
    required: false,
    nullable: true
  })
  directLeadership?: string[] | null;

  @ApiProperty({
    description: 'Nomes das pessoas que esta pessoa lidera diretamente (apenas para líderes)',
    example: ['Ana Oliveira', 'Felipe Silva'],
    type: [String],
    required: false,
    nullable: true
  })
  directLeadershipNames?: string[] | null;

  @ApiProperty({
    description: 'IDs das pessoas que esta pessoa mentora (apenas para mentores)',
    example: ['cmbyavwvd0000tzsgo55812qo', 'cmbyavwvo0004tzsgxyz123abc'],
    type: [String],
    required: false,
    nullable: true
  })
  mentoringIds?: string[] | null; 

  @ApiProperty({
    description: 'Nomes das pessoas que esta pessoa mentora (apenas para mentores)',
    example: ['Ana Oliveira', 'Felipe Silva'],
    type: [String],
    required: false,
    nullable: true
  })
  mentoringNames?: string[] | null;

  @ApiProperty({
    description: 'Projetos em que o usuário está alocado (array de strings)',
    example: ['projeto-app-mobile', 'projeto-dashboard'],
    type: [String],
    required: false,
    nullable: true,
  })
  projects?: string[] | null;

  @ApiProperty({
    description: 'ID do lote de importação',
    example: 'batch-id-123',
    type: String,
    required: false,
    nullable: true
  })
  importBatchId?: string | null;

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

  @ApiProperty({
    description: 'Data da última atividade do usuário',
    example: '2024-01-15T10:30:00Z',
    type: String,
    format: 'date-time',
    required: false,
    nullable: true
  })
  lastActivityAt?: Date | null;
}
