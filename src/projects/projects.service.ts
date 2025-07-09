import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

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

  /**
   * Verifica se um usuário é gestor de pelo menos um projeto
   */
  async isManager(userId: string): Promise<boolean> {
    const managerRole = await this.prisma.userProjectRole.findFirst({
      where: {
        userId,
        role: 'MANAGER',
      },
    });

    return !!managerRole;
  }

  /**
   * Verifica se um usuário é líder de pelo menos um projeto
   */
  async isLeader(userId: string): Promise<boolean> {
    const leaderRole = await this.prisma.userProjectRole.findFirst({
      where: {
        userId,
        role: 'LEADER' as any, // Temporário até regenerar Prisma client
      },
    });

    return !!leaderRole;
  }

  /**
   * Verifica se um gestor pode avaliar um liderado específico
   * - O gestor deve ser MANAGER em pelo menos um projeto
   * - O liderado deve estar no mesmo projeto onde o gestor é MANAGER
   * - Não pode avaliar a si mesmo
   */
  async canManagerEvaluateUser(managerId: string, evaluatedUserId: string): Promise<boolean> {
    // Não pode avaliar a si mesmo
    if (managerId === evaluatedUserId) {
      return false;
    }

    // Verificar se o usuário avaliado existe
    const evaluatedUser = await this.prisma.user.findUnique({
      where: { id: evaluatedUserId },
    });
    if (!evaluatedUser) {
      return false;
    }

    // Buscar projetos onde o manager tem role de MANAGER
    const managerProjects = await this.prisma.userProjectRole.findMany({
      where: {
        userId: managerId,
        role: 'MANAGER',
      },
      select: {
        projectId: true,
      },
    });

    if (managerProjects.length === 0) {
      return false;
    }

    const managerProjectIds = managerProjects.map(p => p.projectId);

    // Verificar se o usuário avaliado está em algum dos projetos onde o manager é gestor
    const evaluatedUserInProject = await this.prisma.userProjectRole.findFirst({
      where: {
        userId: evaluatedUserId,
        projectId: { in: managerProjectIds },
      },
    });

    return !!evaluatedUserInProject;
  }

  /**
   * Busca todos os liderados que um gestor pode avaliar
   */
  async getEvaluableSubordinates(managerId: string) {
    // Buscar projetos onde o manager tem role de MANAGER
    const managerProjects = await this.prisma.userProjectRole.findMany({
      where: {
        userId: managerId,
        role: 'MANAGER',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (managerProjects.length === 0) {
      return [];
    }

    const managerProjectIds = managerProjects.map(p => p.projectId);

    // Buscar todos os usuários que estão nos projetos onde o manager é gestor
    const subordinates = await this.prisma.userProjectRole.findMany({
      where: {
        projectId: { in: managerProjectIds },
        userId: { not: managerId }, // Excluir o próprio gestor
      },
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Agrupar por projeto
    const result = managerProjects.map(managerProject => {
      const projectSubordinates = subordinates
        .filter(sub => sub.projectId === managerProject.projectId)
        .map(sub => ({
          id: sub.user.id,
          name: sub.user.name,
          email: sub.user.email,
          jobTitle: sub.user.jobTitle,  
          seniority: sub.user.seniority,
          role: sub.role,
        }));

      return {
        projectId: managerProject.project.id,
        projectName: managerProject.project.name,
        subordinates: projectSubordinates,
      };
    });

    return result;
  }

  /**
   * Busca overview completo do usuário incluindo projetos, gestão e mentoria
   */
  async getUserOverview(userId: string) {
    // 1. Buscar informações básicas do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        mentorId: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // 2. Buscar projetos do usuário com suas roles
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

    // 3. Para cada projeto, buscar roles, subordinados gerenciados e liderados
    const projectsWithManagement = await Promise.all(
      userProjectAssignments
        .filter((assignment) => assignment.project.isActive)
        .map(async (assignment) => {
          const project = assignment.project;
          
          // Buscar roles do usuário neste projeto
          const userRoles = await this.getUserRolesInProject(userId, project.id);
          
          // Verificar se é gestor neste projeto
          const isManagerInProject = userRoles.includes('MANAGER');
          
          // Verificar se é líder neste projeto
          const isLeaderInProject = userRoles.includes('LEADER');
          
          // Buscar subordinados gerenciados neste projeto (se for gestor)
          let managedSubordinates: Array<{
            id: string;
            name: string;
            email: string;
            jobTitle: string;
          }> = [];
          if (isManagerInProject) {
            const subordinates = await this.prisma.userProjectRole.findMany({
              where: {
                projectId: project.id,
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    jobTitle: true,
                  },
                },
              },
            });

            managedSubordinates = subordinates.map(sub => ({
              id: sub.user.id,
              name: sub.user.name,
              email: sub.user.email,
              jobTitle: sub.user.jobTitle,
            }));
          }

          // Buscar pessoas lideradas neste projeto (se for líder)
          let ledSubordinates: Array<{
            id: string;
            name: string;
            email: string;
            jobTitle: string;
          }> = [];
          if (isLeaderInProject) {
            const ledPeople = await this.prisma.userProjectRole.findMany({
              where: {
                projectId: project.id,
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    jobTitle: true,
                  },
                },
              },
            });

            ledSubordinates = ledPeople.map(led => ({
              id: led.user.id,
              name: led.user.name,
              email: led.user.email,
              jobTitle: led.user.jobTitle,
            }));
          }

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            isActive: project.isActive,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            userRoles,
            managedSubordinates,
            ledSubordinates,
            isManagerInProject,
            isLeaderInProject,
          };
        })
    );

         // 4. Buscar informações do mentor (se tiver)
     let mentor: {
       id: string;
       name: string;
       email: string;
       jobTitle: string;
     } | null = null;
     if (user.mentorId) {
       const mentorData = await this.prisma.user.findUnique({
         where: { id: user.mentorId },
         select: {
           id: true,
           name: true,
           email: true,
           jobTitle: true,
         },
       });

       if (mentorData) {
         mentor = {
           id: mentorData.id,
           name: mentorData.name,
           email: mentorData.email,
           jobTitle: mentorData.jobTitle,
         };
       }
     }

    // 5. Buscar pessoas que o usuário mentora
    const mentees = await this.prisma.user.findMany({
      where: {
        mentorId: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
      },
    });

    const menteesFormatted = mentees.map(mentee => ({
      id: mentee.id,
      name: mentee.name,
      email: mentee.email,
      jobTitle: mentee.jobTitle,
    }));

    // 6. Verificar se é gestor em pelo menos um projeto
    const isManager = await this.isManager(userId);

    // 7. Verificar se é líder em pelo menos um projeto
    const isLeader = await this.isLeader(userId);

    // 8. Montar resposta
    return {
      projects: projectsWithManagement.sort((a, b) => a.name.localeCompare(b.name)),
      mentor,
      mentees: menteesFormatted,
      hasMentor: !!mentor,
      isMentor: mentees.length > 0,
      isManager,
      isLeader,
    };
  }

  /**
   * Busca overview completo de qualquer usuário para administradores
   * Inclui informações pessoais completas do usuário
   */
  async getAdminUserOverview(userId: string) {
    // 1. Buscar informações completas do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        mentorId: true,
        managerId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 2. Buscar projetos do usuário com suas roles
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

    // 3. Para cada projeto, buscar roles, subordinados gerenciados e liderados
    const projectsWithManagement = await Promise.all(
      userProjectAssignments
        .filter((assignment) => assignment.project.isActive)
        .map(async (assignment) => {
          const project = assignment.project;
          
          // Buscar roles do usuário neste projeto
          const userRoles = await this.getUserRolesInProject(userId, project.id);
          
          // Verificar se é gestor neste projeto
          const isManagerInProject = userRoles.includes('MANAGER');
          
          // Verificar se é líder neste projeto
          const isLeaderInProject = userRoles.includes('LEADER');
          
          // Buscar subordinados gerenciados neste projeto (se for gestor)
          let managedSubordinates: Array<{
            id: string;
            name: string;
            email: string;
            jobTitle: string;
          }> = [];
          if (isManagerInProject) {
            const subordinates = await this.prisma.userProjectRole.findMany({
              where: {
                projectId: project.id,
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    jobTitle: true,
                  },
                },
              },
            });

            managedSubordinates = subordinates.map(sub => ({
              id: sub.user.id,
              name: sub.user.name,
              email: sub.user.email,
              jobTitle: sub.user.jobTitle,
            }));
          }

          // Buscar pessoas lideradas neste projeto (se for líder)
          let ledSubordinates: Array<{
            id: string;
            name: string;
            email: string;
            jobTitle: string;
          }> = [];
          if (isLeaderInProject) {
            const ledPeople = await this.prisma.userProjectRole.findMany({
              where: {
                projectId: project.id,
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    jobTitle: true,
                  },
                },
              },
            });

            ledSubordinates = ledPeople.map(led => ({
              id: led.user.id,
              name: led.user.name,
              email: led.user.email,
              jobTitle: led.user.jobTitle,
            }));
          }

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            isActive: project.isActive,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            userRoles,
            managedSubordinates,
            ledSubordinates,
            isManagerInProject,
            isLeaderInProject,
          };
        })
    );

    // 4. Buscar informações do mentor (se tiver)
    let mentor: {
      id: string;
      name: string;
      email: string;
      jobTitle: string;
    } | null = null;
    if (user.mentorId) {
      const mentorData = await this.prisma.user.findUnique({
        where: { id: user.mentorId },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      });

      if (mentorData) {
        mentor = {
          id: mentorData.id,
          name: mentorData.name,
          email: mentorData.email,
          jobTitle: mentorData.jobTitle,
        };
      }
    }

    // 5. Buscar pessoas que o usuário mentora
    const mentees = await this.prisma.user.findMany({
      where: {
        mentorId: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
      },
    });

    const menteesFormatted = mentees.map(mentee => ({
      id: mentee.id,
      name: mentee.name,
      email: mentee.email,
      jobTitle: mentee.jobTitle,
    }));

    // 6. Verificar se é gestor em pelo menos um projeto
    const isManager = await this.isManager(userId);

    // 7. Verificar se é líder em pelo menos um projeto
    const isLeader = await this.isLeader(userId);

    // 8. Buscar manager name, leader name e contadores para compatibilidade
    let managerName: string | null = null;
    let leaderName: string | null = null;
    let directReportsCount = 0;
    let directLeadershipCount = 0;

    try {
      // Parse roles for compatibility
      const rolesArray = user.roles ? JSON.parse(user.roles) : [];
      
      // Count direct reports
      const directReports = await this.prisma.user.findMany({
        where: {
          managerId: userId,
          isActive: true,
        },
        select: { id: true },
      });
      directReportsCount = directReports.length;

      // Get manager name if managerId exists in old structure
      if (user.managerId) {
        const managerData = await this.prisma.user.findUnique({
          where: { id: user.managerId },
          select: { name: true },
        });
        managerName = managerData?.name || null;
      }

      // Get leader name if leaderId exists in new structure
      const userWithLeader = await this.prisma.$queryRaw`
        SELECT leaderId FROM users WHERE id = ${userId}
      ` as any[];
      
      if (userWithLeader[0]?.leaderId) {
        const leaderData = await this.prisma.user.findUnique({
          where: { id: userWithLeader[0].leaderId },
          select: { name: true },
        });
        leaderName = leaderData?.name || null;
      }

      // Count direct leadership using raw SQL
      const directLeadershipResult = await this.prisma.$queryRaw`
        SELECT directLeadership FROM users WHERE id = ${userId}
      ` as any[];
      
      if (directLeadershipResult[0]?.directLeadership) {
        const directLeadershipIds = JSON.parse(directLeadershipResult[0].directLeadership) as string[];
        directLeadershipCount = directLeadershipIds.length;
      }
    } catch (error) {
      console.warn('Erro ao processar dados legados:', error);
    }

    // 9. Montar resposta com dados completos do usuário
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles ? JSON.parse(user.roles) : [],
        jobTitle: user.jobTitle,
        seniority: user.seniority,
        careerTrack: user.careerTrack,
        businessUnit: user.businessUnit,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        managerName,
        leaderName,
        directReportsCount,
        directLeadershipCount,
      },
      projects: projectsWithManagement.sort((a, b) => a.name.localeCompare(b.name)),
      mentor,
      mentees: menteesFormatted,
      hasMentor: !!mentor,
      isMentor: mentees.length > 0,
      isManager,
      isLeader,
    };
  }

  /**
   * @description Obtém as notas de um projeto específico a partir do arquivo evaluations.json.
   * @param {string} projectId O ID do projeto.
   * @returns {Promise<any>} As notas do projeto específico.
   */
  async getProjectScores(projectId: string): Promise<any> {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'evaluations.json');
    try {
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (!data.projetos || !Array.isArray(data.projetos) || data.projetos.length === 0) {
        throw new NotFoundException('Seção "projetos" não encontrada ou vazia no arquivo evaluations.json.');
      }

      // As notas estão dentro do primeiro elemento do array "projetos"
      const allProjectScores = data.projetos[0];

      if (!allProjectScores || typeof allProjectScores !== 'object') {
        throw new InternalServerErrorException('Formato de dados de projetos inválido.');
      }

      const projectScores = allProjectScores[projectId];

      if (projectScores === undefined) {
        throw new NotFoundException(`Projeto com ID "${projectId}" não encontrado no arquivo de avaliações.`);
      }

      return projectScores;
    } catch (error) {
      if (error.code === 'ENOENT') throw new NotFoundException('Arquivo evaluations.json não encontrado.');
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) throw error;
      console.error('Erro ao ler ou processar o arquivo de avaliações:', error);
      throw new InternalServerErrorException('Falha ao extrair as notas do projeto.');
    }
  }
}
