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