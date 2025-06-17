import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectDto, ProjectWithUserRolesDto, ProjectTeammatesDto, EvaluableUsersResponseDto } from './dto';

@ApiTags('Projetos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('teammates')
  @ApiOperation({
    summary: 'Buscar colegas de equipe por projeto',
    description:
      'Retorna todas as pessoas que trabalham nos mesmos projetos que o usuário logado, organizadas por projeto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de colegas por projeto retornada com sucesso',
    type: [ProjectTeammatesDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getTeammates(@CurrentUser() user: User) {
    return this.projectsService.getTeammatesByProjects(user.id);
  }

  @Get('evaluable-users')
  @ApiOperation({
    summary: 'Buscar usuários que podem ser avaliados, organizados por relacionamento',
    description:
      'Retorna todos os usuários que o usuário logado pode avaliar, separados por colegas, gestores e mentores',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários avaliáveis retornada com sucesso',
    type: EvaluableUsersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getEvaluableUsers(@CurrentUser() user: User) {
    return this.projectsService.getEvaluableUsers(user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar projetos do usuário com suas roles',
    description: 'Retorna apenas os projetos em que o usuário logado está atribuído, incluindo suas roles específicas em cada projeto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de projetos do usuário com roles retornada com sucesso',
    type: [ProjectWithUserRolesDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getProjects(@CurrentUser() user: User) {
    return this.projectsService.getUserProjects(user.id);
  }

  @Get('teammates-with-roles')
  @ApiOperation({
    summary: 'Listar colegas de trabalho por projetos com roles específicas',
    description: 'Lista todos os colegas de trabalho com suas roles específicas em cada projeto (NOVA FUNCIONALIDADE).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de colegas por projeto com roles recuperada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          projectId: { type: 'string', example: 'clzf8x9y20002abcdef123457' },
          projectName: { type: 'string', example: 'Sistema de Avaliação 360' },
          projectDescription: { type: 'string', example: 'Plataforma para avaliações de performance' },
          teammates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clzf8x9y20001abcdef123456' },
                name: { type: 'string', example: 'Ana Beatriz Santos' },
                email: { type: 'string', example: 'ana.santos@rocketcorp.com' },
                jobTitle: { type: 'string', example: 'Desenvolvedora Frontend Pleno' },
                seniority: { type: 'string', example: 'Pleno' },
                projectRoles: {
                  type: 'array',
                  items: { type: 'string', enum: ['MANAGER', 'TECH_LEAD', 'COLLABORATOR', 'STAKEHOLDER', 'SCRUM_MASTER'] },
                  example: ['COLLABORATOR', 'TECH_LEAD']
                },
              },
            },
          },
        },
      },
    },
  })
  async getTeammatesWithRoles(@CurrentUser() user: User) {
    return this.projectsService.getTeammatesByProjectsWithRoles(user.id);
  }
}
