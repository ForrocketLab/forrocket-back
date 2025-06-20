import { Injectable } from '@nestjs/common';

import { EvaluableUserDto, EvaluableUsersResponseDto } from './dto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca todas as pessoas que trabalham nos mesmos projetos que o usuário
   * Retorna separadamente por projeto
   */
  async getTeammatesByProjects(userId: string) {
    // Buscar o usuário atual com seus projetos
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        projects: true,
        managerId: true,
      },
    });

    if (!currentUser || !currentUser.projects) {
      return [];
    }

    const userProjects = JSON.parse(currentUser.projects) as string[];
    if (!userProjects.length) {
      return [];
    }

    // Buscar todos os usuários que têm pelo menos um projeto em comum
    const allUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId }, // Excluir o usuário atual
        isActive: true,
        projects: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        projects: true,
        managerId: true,
        roles: true,
      },
    });

    // Agrupar por projeto
    const projectTeammates = userProjects.map((projectName) => {
      const teammates = allUsers
        .filter((user) => {
          if (!user.projects) return false;
          const userProjectsList = JSON.parse(user.projects) as string[];
          return userProjectsList.includes(projectName);
        })
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          seniority: user.seniority,
          roles: JSON.parse(user.roles) as string[],
          isManager: user.id === currentUser.managerId,
        }));

      return {
        projectName,
        teammates,
      };
    });

    return projectTeammates;
  }

  /**
   * Verifica se dois usuários trabalham no mesmo projeto
   */
  async areTeammates(userId1: string, userId2: string): Promise<boolean> {
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId1 },
        select: { projects: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId2 },
        select: { projects: true },
      }),
    ]);

    if (!user1?.projects || !user2?.projects) {
      return false;
    }

    const projects1 = JSON.parse(user1.projects) as string[];
    const projects2 = JSON.parse(user2.projects) as string[];

    // Verificar se há interseção entre os projetos
    return projects1.some((project) => projects2.includes(project));
  }

  /**
   * Verifica se um usuário pode avaliar outro (mesmo projeto ou é seu gestor)
   */
  async canEvaluateUser(evaluatorId: string, evaluatedId: string): Promise<boolean> {
    // Buscar informações dos dois usuários
    const [evaluator, evaluated] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: evaluatorId },
        select: { projects: true, managerId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: evaluatedId },
        select: { projects: true, managerId: true },
      }),
    ]);

    if (!evaluator || !evaluated) {
      return false;
    }

    // 1. Verificar se trabalham no mesmo projeto
    const areTeammates = await this.areTeammates(evaluatorId, evaluatedId);
    if (areTeammates) {
      return true;
    }

    // 2. Verificar se o avaliado é gestor do avaliador (pode avaliar seu gestor)
    if (evaluatedId === evaluator.managerId) {
      return true;
    }

    return false;
  }

  /**
   * Busca todos os usuários que o usuário atual pode avaliar, organizados por tipo de relacionamento
   */
  async getEvaluableUsers(userId: string): Promise<EvaluableUsersResponseDto> {
    // Buscar o usuário atual
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        projects: true,
        managerId: true,
        mentorId: true,
      },
    });

    if (!currentUser) {
      return {
        colleagues: [],
        managers: [],
        mentors: [],
      };
    }

    const userProjects = currentUser.projects ? (JSON.parse(currentUser.projects) as string[]) : [];

    // Buscar todos os usuários ativos exceto o atual
    const allUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        projects: true,
        roles: true,
      },
    });

    // Separar por tipo de relacionamento
    const colleagues: EvaluableUserDto[] = [];
    const managers: EvaluableUserDto[] = [];
    const mentors: EvaluableUserDto[] = [];

    for (const user of allUsers) {
      const userRoles = JSON.parse(user.roles) as string[];
      const userInfo: EvaluableUserDto = {
        id: user.id,
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        seniority: user.seniority,
        roles: userRoles,
      };

      // 1. Verificar se é colega de trabalho (mesmo projeto) - excluir se já for gestor ou mentor
      if (user.projects && user.id !== currentUser.managerId && user.id !== currentUser.mentorId) {
        const userProjectsList = JSON.parse(user.projects) as string[];
        const hasCommonProject = userProjects.some((project) => userProjectsList.includes(project));
        if (hasCommonProject) {
          colleagues.push(userInfo);
        }
      }

      // 2. Verificar se é o gestor do usuário atual
      if (user.id === currentUser.managerId) {
        managers.push(userInfo);
      }

      // 3. Verificar se é o mentor do usuário atual
      if (user.id === currentUser.mentorId) {
        mentors.push(userInfo);
      }
    }

    return {
      colleagues,
      managers,
      mentors,
    };
  }

  /**
   * Verifica se um usuário pode avaliar outro na avaliação 360 (colegas + gestores)
   */
  async canEvaluateUserIn360(evaluatorId: string, evaluatedId: string): Promise<boolean> {
    // Buscar informações dos dois usuários
    const [evaluator, evaluated] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: evaluatorId },
        select: { projects: true, managerId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: evaluatedId },
        select: { projects: true },
      }),
    ]);

    if (!evaluator || !evaluated) {
      return false;
    }

    // 1. Verificar se trabalham no mesmo projeto
    const areTeammates = await this.areTeammates(evaluatorId, evaluatedId);
    if (areTeammates) {
      return true;
    }

    // 2. Verificar se o avaliado é gestor do avaliador
    if (evaluatedId === evaluator.managerId) {
      return true;
    }

    return false;
  }

  /**
   * Verifica se um usuário pode avaliar outro na avaliação de mentoring (apenas mentores)
   */
  async canEvaluateUserInMentoring(evaluatorId: string, mentorId: string): Promise<boolean> {
    // Buscar o usuário avaliador
    const evaluator = await this.prisma.user.findUnique({
      where: { id: evaluatorId },
      select: { mentorId: true },
    });

    if (!evaluator) {
      return false;
    }

    // Verificar se o mentor sendo avaliado é realmente o mentor do usuário
    return mentorId === evaluator.mentorId;
  }

  /**
   * Busca todos os projetos ativos
   */
  async getAllProjects() {
    return this.prisma.project.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca apenas os projetos em que o usuário está atribuído com suas roles específicas
   */
  async getUserProjects(userId: string) {
    // Buscar projetos através da nova estrutura UserProjectAssignment
    const userProjectAssignments = await this.prisma.userProjectAssignment.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Para cada projeto, buscar as roles específicas do usuário
    const projectsWithRoles = await Promise.all(
      userProjectAssignments
        .filter((assignment) => assignment.project.isActive) // Filtrar apenas projetos ativos
        .map(async (assignment) => {
          const project = assignment.project;
          
          // Buscar roles específicas do usuário neste projeto
          const userRoles = await this.getUserRolesInProject(userId, project.id);
          
          return {
            ...project,
            userRoles, // NOVA: roles específicas do usuário neste projeto
          };
        })
    );

    // Ordenar por nome
    return projectsWithRoles.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * NOVA FUNCIONALIDADE: Busca teammates por projeto com roles específicas
   */
  async getTeammatesByProjectsWithRoles(userId: string) {
    // Buscar projetos onde o usuário tem atribuição via nova estrutura
    const userProjectAssignments = await this.prisma.userProjectAssignment.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            userAssignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    jobTitle: true,
                    seniority: true,
                  },
                },
              },
            },
            userProjectRoles: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return userProjectAssignments.map((assignment) => {
      const project = assignment.project;
      
      // Mapear teammates com suas roles específicas
      const teammates = project.userAssignments
        .filter((ua) => ua.userId !== userId)
        .map((ua) => {
          // Buscar roles específicas deste usuário neste projeto
          const userRoles = project.userProjectRoles
            .filter((upr) => upr.userId === ua.userId)
            .map((upr) => upr.role);

          return {
            id: ua.user.id,
            name: ua.user.name,
            email: ua.user.email,
            jobTitle: ua.user.jobTitle,
            seniority: ua.user.seniority,
            projectRoles: userRoles, // NOVA: roles específicas neste projeto
          };
        });

      return {
        projectId: project.id,
        projectName: project.name,
        projectDescription: project.description,
        teammates,
      };
    });
  }

  /**
   * NOVA FUNCIONALIDADE: Verifica roles específicas de um usuário em um projeto
   */
  async getUserRolesInProject(userId: string, projectId: string): Promise<string[]> {
    const userProjectRoles = await this.prisma.userProjectRole.findMany({
      where: {
        userId,
        projectId,
      },
      select: {
        role: true,
      },
    });

    return userProjectRoles.map((upr) => upr.role);
  }

  /**
   * NOVA FUNCIONALIDADE: Verifica se usuário tem role específica em projeto
   */
  async hasRoleInProject(userId: string, projectId: string, role: any): Promise<boolean> {
    const userProjectRole = await this.prisma.userProjectRole.findFirst({
      where: {
        userId,
        projectId,
        role: role as any,
      },
    });

    return !!userProjectRole;
  }
}
