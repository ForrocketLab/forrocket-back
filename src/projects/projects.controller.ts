import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          projectName: { type: 'string', example: 'projeto-app-mobile' },
          teammates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-123' },
                name: { type: 'string', example: 'Ana Oliveira' },
                email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
                jobTitle: { type: 'string', example: 'Desenvolvedora Frontend' },
                seniority: { type: 'string', example: 'Pleno' },
                roles: { type: 'array', items: { type: 'string' }, example: ['colaborador'] },
                isManager: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
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
    schema: {
      type: 'object',
      properties: {
        colleagues: {
          type: 'array',
          description: 'Colegas de trabalho (mesmo projeto)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user-123' },
              name: { type: 'string', example: 'Ana Oliveira' },
              email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
              jobTitle: { type: 'string', example: 'Desenvolvedora Frontend' },
              seniority: { type: 'string', example: 'Pleno' },
              roles: { type: 'array', items: { type: 'string' }, example: ['colaborador'] },
            },
          },
        },
        managers: {
          type: 'array',
          description: 'Gestores diretos',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user-456' },
              name: { type: 'string', example: 'Bruno Mendes' },
              email: { type: 'string', example: 'bruno.mendes@rocketcorp.com' },
              jobTitle: { type: 'string', example: 'Tech Lead' },
              seniority: { type: 'string', example: 'Sênior' },
              roles: {
                type: 'array',
                items: { type: 'string' },
                example: ['colaborador', 'gestor'],
              },
            },
          },
        },
        mentors: {
          type: 'array',
          description: 'Mentores designados',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user-789' },
              name: { type: 'string', example: 'Carla Dias' },
              email: { type: 'string', example: 'carla.dias@rocketcorp.com' },
              jobTitle: { type: 'string', example: 'Head of Engineering' },
              seniority: { type: 'string', example: 'Principal' },
              roles: {
                type: 'array',
                items: { type: 'string' },
                example: ['colaborador', 'comite'],
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
  })
  async getEvaluableUsers(@CurrentUser() user: User) {
    return this.projectsService.getEvaluableUsers(user.id);
  }
}
