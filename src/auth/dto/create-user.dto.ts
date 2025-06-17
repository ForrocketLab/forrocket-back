import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum, IsOptional, MinLength, Matches, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para definir a alocação de um usuário em um projeto
 */
export class ProjectAssignmentDto {
  @ApiProperty({
    description: 'ID do projeto',
    example: 'projeto-alpha'
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Role do usuário no projeto',
    example: 'colaborador',
    enum: ['colaborador', 'gestor']
  })
  @IsEnum(['colaborador', 'gestor'])
  roleInProject: 'colaborador' | 'gestor';
}

/**
 * DTO para criação de novos usuários
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Silva Oliveira'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email corporativo do usuário (@rocketcorp.com)',
    example: 'ana.oliveira@rocketcorp.com'
  })
  @IsEmail()
  @Matches(/@rocketcorp\.com$/, {
    message: 'Email deve ter o domínio @rocketcorp.com'
  })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres)',
    example: 'MinhaSenh@123'
  })
  @IsString()
  @MinLength(8, {
    message: 'Senha deve ter pelo menos 8 caracteres'
  })
  password: string;

  @ApiProperty({
    description: 'Cargo/Posição do colaborador',
    example: 'Desenvolvedora Frontend',
    enum: ['Desenvolvedora Frontend', 'Desenvolvedor Backend', 'Product Designer', 'Product Manager', 'Tech Lead', 'DevOps Engineer', 'Data Analyst', 'QA Engineer']
  })
  @IsEnum(['Desenvolvedora Frontend', 'Desenvolvedor Backend', 'Product Designer', 'Product Manager', 'Tech Lead', 'DevOps Engineer', 'Data Analyst', 'QA Engineer'])
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Pleno',
    enum: ['Júnior', 'Pleno', 'Sênior', 'Principal', 'Staff']
  })
  @IsEnum(['Júnior', 'Pleno', 'Sênior', 'Principal', 'Staff'])
  seniority: string;

  @ApiProperty({
    description: 'Trilha de carreira',
    example: 'Tech',
    enum: ['Tech', 'Business']
  })
  @IsEnum(['Tech', 'Business'])
  careerTrack: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products',
    enum: ['Digital Products', 'Operations']
  })
  @IsEnum(['Digital Products', 'Operations'])
  businessUnit: string;

  @ApiProperty({
    description: 'Array de alocações em projetos',
    type: [ProjectAssignmentDto],
    example: [
      {
        projectId: 'projeto-alpha',
        roleInProject: 'colaborador'
      },
      {
        projectId: 'projeto-beta',
        roleInProject: 'gestor'
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Pelo menos um projeto deve ser atribuído'
  })
  @ValidateNested({ each: true })
  @Type(() => ProjectAssignmentDto)
  projectAssignments: ProjectAssignmentDto[];

  @ApiProperty({
    description: 'ID do mentor designado (opcional)',
    example: 'cmbyavwvk0002tzsgi5r3edy5',
    required: false
  })
  @IsOptional()
  @IsString()
  mentorId?: string;
} 