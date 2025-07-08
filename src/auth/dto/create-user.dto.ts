import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';

/**
 * Enum para definir o tipo principal do usuário
 */
export enum UserType {
  ADMIN = 'admin',
  RH = 'rh',
  COMITE = 'comite',
  PROJECT_MEMBER = 'project_member',
}

/**
 * DTO para definir a alocação de um usuário em um projeto
 */
export class ProjectAssignmentDto {
  @ApiProperty({
    description: 'ID do projeto',
    example: 'projeto-alpha',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Role do usuário no projeto',
    example: 'colaborador',
    enum: ['colaborador', 'gestor'],
  })
  @IsEnum(['colaborador', 'gestor'], {
    message: 'roleInProject deve ser um dos seguintes valores: colaborador, gestor',
  })
  roleInProject: 'colaborador' | 'gestor';
}

/**
 * DTO para criação de novos usuários
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Tipo principal do usuário que define seu escopo de atuação',
    example: 'project_member',
    enum: UserType,
    enumName: 'UserType',
  })
  @IsEnum(UserType, {
    message: 'userType deve ser um dos seguintes valores: admin, rh, comite, project_member',
  })
  userType: UserType;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Silva Oliveira',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email corporativo do usuário (@rocketcorp.com)',
    example: 'ana.oliveira@rocketcorp.com',
  })
  @IsEmail()
  @Matches(/@rocketcorp\.com$/, {
    message: 'Email deve ter o domínio @rocketcorp.com',
  })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres)',
    example: 'MinhaSenh@123',
  })
  @IsString()
  @MinLength(8, {
    message: 'Senha deve ter pelo menos 8 caracteres',
  })
  password: string;

  @ApiProperty({
    description: 'Cargo/Posição do colaborador',
    example: 'Desenvolvedora Frontend',
    enum: [
      'Desenvolvedora Frontend',
      'Desenvolvedor Backend',
      'Product Designer',
      'Product Manager',
      'Tech Lead',
      'DevOps Engineer',
      'Data Analyst',
      'QA Engineer',
      'People & Culture Manager',
      'Head of Engineering',
      'System Administrator',
    ],
  })
  @IsEnum(
    [
      'Desenvolvedora Frontend',
      'Desenvolvedor Backend',
      'Product Designer',
      'Product Manager',
      'Tech Lead',
      'DevOps Engineer',
      'Data Analyst',
      'QA Engineer',
      'People & Culture Manager',
      'Head of Engineering',
      'System Administrator',
    ],
    {
      message:
        'jobTitle deve ser um dos seguintes valores: Desenvolvedora Frontend, Desenvolvedor Backend, Product Designer, Product Manager, Tech Lead, DevOps Engineer, Data Analyst, QA Engineer, People & Culture Manager, Head of Engineering, System Administrator',
    },
  )
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Pleno',
    enum: ['Júnior', 'Pleno', 'Sênior', 'Principal', 'Staff'],
  })
  @IsEnum(['Júnior', 'Pleno', 'Sênior', 'Principal', 'Staff'], {
    message: 'seniority deve ser um dos seguintes valores: Júnior, Pleno, Sênior, Principal, Staff',
  })
  seniority: string;

  @ApiProperty({
    description: 'Trilha de carreira',
    example: 'Tech',
    enum: ['Tech', 'Business'],
  })
  @IsEnum(['Tech', 'Business'], {
    message: 'careerTrack deve ser um dos seguintes valores: Tech, Business',
  })
  careerTrack: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products',
    enum: ['Digital Products', 'Operations'],
  })
  @IsEnum(['Digital Products', 'Operations'], {
    message: 'businessUnit deve ser um dos seguintes valores: Digital Products, Operations',
  })
  businessUnit: string;

  @ApiProperty({
    description:
      'Array de alocações em projetos (obrigatório apenas para userType = project_member)',
    type: [ProjectAssignmentDto],
    example: [
      {
        projectId: 'projeto-alpha',
        roleInProject: 'colaborador',
      },
      {
        projectId: 'projeto-beta',
        roleInProject: 'gestor',
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectAssignmentDto)
  projectAssignments?: ProjectAssignmentDto[];

  @ApiProperty({
    description: 'ID do mentor designado (opcional, ignorado para userType = admin, rh, comite)',
    example: 'cmbyavwvk0002tzsgi5r3edy5',
    required: false,
  })
  @IsOptional()
  @IsString()
  mentorId?: string;

  @ApiProperty({
    // NOVO CAMPO: isImported
    description: 'Indica se o usuário está sendo importado de um sistema externo',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean() // NOVO: IsBoolean
  isImported?: boolean;
}
