import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para representar um projeto
 */
export class ProjectDto {
  @ApiProperty({
    description: 'Identificador único do projeto',
    example: 'projeto-alpha',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do projeto',
    example: 'Projeto Alpha',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição do projeto',
    example: 'Desenvolvimento da nova plataforma de vendas',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Indica se o projeto está ativo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação do projeto',
    example: '2024-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * DTO para representar um projeto com as roles do usuário
 */
export class ProjectWithUserRolesDto extends ProjectDto {
  @ApiProperty({
    description: 'Roles específicas do usuário neste projeto',
    example: ['COLLABORATOR', 'TECH_LEAD'],
    type: [String],
    enum: ['COLLABORATOR', 'MANAGER', 'COMMITTEE', 'HR', 'ADMIN'],
  })
  userRoles: string[];
}

/**
 * DTO para representar um colega de equipe
 */
export class TeammateDto {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira',
  })
  name: string;

  @ApiProperty({
    description: 'Email corporativo',
    example: 'ana.oliveira@rocketcorp.com',
  })
  email: string;

  @ApiProperty({
    description: 'Cargo/função',
    example: 'Desenvolvedora Frontend',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Senioridade',
    example: 'Pleno',
  })
  seniority: string;

  @ApiProperty({
    description: 'Roles/papéis do usuário',
    example: ['colaborador'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Indica se é gestor',
    example: false,
  })
  isManager: boolean;
}

/**
 * DTO para colegas de equipe por projeto
 */
export class ProjectTeammatesDto {
  @ApiProperty({
    description: 'Nome do projeto',
    example: 'projeto-app-mobile',
  })
  projectName: string;

  @ApiProperty({
    description: 'Lista de colegas no projeto',
    type: [TeammateDto],
  })
  teammates: TeammateDto[];
}

/**
 * DTO para usuário avaliável
 */
export class EvaluableUserDto {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira',
  })
  name: string;

  @ApiProperty({
    description: 'Email corporativo',
    example: 'ana.oliveira@rocketcorp.com',
  })
  email: string;

  @ApiProperty({
    description: 'Cargo/função',
    example: 'Desenvolvedora Frontend',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Senioridade',
    example: 'Pleno',
  })
  seniority: string;

  @ApiProperty({
    description: 'Roles/papéis do usuário',
    example: ['colaborador'],
    type: [String],
  })
  roles: string[];
}

/**
 * DTO para resposta de usuários avaliáveis
 */
export class EvaluableUsersResponseDto {
  @ApiProperty({
    description: 'Colegas de trabalho (mesmo projeto)',
    type: [EvaluableUserDto],
  })
  colleagues: EvaluableUserDto[];

  @ApiProperty({
    description: 'Gestores diretos',
    type: [EvaluableUserDto],
  })
  managers: EvaluableUserDto[];

  @ApiProperty({
    description: 'Mentores designados',
    type: [EvaluableUserDto],
  })
  mentors: EvaluableUserDto[];
}

/**
 * DTO para informações de mentor
 */
export class MentorInfoDto {
  @ApiProperty({
    description: 'Identificador único do mentor',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do mentor',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Cargo/função do mentor',
    example: 'Tech Lead Sênior',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Email corporativo do mentor',
    example: 'joao.silva@rocketcorp.com',
  })
  email: string;
}

/**
 * DTO para informações de mentorado
 */
export class MenteeInfoDto {
  @ApiProperty({
    description: 'Identificador único do mentorado',
    example: 'user-456',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do mentorado',
    example: 'Maria Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Cargo/função do mentorado',
    example: 'Desenvolvedora Júnior',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Email corporativo do mentorado',
    example: 'maria.santos@rocketcorp.com',
  })
  email: string;
}

/**
 * DTO para subordinados gerenciados pelo usuário
 */
export class ManagedSubordinateDto {
  @ApiProperty({
    description: 'Identificador único do subordinado',
    example: 'user-789',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do subordinado',
    example: 'Carlos Oliveira',
  })
  name: string;

  @ApiProperty({
    description: 'Cargo/função do subordinado',
    example: 'Desenvolvedor Pleno',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Email corporativo do subordinado',
    example: 'carlos.oliveira@rocketcorp.com',
  })
  email: string;
}

/**
 * DTO para pessoas lideradas pelo usuário
 */
export class LedSubordinateDto {
  @ApiProperty({
    description: 'Identificador único da pessoa liderada',
    example: 'user-456',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo da pessoa liderada',
    example: 'Marina Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Cargo/função da pessoa liderada',
    example: 'Data Analyst Pleno',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Email corporativo da pessoa liderada',
    example: 'marina.santos@rocketcorp.com',
  })
  email: string;
}

/**
 * DTO para projeto com informações de gestão e liderança
 */
export class ProjectWithManagementDto extends ProjectDto {
  @ApiProperty({
    description: 'Roles específicas do usuário neste projeto',
    example: ['COLLABORATOR', 'MANAGER'],
    type: [String],
    enum: ['COLLABORATOR', 'MANAGER', 'LEADER', 'COMMITTEE', 'HR', 'ADMIN'],
  })
  userRoles: string[];

  @ApiProperty({
    description: 'Subordinados que o usuário gerencia neste projeto (apenas se for MANAGER)',
    type: [ManagedSubordinateDto],
  })
  managedSubordinates: ManagedSubordinateDto[];

  @ApiProperty({
    description: 'Pessoas que o usuário lidera neste projeto (apenas se for LEADER)',
    type: [LedSubordinateDto],
  })
  ledSubordinates: LedSubordinateDto[];

  @ApiProperty({
    description: 'Indica se o usuário é gestor neste projeto',
    example: true,
  })
  isManagerInProject: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é líder neste projeto',
    example: false,
  })
  isLeaderInProject: boolean;
}

/**
 * DTO para overview completo do usuário
 */
export class UserOverviewDto {
  @ApiProperty({
    description: 'Projetos que o usuário participa com informações de gestão e liderança',
    type: [ProjectWithManagementDto],
  })
  projects: ProjectWithManagementDto[];

  @ApiProperty({
    description: 'Informações do mentor do usuário (se tiver)',
    type: MentorInfoDto,
    nullable: true,
  })
  mentor: MentorInfoDto | null;

  @ApiProperty({
    description: 'Lista de pessoas que o usuário mentora',
    type: [MenteeInfoDto],
  })
  mentees: MenteeInfoDto[];

  @ApiProperty({
    description: 'Indica se o usuário tem mentor',
    example: true,
  })
  hasMentor: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é mentor de alguém',
    example: false,
  })
  isMentor: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é gestor em pelo menos um projeto',
    example: true,
  })
  isManager: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é líder em pelo menos um projeto',
    example: false,
  })
  isLeader: boolean;
}

/**
 * DTO para informações completas de usuário (Admin)
 */
export class UserInfoDto {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: 'user-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Beatriz Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Email corporativo',
    example: 'ana.santos@rocketcorp.com',
  })
  email: string;

  @ApiProperty({
    description: 'Roles/papéis do usuário no sistema',
    example: ['COLLABORATOR'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Cargo/função',
    example: 'Desenvolvedora Frontend',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Senioridade',
    example: 'Pleno',
  })
  seniority: string;

  @ApiProperty({
    description: 'Trilha de carreira',
    example: 'Tech',
  })
  careerTrack: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products',
  })
  businessUnit: string;

  @ApiProperty({
    description: 'Status do usuário',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-12-01T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-12-01T10:00:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Nome do gestor direto (estrutura legada)',
    example: 'Bruno André Mendes Carvalho',
    nullable: true,
  })
  managerName: string | null;

  @ApiProperty({
    description: 'Nome do líder direto (estrutura legada)',
    example: 'Lucas Henrique Fernandes Souza',
    nullable: true,
  })
  leaderName: string | null;

  @ApiProperty({
    description: 'Quantidade de subordinados diretos',
    example: 3,
  })
  directReportsCount: number;

  @ApiProperty({
    description: 'Quantidade de pessoas lideradas diretamente',
    example: 2,
  })
  directLeadershipCount: number;
}

/**
 * DTO para overview completo do usuário para administradores
 */
export class AdminUserOverviewDto {
  @ApiProperty({
    description: 'Informações completas do usuário',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: 'Projetos que o usuário participa com informações de gestão e liderança',
    type: [ProjectWithManagementDto],
  })
  projects: ProjectWithManagementDto[];

  @ApiProperty({
    description: 'Informações do mentor do usuário (se tiver)',
    type: MentorInfoDto,
    nullable: true,
  })
  mentor: MentorInfoDto | null;

  @ApiProperty({
    description: 'Lista de pessoas que o usuário mentora',
    type: [MenteeInfoDto],
  })
  mentees: MenteeInfoDto[];

  @ApiProperty({
    description: 'Indica se o usuário tem mentor',
    example: true,
  })
  hasMentor: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é mentor de alguém',
    example: false,
  })
  isMentor: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é gestor em pelo menos um projeto',
    example: true,
  })
  isManager: boolean;

  @ApiProperty({
    description: 'Indica se o usuário é líder em pelo menos um projeto',
    example: false,
  })
  isLeader: boolean;
} 