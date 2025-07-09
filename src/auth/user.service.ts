import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UserProfileDto, UserType } from './dto';
import * as bcrypt from 'bcryptjs';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  seniority: string;
  businessUnit: string;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Parse dos roles do usuário de forma segura
   */
  private parseUserRoles(roles: string | null | undefined): string[] {
    try {
      if (!roles || typeof roles !== 'string') {
        return ['colaborador']; // Valor padrão
      }
      const parsed = JSON.parse(roles);
      return Array.isArray(parsed) ? parsed : ['colaborador'];
    } catch (error) {
      console.error('Erro ao fazer parse dos roles:', error);
      return ['colaborador']; // Valor padrão em caso de erro
    }
  }

  /**
   * Cria um novo usuário aplicando todas as regras de negócio e validações
   * @param createUserDto - Dados para criação do usuário
   * @returns Usuário criado (sem o passwordHash)
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserProfileDto> {
    console.log('🔄 Iniciando criação de usuário:', createUserDto.email);

    // 1. VALIDAÇÕES INICIAIS
    await this.validateUserCreation(createUserDto);

    // 1.1. Remover campos não permitidos para papéis globais
    if (createUserDto.userType !== UserType.PROJECT_MEMBER) {
      // Remove projectAssignments e mentorId para admin, rh, comite
      delete (createUserDto as any).projectAssignments;
      delete (createUserDto as any).mentorId;
    }

    // 2. GERAÇÃO E PROCESSAMENTO AUTOMÁTICO DE CAMPOS
    const userData = await this.processUserData(createUserDto);

    // 3. CRIAÇÃO DO USUÁRIO NO BANCO DE DADOS
    const createdUser = await this.prisma.user.create({
      data: userData,
    });

    // 4. CRIAÇÃO DOS RELACIONAMENTOS (apenas para project_member)
    if (createUserDto.userType === UserType.PROJECT_MEMBER) {
      await this.createUserRelationships(createdUser.id, createUserDto);
    } else {
      // Para papéis globais, criar apenas o role assignment global
      await this.createGlobalRoleAssignment(createdUser.id, createUserDto.userType);
    }

    // 5. BUSCAR USUÁRIO COMPLETO PARA RETORNO
    const completeUser = await this.getUserProfile(createdUser.id);

    console.log('✅ Usuário criado com sucesso:', createUserDto.email);
    return completeUser;
  }

  /**
   * Valida se o usuário pode ser criado
   * @param createUserDto - Dados do usuário
   */
  private async validateUserCreation(createUserDto: CreateUserDto): Promise<void> {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este email já existe');
    }

    // Validações específicas por tipo de usuário
    if (createUserDto.userType === UserType.PROJECT_MEMBER) {
      // Para membros de projeto, projectAssignments é obrigatório
      if (!createUserDto.projectAssignments || createUserDto.projectAssignments.length === 0) {
        throw new BadRequestException('Membros de projeto devem ter pelo menos uma atribuição de projeto');
      }

      // Verificar se projetos existem e validar regras de gestão
      for (const assignment of createUserDto.projectAssignments) {
        const project = await this.prisma.project.findUnique({
          where: { id: assignment.projectId }
        });

        if (!project) {
          throw new BadRequestException(`Projeto com ID ${assignment.projectId} não encontrado`);
        }

        if (!project.isActive) {
          throw new BadRequestException(`Projeto ${project.name} não está ativo`);
        }

        // 🎯 NOVA VALIDAÇÃO: Verificar se projeto já tem gestor (apenas para role 'gestor')
        if (assignment.roleInProject === 'gestor') {
          const existingManager = await this.findProjectManager(assignment.projectId);
          
          if (existingManager) {
            throw new BadRequestException(
              `O projeto "${project.name}" já possui um gestor: ${existingManager.name}. ` +
              `Um projeto só pode ter um gestor ativo por vez.`
            );
          }
        }

        // 🎯 NOVA VALIDAÇÃO: Verificar se projeto já tem líder (apenas para role 'lider')
        if (assignment.roleInProject === 'lider') {
          const existingLeader = await this.findProjectLeader(assignment.projectId);
          
          if (existingLeader) {
            throw new BadRequestException(
              `O projeto "${project.name}" já possui um líder: ${existingLeader.name}. ` +
              `Um projeto só pode ter um líder ativo por vez.`
            );
          }
        }
      }

      // Verificar se mentor existe (se informado)
      if (createUserDto.mentorId) {
        const mentor = await this.prisma.user.findUnique({
          where: { id: createUserDto.mentorId }
        });

        if (!mentor) {
          throw new BadRequestException('Mentor não encontrado');
        }

        if (!mentor.isActive) {
          throw new BadRequestException('Mentor não está ativo');
        }
      }
    } else {
      // Para papéis globais (admin, RH, comitê), projectAssignments e mentorId devem ser ignorados
      if (createUserDto.projectAssignments && createUserDto.projectAssignments.length > 0) {
        console.log(`⚠️ Ignorando projectAssignments para usuário ${createUserDto.userType}: ${createUserDto.email}`);
      }

      if (createUserDto.mentorId) {
        console.log(`⚠️ Ignorando mentorId para usuário ${createUserDto.userType}: ${createUserDto.email}`);
      }
    }
  }

  /**
   * Processa e gera os dados automaticamente
   * @param createUserDto - Dados do usuário
   * @returns Dados processados para criação
   */
  private async processUserData(createUserDto: CreateUserDto): Promise<any> {
    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    // Determinar roles baseado no tipo de usuário
    let roles: string[] = [];
    let managerId: string | null = null;
    let mentorId: string | null = null;

    if (createUserDto.userType === UserType.PROJECT_MEMBER) {
      // Para membros de projeto, derivar roles das atribuições
      roles = ['colaborador'];
      const hasManagerRole = createUserDto.projectAssignments?.some(
        assignment => assignment.roleInProject === 'gestor'
      );
      const hasLeaderRole = createUserDto.projectAssignments?.some(
        assignment => assignment.roleInProject === 'lider'
      );
      
      if (hasManagerRole) {
        roles.push('gestor');
      }
      
      if (hasLeaderRole) {
        roles.push('lider');
      }

      // Encontrar manager (gestor do primeiro projeto como colaborador)
      const collaboratorAssignment = createUserDto.projectAssignments?.find(
        assignment => assignment.roleInProject === 'colaborador'
      );

      if (collaboratorAssignment) {
        const manager = await this.findProjectManager(collaboratorAssignment.projectId);
        if (manager) {
          managerId = manager.id;
        }
      }

      // Mentor (apenas para project_member)
      mentorId = createUserDto.mentorId || null;
    } else {
      // Para papéis globais, atribuir apenas o papel específico
      switch (createUserDto.userType) {
        case UserType.ADMIN:
          roles = ['admin'];
          break;
        case UserType.RH:
          roles = ['rh'];
          break;
        case UserType.COMITE:
          roles = ['comite'];
          break;
      }
      
      // Papéis globais não têm manager nem mentor
      managerId = null;
      mentorId = null;
    }

    return {
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash,
      roles: JSON.stringify(roles),
      jobTitle: createUserDto.jobTitle,
      seniority: createUserDto.seniority,
      careerTrack: createUserDto.careerTrack,
      businessUnit: createUserDto.businessUnit,
      managerId,
      mentorId,
      isActive: true,
      // Campos temporários (legacy) - serão migrados
      projects: createUserDto.userType === UserType.PROJECT_MEMBER 
        ? JSON.stringify(createUserDto.projectAssignments?.map(p => p.projectId) || [])
        : null,
      directReports: null,
    };
  }

  /**
   * Cria role assignment global para papéis globais
   * @param userId - ID do usuário criado
   * @param userType - Tipo do usuário
   */
  private async createGlobalRoleAssignment(userId: string, userType: UserType): Promise<void> {
    let role: string;

    switch (userType) {
      case UserType.ADMIN:
        role = 'ADMIN';
        break;
      case UserType.RH:
        role = 'RH';
        break;
      case UserType.COMITE:
        role = 'COMMITTEE';
        break;
      default:
        throw new BadRequestException(`Tipo de usuário inválido para role global: ${userType}`);
    }

    await this.prisma.userRoleAssignment.create({
      data: {
        userId,
        role: role as any
      }
    });

    console.log(`✅ Role global ${role} atribuído ao usuário ${userId}`);
  }

  /**
   * Encontra o gestor de um projeto
   * @param projectId - ID do projeto
   * @returns Gestor do projeto ou null
   */
  private async findProjectManager(projectId: string): Promise<{ id: string; name: string } | null> {
    // Buscar na nova estrutura UserProjectRole
    const managerRole = await this.prisma.userProjectRole.findFirst({
      where: {
        projectId,
        role: 'MANAGER'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (managerRole && managerRole.user.isActive) {
      return {
        id: managerRole.user.id,
        name: managerRole.user.name
      };
    }

    // Fallback: buscar na estrutura legacy
    const allUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        projects: { contains: projectId }
      },
      select: {
        id: true,
        name: true,
        roles: true
      }
    });

    for (const user of allUsers) {
      const userRoles = JSON.parse(user.roles) as string[];
      if (userRoles.includes('gestor')) {
        return {
          id: user.id,
          name: user.name
        };
      }
    }

    return null;
  }

  /**
   * Encontra o líder de um projeto específico
   * @param projectId - ID do projeto
   * @returns Dados do líder ou null se não encontrado
   */
  private async findProjectLeader(projectId: string): Promise<{ id: string; name: string } | null> {
    // Buscar leaderId do projeto usando query raw
    const projectData = await this.prisma.$queryRaw`
      SELECT leaderId FROM projects WHERE id = ${projectId}
    ` as any[];
    
    const leaderId = projectData[0]?.leaderId;
    
    if (leaderId) {
      // Buscar dados do líder
      const leaderData = await this.prisma.$queryRaw`
        SELECT id, name, isActive FROM users WHERE id = ${leaderId}
      ` as any[];
      
      const leader = leaderData[0];
      
      if (leader?.isActive) {
        return {
          id: leader.id,
          name: leader.name
        };
      }
    }

    return null;
  }

  /**
   * Cria os relacionamentos do usuário (apenas para project_member)
   * @param userId - ID do usuário criado
   * @param createUserDto - Dados originais
   */
  private async createUserRelationships(userId: string, createUserDto: CreateUserDto): Promise<void> {
    if (!createUserDto.projectAssignments) {
      return;
    }

    // Criar UserProjectAssignments
    for (const assignment of createUserDto.projectAssignments) {
      await this.prisma.userProjectAssignment.create({
        data: {
          userId,
          projectId: assignment.projectId
        }
      });

      // Criar UserProjectRole
      let role: string;
      if (assignment.roleInProject === 'gestor') {
        role = 'MANAGER';
      } else if (assignment.roleInProject === 'lider') {
        role = 'LEADER';
      } else {
        role = 'COLLABORATOR';
      }
      
      await this.prisma.userProjectRole.create({
        data: {
          userId,
          projectId: assignment.projectId,
          role: role as any // Temporário até regenerar Prisma client
        }
      });

      // Criar UserRoleAssignment para colaborador (todos membros de projeto são colaboradores)
      await this.prisma.userRoleAssignment.upsert({
        where: {
          userId_role: {
            userId,
            role: 'COLLABORATOR'
          }
        },
        update: {},
        create: {
          userId,
          role: 'COLLABORATOR'
        }
      });

      // Criar UserRoleAssignment para gestor (se aplicável)
      if (assignment.roleInProject === 'gestor') {
        await this.prisma.userRoleAssignment.upsert({
          where: {
            userId_role: {
              userId,
              role: 'MANAGER'
            }
          },
          update: {},
          create: {
            userId,
            role: 'MANAGER'
          }
        });
      }

      // Criar UserRoleAssignment para líder (se aplicável)
      if (assignment.roleInProject === 'lider') {
        await this.prisma.userRoleAssignment.upsert({
          where: {
            userId_role: {
              userId,
              role: 'LEADER' as any // Temporário até regenerar Prisma client
            }
          },
          update: {},
          create: {
            userId,
            role: 'LEADER' as any // Temporário até regenerar Prisma client
          }
        });

        // Atualizar o leaderId do projeto usando query raw
        await this.prisma.$executeRaw`
          UPDATE projects SET leaderId = ${userId} WHERE id = ${assignment.projectId}
        `;
      }
    }

    // Atualizar directReports dos projetos onde é gestor
    await this.updateDirectReports(userId, createUserDto);
    
    // Atualizar directReports dos gestores quando um novo colaborador é criado
    await this.updateManagerDirectReports(userId, createUserDto);
    
    // Atualizar directLeadership dos líderes quando um novo colaborador é criado
    await this.updateLeaderDirectLeadership(userId, createUserDto);
  }

  /**
   * Atualiza os directReports dos gestores
   * @param userId - ID do novo usuário
   * @param createUserDto - Dados do usuário
   */
  private async updateDirectReports(userId: string, createUserDto: CreateUserDto): Promise<void> {
    if (!createUserDto.projectAssignments) {
      return;
    }

    const managerAssignments = createUserDto.projectAssignments.filter(
      assignment => assignment.roleInProject === 'gestor'
    );

    for (const managerAssignment of managerAssignments) {
      // Buscar todos os colaboradores do projeto que não têm manager ou têm manager inativo
      const collaborators = await this.prisma.userProjectRole.findMany({
        where: {
          projectId: managerAssignment.projectId,
          role: 'COLLABORATOR',
          userId: { not: userId }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              isActive: true,
              managerId: true
            }
          }
        }
      });

      // Filtrar colaboradores ativos que não têm manager ou têm manager inativo
      const collaboratorsNeedingManager: typeof collaborators = [];
      
      for (const collaborator of collaborators) {
        if (!collaborator.user.isActive) continue;
        
        // Se não tem manager, precisa de um
        if (!collaborator.user.managerId) {
          collaboratorsNeedingManager.push(collaborator);
          continue;
        }
        
        // Se tem manager, verificar se o manager ainda está ativo e ainda é gestor do projeto
        const currentManager = await this.prisma.user.findUnique({
          where: { id: collaborator.user.managerId }
        });
        
        if (!currentManager || !currentManager.isActive) {
          collaboratorsNeedingManager.push(collaborator);
          continue;
        }
        
        // Verificar se o manager atual ainda é gestor deste projeto
        const managerRole = await this.prisma.userProjectRole.findFirst({
          where: {
            userId: collaborator.user.managerId,
            projectId: managerAssignment.projectId,
            role: 'MANAGER'
          }
        });
        
        if (!managerRole) {
          collaboratorsNeedingManager.push(collaborator);
        }
      }
      
      if (collaboratorsNeedingManager.length > 0) {
        const directReportsIds = collaboratorsNeedingManager.map(c => c.user.id);

        // 1. Atualizar o directReports do novo gestor
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { directReports: true }
        });
        
        let existingDirectReports: string[] = [];
        if (currentUser?.directReports) {
          existingDirectReports = JSON.parse(currentUser.directReports);
        }
        
        // Combinar com os novos direct reports (evitar duplicatas)
        const allDirectReports = [...new Set([...existingDirectReports, ...directReportsIds])];
        
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            directReports: JSON.stringify(allDirectReports)
          }
        });

        // 2. Atualizar o managerId de todos os colaboradores para apontar para o novo gestor
        await this.prisma.user.updateMany({
          where: {
            id: { in: directReportsIds },
            isActive: true
          },
          data: {
            managerId: userId
          }
        });

        console.log(`🔄 Atualizado managerId de ${directReportsIds.length} colaboradores do projeto ${managerAssignment.projectId} para apontar para o gestor ${userId}`);
      } else {
        console.log(`ℹ️ Todos os colaboradores do projeto ${managerAssignment.projectId} já têm um gestor ativo`);
      }
    }
  }

  /**
   * Atualiza os directReports dos gestores quando um novo colaborador é criado
   * @param userId - ID do novo colaborador
   * @param createUserDto - Dados do colaborador
   */
  private async updateManagerDirectReports(userId: string, createUserDto: CreateUserDto): Promise<void> {
    if (!createUserDto.projectAssignments) {
      return;
    }

    // Encontrar assignments onde este usuário é colaborador
    const collaboratorAssignments = createUserDto.projectAssignments.filter(
      assignment => assignment.roleInProject === 'colaborador'
    );

    for (const collaboratorAssignment of collaboratorAssignments) {
      // Encontrar o gestor atual deste projeto
      const projectManager = await this.findProjectManager(collaboratorAssignment.projectId);
      
      if (projectManager) {
        // Buscar o directReports atual do gestor
        const manager = await this.prisma.user.findUnique({
          where: { id: projectManager.id },
          select: { directReports: true }
        });
        
        let existingDirectReports: string[] = [];
        if (manager?.directReports) {
          try {
            existingDirectReports = JSON.parse(manager.directReports);
          } catch (error) {
            console.error('Erro ao fazer parse do directReports:', error);
            existingDirectReports = [];
          }
        }
        
        // Adicionar o novo colaborador se não estiver já na lista
        if (!existingDirectReports.includes(userId)) {
          existingDirectReports.push(userId);
          
          // Atualizar o directReports do gestor
          await this.prisma.user.update({
            where: { id: projectManager.id },
            data: {
              directReports: JSON.stringify(existingDirectReports)
            }
          });

          // Atualizar o managerId do novo colaborador
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              managerId: projectManager.id
            }
          });

          console.log(`✅ Adicionado colaborador ${userId} ao directReports do gestor ${projectManager.id} no projeto ${collaboratorAssignment.projectId}`);
        }
      }
    }
  }

  /**
   * Atualiza os directLeadership dos líderes quando um novo colaborador é criado
   * @param userId - ID do novo colaborador
   * @param createUserDto - Dados do colaborador
   */
  private async updateLeaderDirectLeadership(userId: string, createUserDto: CreateUserDto): Promise<void> {
    if (!createUserDto.projectAssignments) {
      return;
    }

    // Encontrar assignments onde este usuário é colaborador
    const collaboratorAssignments = createUserDto.projectAssignments.filter(
      assignment => assignment.roleInProject === 'colaborador'
    );

    for (const collaboratorAssignment of collaboratorAssignments) {
             // Encontrar o líder atual deste projeto (buscar diretamente no projeto)
       const project = await this.prisma.project.findUnique({
         where: { id: collaboratorAssignment.projectId },
         select: { 
           id: true,
           name: true
         }
       });
       
       // Buscar leaderId do projeto usando query raw temporária
       const projectWithLeader = await this.prisma.$queryRaw`
         SELECT leaderId FROM projects WHERE id = ${collaboratorAssignment.projectId}
       ` as any[];
       
       const leaderId = projectWithLeader[0]?.leaderId;
       
       if (leaderId) {
         // Verificar se o líder ainda está ativo
         const leaderData = await this.prisma.$queryRaw`
           SELECT id, name, isActive, directLeadership FROM users WHERE id = ${leaderId}
         ` as any[];
         
         const leader = leaderData[0];
         
         if (leader?.isActive) {
           let existingDirectLeadership: string[] = [];
           if (leader.directLeadership) {
            try {
              existingDirectLeadership = JSON.parse(leader.directLeadership);
            } catch (error) {
              console.error('Erro ao fazer parse do directLeadership:', error);
              existingDirectLeadership = [];
            }
          }
          
                     // Adicionar o novo colaborador se não estiver já na lista
           if (!existingDirectLeadership.includes(userId)) {
             existingDirectLeadership.push(userId);
             
             // Atualizar o directLeadership do líder usando query raw
             await this.prisma.$executeRaw`
               UPDATE users SET directLeadership = ${JSON.stringify(existingDirectLeadership)} WHERE id = ${leader.id}
             `;

             // Atualizar o leaderId do novo colaborador usando query raw
             await this.prisma.$executeRaw`
               UPDATE users SET leaderId = ${leader.id} WHERE id = ${userId}
             `;

             console.log(`✅ Adicionado colaborador ${userId} ao directLeadership do líder ${leader.id} no projeto ${collaboratorAssignment.projectId}`);
           }
        }
      }
    }
  }

  /**
   * Busca o perfil completo de um usuário
   * @param userId - ID do usuário
   * @returns Perfil completo do usuário
   */
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar roles de projetos
    const projectRoles = await this.getProjectRoles(userId);

    // Buscar nome do mentor
    let mentorName: string | undefined;
    if (user.mentorId) {
      const mentor = await this.prisma.user.findUnique({
        where: { id: user.mentorId },
        select: { name: true }
      });
      mentorName = mentor?.name || undefined;
    }

    // Buscar nome do manager
    let managerName: string | undefined;
    if (user.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: user.managerId },
        select: { name: true }
      });
      managerName = manager?.name || undefined;
    }

    // Buscar nomes dos direct reports
    let directReportsNames: string[] | undefined;
    if (user.directReports) {
      const directReportsIds = JSON.parse(user.directReports) as string[];
      const directReports = await this.prisma.user.findMany({
        where: {
          id: { in: directReportsIds },
          isActive: true
        },
        select: { name: true }
      });
      directReportsNames = directReports.map(dr => dr.name);
    }

    // Buscar nome do líder
    let leaderName: string | undefined;
    if ((user as any).leaderId) {
      const leader = await this.prisma.user.findUnique({
        where: { id: (user as any).leaderId },
        select: { name: true }
      });
      leaderName = leader?.name || undefined;
    }

    // Buscar nomes do direct leadership
    let directLeadershipNames: string[] | undefined;
    if ((user as any).directLeadership) {
      const directLeadershipIds = JSON.parse((user as any).directLeadership) as string[];
      const directLeadership = await this.prisma.user.findMany({
        where: {
          id: { in: directLeadershipIds },
          isActive: true
        },
        select: { name: true }
      });
      directLeadershipNames = directLeadership.map(dl => dl.name);
    }

    // Buscar nomes das pessoas que mentora
    let mentoringNames: string[] | undefined;
    if ((user as any).mentoringIds) {
      const mentoringIdsArray = JSON.parse((user as any).mentoringIds) as string[];
      const mentoring = await this.prisma.user.findMany({
        where: {
          id: { in: mentoringIdsArray },
          isActive: true
        },
        select: { name: true }
      });
      mentoringNames = mentoring.map(m => m.name);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: JSON.parse(user.roles) as string[],
      jobTitle: user.jobTitle,
      seniority: user.seniority,
      careerTrack: user.careerTrack,
      businessUnit: user.businessUnit,
      projectRoles,
      managerId: user.managerId || undefined,
      managerName,
      directReports: user.directReports ? JSON.parse(user.directReports) : undefined,
      directReportsNames,
      mentorId: user.mentorId || undefined,
      mentorName,
      // Novos campos de liderança
      leaderId: (user as any).leaderId || undefined,
      leaderName,
      directLeadership: (user as any).directLeadership ? JSON.parse((user as any).directLeadership) : undefined,
      directLeadershipNames,
      mentoringIds: (user as any).mentoringIds ? JSON.parse((user as any).mentoringIds) : undefined,
      mentoringNames,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Busca os projetos e as roles de um usuário específico.
   * A verificação de existência e permissão do usuário deve ser feita pelo chamador (Controller).
   * @param userId - ID do usuário
   * @returns Array de projetos com suas roles
   */
  async getUserProjects(userId: string): Promise<{ projectId: string; projectName: string; roles: string[] }[]> {
    // Este método assume que o usuário já foi validado pelo controller.
    // Ele reutiliza a lógica privada que já busca os projetos e roles.
    return this.getProjectRoles(userId);
  }

  /**
   * Busca as roles de projeto de um usuário
   * @param userId - ID do usuário
   * @returns Array de roles por projeto
   */
  private async getProjectRoles(userId: string): Promise<{ projectId: string; projectName: string; roles: string[] }[]> {
    const assignments = await this.prisma.userProjectAssignment.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    const projectRoles: { projectId: string; projectName: string; roles: string[] }[] = [];
    
    for (const assignment of assignments) {
      if (!assignment.project.isActive) continue;

      const roles = await this.prisma.userProjectRole.findMany({
        where: {
          userId,
          projectId: assignment.project.id
        },
        select: { role: true }
      });

      const roleNames = roles.map(r => r.role.toString());

      projectRoles.push({
        projectId: assignment.project.id,
        projectName: assignment.project.name,
        roles: roleNames
      });
    }

    return projectRoles;
  }

  /**
   * Busca todos os usuários do sistema (apenas para RH/Admin)
   * @returns Lista de todos os usuários com informações básicas
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managerId: true,
        directReports: true,
      },
      orderBy: [
        { businessUnit: 'asc' },
        { name: 'asc' }
      ]
    });

    // Buscar nomes dos managers para cada usuário
    const managerIds = users
      .map(user => user.managerId)
      .filter(id => id !== null) as string[];

    const managers = await this.prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, name: true }
    });

    const managerMap = new Map(managers.map(m => [m.id, m.name]));

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: JSON.parse(user.roles) as string[],
      jobTitle: user.jobTitle,
      seniority: user.seniority,
      careerTrack: user.careerTrack,
      businessUnit: user.businessUnit,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      managerName: user.managerId ? managerMap.get(user.managerId) || null : null,
      directReportsCount: user.directReports ? JSON.parse(user.directReports).length : 0
    }));
  }

  /**
   * Busca todos os usuários do sistema com progresso de avaliações (apenas para RH/Admin)
   * @returns Lista de todos os usuários com informações básicas e progresso de avaliações
   */
  async getAllUsersWithEvaluationProgress() {
    // Primeiro, buscar o ciclo ativo
    const activeCycle = await this.prisma.evaluationCycle.findFirst({
      where: { status: 'OPEN' },
      select: { name: true }
    });

    if (!activeCycle) {
      throw new NotFoundException('Nenhum ciclo ativo encontrado');
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managerId: true,
        directReports: true,
        mentorId: true,
      },
      orderBy: [
        { businessUnit: 'asc' },
        { name: 'asc' }
      ]
    });

    // Buscar todas as avaliações do ciclo ativo
    const [
      selfAssessments,
      assessments360,
      managerAssessmentsReceived,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      committeeAssessments,
      managersAndMentors
    ] = await Promise.all([
      // Autoavaliações
      this.prisma.selfAssessment.findMany({
        where: { cycle: activeCycle.name },
        select: { 
          authorId: true, 
          status: true, 
          submittedAt: true 
        }
      }),

      // Avaliações 360 (contagem por usuário avaliado)
      this.prisma.assessment360.findMany({
        where: { 
          cycle: activeCycle.name,
          status: 'SUBMITTED'
        },
        select: { evaluatedUserId: true }
      }),

      // Avaliações de gestor recebidas
      this.prisma.managerAssessment.findMany({
        where: { cycle: activeCycle.name },
        select: { 
          evaluatedUserId: true, 
          status: true, 
          submittedAt: true 
        }
      }),

      // Avaliações de mentoring recebidas (contagem por mentor)
      this.prisma.mentoringAssessment.findMany({
        where: { 
          cycle: activeCycle.name,
          status: 'SUBMITTED'
        },
        select: { mentorId: true }
      }),

      // Feedback de referência recebidos (contagem por usuário referenciado)
      this.prisma.referenceFeedback.findMany({
        where: { 
          cycle: activeCycle.name,
          status: 'SUBMITTED'
        },
        select: { referencedUserId: true }
      }),

      // Avaliações de comitê
      this.prisma.committeeAssessment.findMany({
        where: { cycle: activeCycle.name },
        select: { 
          evaluatedUserId: true, 
          status: true, 
          submittedAt: true 
        }
      }),

      // Buscar nomes dos gestores e mentores
      this.prisma.user.findMany({
        where: { 
          id: { 
            in: [
              ...users.map(user => user.managerId).filter(id => id !== null) as string[],
              ...users.map(user => user.mentorId).filter(id => id !== null) as string[]
            ]
          }
        },
        select: { id: true, name: true }
      })
    ]);

    // Criar maps para acesso rápido
    const managerAndMentorMap = new Map(managersAndMentors.map(m => [m.id, m.name]));
    
    const selfAssessmentMap = new Map(
      selfAssessments.map(sa => [sa.authorId, sa])
    );

    const assessments360Map = new Map<string, number>();
    assessments360.forEach(a => {
      const count = assessments360Map.get(a.evaluatedUserId) || 0;
      assessments360Map.set(a.evaluatedUserId, count + 1);
    });

    const managerAssessmentMap = new Map(
      managerAssessmentsReceived.map(ma => [ma.evaluatedUserId, ma])
    );

    const mentoringAssessmentMap = new Map<string, number>();
    mentoringAssessmentsReceived.forEach(ma => {
      const count = mentoringAssessmentMap.get(ma.mentorId) || 0;
      mentoringAssessmentMap.set(ma.mentorId, count + 1);
    });

    const referenceFeedbackMap = new Map<string, number>();
    referenceFeedbacksReceived.forEach(rf => {
      const count = referenceFeedbackMap.get(rf.referencedUserId) || 0;
      referenceFeedbackMap.set(rf.referencedUserId, count + 1);
    });

    const committeeAssessmentMap = new Map(
      committeeAssessments.map(ca => [ca.evaluatedUserId, ca])
    );

    return users.map(user => {
      const selfAssessment = selfAssessmentMap.get(user.id);
      const managerAssessment = managerAssessmentMap.get(user.id);
      const committeeAssessment = committeeAssessmentMap.get(user.id);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: JSON.parse(user.roles) as string[],
        jobTitle: user.jobTitle,
        seniority: user.seniority,
        careerTrack: user.careerTrack,
        businessUnit: user.businessUnit,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        managerName: user.managerId ? managerAndMentorMap.get(user.managerId) || null : null,
        mentorName: user.mentorId ? managerAndMentorMap.get(user.mentorId) || null : null,
        directReportsCount: user.directReports ? JSON.parse(user.directReports).length : 0,
        evaluationProgress: {
          selfAssessment: {
            status: selfAssessment?.status || 'PENDENTE',
            submittedAt: selfAssessment?.submittedAt || null
          },
          assessments360Received: assessments360Map.get(user.id) || 0,
          managerAssessment: {
            status: managerAssessment?.status || 'PENDENTE',
            submittedAt: managerAssessment?.submittedAt || null
          },
          mentoringAssessmentsReceived: mentoringAssessmentMap.get(user.id) || 0,
          referenceFeedbacksReceived: referenceFeedbackMap.get(user.id) || 0,
          committeeAssessment: {
            status: committeeAssessment?.status || 'PENDING',
            submittedAt: committeeAssessment?.submittedAt || null
          }
        }
      };
    });
  }

  /**
   * Busca dados detalhados de avaliação de um colaborador sem restrição de fase
   * @param userId - ID do usuário
   * @returns Dados detalhados de avaliação do colaborador
   */
  async getCollaboratorEvaluationDetails(userId: string): Promise<any> {
    // Buscar o ciclo ativo
    const activeCycle = await this.prisma.evaluationCycle.findFirst({
      where: { status: 'OPEN' },
      select: { name: true, phase: true }
    });

    if (!activeCycle) {
      throw new NotFoundException('Nenhum ciclo ativo encontrado');
    }

    // Buscar dados do colaborador
    const collaborator = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
        isActive: true
      }
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Buscar todas as avaliações do ciclo ativo (RECEBIDAS E ENVIADAS)
    const [
      selfAssessment,
      assessments360Received,
      assessments360Sent,
      managerAssessmentsReceived,
      managerAssessmentsSent,
      mentoringAssessmentsReceived,
      mentoringAssessmentsSent,
      referenceFeedbacksReceived,
      referenceFeedbacksSent,
      committeeAssessment,
    ] = await Promise.all([
      // Autoavaliação
      this.prisma.selfAssessment.findFirst({
        where: {
          authorId: userId,
          cycle: activeCycle.name,
        },
        include: { answers: true },
      }),

      // Avaliações 360 recebidas
      this.prisma.assessment360.findMany({
        where: {
          evaluatedUserId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações 360 enviadas
      this.prisma.assessment360.findMany({
        where: {
          authorId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          evaluatedUser: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de gestor recebidas
      this.prisma.managerAssessment.findMany({
        where: {
          evaluatedUserId: userId,
          cycle: activeCycle.name,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
          answers: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de gestor enviadas
      this.prisma.managerAssessment.findMany({
        where: {
          authorId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          evaluatedUser: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
          answers: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de mentoring recebidas
      this.prisma.mentoringAssessment.findMany({
        where: {
          mentorId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de mentoring enviadas
      this.prisma.mentoringAssessment.findMany({
        where: {
          authorId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          mentor: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Feedbacks de referência recebidos
      this.prisma.referenceFeedback.findMany({
        where: {
          referencedUserId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Feedbacks de referência enviados
      this.prisma.referenceFeedback.findMany({
        where: {
          authorId: userId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          referencedUser: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliação de comitê existente
      this.prisma.committeeAssessment.findFirst({
        where: {
          evaluatedUserId: userId,
          cycle: activeCycle.name,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    // Calcular médias das avaliações
    const calculateSelfAssessmentAverage = (assessment: any) => {
      if (!assessment?.answers?.length) return null;
      const total = assessment.answers.reduce((sum: number, answer: any) => sum + answer.score, 0);
      return Math.round((total / assessment.answers.length) * 10) / 10; // 1 casa decimal
    };

    const calculateAverage = (assessments: any[], scoreField: string) => {
      if (!assessments.length) return null;
      const total = assessments.reduce((sum, assessment) => sum + (assessment[scoreField] || 0), 0);
      return Math.round((total / assessments.length) * 10) / 10; // 1 casa decimal
    };

    const calculateManagerAssessmentAverage = (assessments: any[]) => {
      if (!assessments.length) return null;
      const allScores: number[] = [];
      
      assessments.forEach(assessment => {
        if (assessment.answers?.length) {
          assessment.answers.forEach((answer: any) => {
            allScores.push(answer.score);
          });
        }
      });
      
      if (allScores.length === 0) return null;
      const total = allScores.reduce((sum, score) => sum + score, 0);
      return Math.round((total / allScores.length) * 10) / 10;
    };

    // Calcular médias
    const selfAssessmentAverage = calculateSelfAssessmentAverage(selfAssessment);
    const assessment360Average = calculateAverage(assessments360Received, 'overallScore');
    const managerAssessmentAverage = calculateManagerAssessmentAverage(managerAssessmentsReceived);
    const mentoringAverage = calculateAverage(mentoringAssessmentsReceived, 'score');

    const totalAssessmentsReceived =
      (selfAssessment ? 1 : 0) +
      assessments360Received.length +
      managerAssessmentsReceived.length +
      mentoringAssessmentsReceived.length +
      referenceFeedbacksReceived.length;

    // Gerar resumo personalizado
    const generateSummary = () => {
      const parts: string[] = [];
      if (selfAssessmentAverage) parts.push(`Autoavaliação: ${selfAssessmentAverage}`);
      if (assessment360Average) parts.push(`Avaliação 360: ${assessment360Average}`);
      if (managerAssessmentAverage) parts.push(`Avaliação Gestor: ${managerAssessmentAverage}`);
      if (mentoringAverage) parts.push(`Mentoring: ${mentoringAverage}`);
      
      if (parts.length === 0) return 'Aguardando avaliações para análise';
      
      return `Médias recebidas - ${parts.join(', ')}. Total de ${totalAssessmentsReceived} avaliações.`;
    };

    return {
      cycle: activeCycle.name,
      currentPhase: activeCycle.phase,
      collaborator,
      evaluationScores: {
        selfAssessment: selfAssessmentAverage,
        assessment360: assessment360Average,
        managerAssessment: managerAssessmentAverage,
        mentoring: mentoringAverage
      },
      customSummary: generateSummary(),
      // Avaliações recebidas
      selfAssessment,
      assessments360Received,
      managerAssessmentsReceived,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      committeeAssessment,
      // Avaliações enviadas
      assessments360Sent,
      managerAssessmentsSent,
      mentoringAssessmentsSent,
      referenceFeedbacksSent,
      summary: {
        totalAssessmentsReceived,
        totalAssessmentsSent: assessments360Sent.length + managerAssessmentsSent.length + mentoringAssessmentsSent.length + referenceFeedbacksSent.length,
        hasCommitteeAssessment: !!committeeAssessment,
        isEqualizationComplete: !!committeeAssessment, // Se tem avaliação de comitê, a equalização está completa
      },
    };
  }

  /**
   * Busca dados para a matriz 9-box de talento (apenas RH)
   * @param cycle - Ciclo de avaliação (opcional, usa o ativo se não fornecido)
   * @returns Dados da matriz com posições dos colaboradores
   */
  async getTalentMatrixData(cycle?: string): Promise<any> {
    try {
      // Buscar ciclo ativo se não fornecido
      let activeCycle: string;
      if (cycle) {
        activeCycle = cycle;
      } else {
        const activeCycleData = await this.prisma.evaluationCycle.findFirst({
          where: { status: 'OPEN' },
          select: { name: true }
        });
        
        if (!activeCycleData) {
          // Se não há ciclo ativo, usar um padrão
          activeCycle = '2025.1';
        } else {
          activeCycle = activeCycleData.name;
        }
      }

    // Buscar todos os usuários ativos que são colaboradores (incluindo gestores e comitê que também são colaboradores)
    const collaborators = await this.prisma.user.findMany({
      where: { 
        isActive: true,
        OR: [
          { roles: { contains: 'colaborador' } },
          { roles: { contains: 'gestor' } },
          { roles: { contains: 'comite' } }
        ]
      },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        businessUnit: true,
        seniority: true,
        careerTrack: true,
      },
      orderBy: { name: 'asc' }
    });

    // Buscar todas as avaliações do ciclo em paralelo
    const [
      selfAssessments,
      managerAssessments,
      assessments360,
      committeeAssessments
    ] = await Promise.all([
      // Autoavaliações
      this.prisma.selfAssessment.findMany({
        where: { cycle: activeCycle, status: 'SUBMITTED' },
        include: { answers: true }
      }),

      // Avaliações de gestor
      this.prisma.managerAssessment.findMany({
        where: { cycle: activeCycle, status: 'SUBMITTED' },
        include: { answers: true }
      }),

      // Avaliações 360
      this.prisma.assessment360.findMany({
        where: { cycle: activeCycle, status: 'SUBMITTED' }
      }),

      // Avaliações do comitê
      this.prisma.committeeAssessment.findMany({
        where: { cycle: activeCycle, status: 'SUBMITTED' }
      })
    ]);

    // Verificar se há avaliações suficientes para gerar a matriz
    const totalEvaluations = selfAssessments.length + managerAssessments.length + assessments360.length + committeeAssessments.length;
    
    if (totalEvaluations === 0) {
      return {
        cycle: activeCycle,
        positions: [],
        stats: {
          totalCollaborators: 0,
          categoryDistribution: {},
          businessUnitDistribution: {},
          topTalents: 0,
          lowPerformers: 0
        },
        generatedAt: new Date(),
        hasInsufficientData: true,
        message: `Não há avaliações disponíveis para o ciclo ${activeCycle}. A matriz será gerada quando houver dados suficientes de avaliações.`
      };
    }

    // Processar dados apenas para colaboradores que têm pelo menos uma avaliação
    const positions = collaborators.filter(collaborator => {
      const selfAssessment = selfAssessments.find(sa => sa.authorId === collaborator.id);
      const managerAssessment = managerAssessments.find(ma => ma.evaluatedUserId === collaborator.id);
      const assessments360ForUser = assessments360.filter(a => a.evaluatedUserId === collaborator.id);
      const committeeAssessment = committeeAssessments.find(ca => ca.evaluatedUserId === collaborator.id);
      
      // Incluir apenas se tiver pelo menos uma avaliação
      return selfAssessment || managerAssessment || assessments360ForUser.length > 0 || committeeAssessment;
    }).map(collaborator => {
      const selfAssessment = selfAssessments.find(sa => sa.authorId === collaborator.id);
      const managerAssessment = managerAssessments.find(ma => ma.evaluatedUserId === collaborator.id);
      const assessments360ForUser = assessments360.filter(a => a.evaluatedUserId === collaborator.id);
      const committeeAssessment = committeeAssessments.find(ca => ca.evaluatedUserId === collaborator.id);

      // Calcular scores (agora sabemos que há pelo menos uma avaliação)
      const performanceScore = this.calculatePerformanceScore(
        selfAssessment,
        managerAssessment,
        assessments360ForUser
      );

      const potentialScore = this.calculatePotentialScore(
        collaborator,
        selfAssessment,
        managerAssessment,
        assessments360ForUser
      );

      // Determinar posição na matriz
      const matrixData = this.determineMatrixPosition(performanceScore, potentialScore);

      // Gerar iniciais
      const initials = collaborator.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: collaborator.id,
        name: collaborator.name,
        jobTitle: collaborator.jobTitle,
        businessUnit: collaborator.businessUnit,
        seniority: collaborator.seniority,
        performanceScore,
        potentialScore,
        matrixPosition: matrixData.position,
        matrixLabel: matrixData.label,
        matrixColor: matrixData.color,
        initials,
        evaluationDetails: {
          selfAssessmentScore: selfAssessment ? this.calculateSelfAssessmentAverage(selfAssessment) : null,
          managerAssessmentScore: managerAssessment ? this.calculateManagerAssessmentAverage([managerAssessment]) : null,
          assessment360Score: assessments360ForUser.length > 0 ? this.calculateAssessment360Average(assessments360ForUser) : null,
          committeeScore: committeeAssessment?.finalScore || null,
          totalEvaluations: [selfAssessment, managerAssessment, ...assessments360ForUser, committeeAssessment].filter(Boolean).length
        }
      };
    });

    // Calcular estatísticas
    const stats = this.calculateMatrixStats(positions);

    return {
      cycle: activeCycle,
      positions,
      stats,
      generatedAt: new Date(),
      hasInsufficientData: false
    };
    } catch (error) {
      console.error('Erro ao gerar matriz de talento:', error);
      throw error;
    }
  }



  /**
   * Calcula o score de performance baseado nas avaliações
   */
  private calculatePerformanceScore(selfAssessment: any, managerAssessment: any, assessments360: any[]): number {
    // Calcular scores individuais
    let selfScore: number | null = null;
    let managerScore: number | null = null;
    let score360: number | null = null;

    if (selfAssessment?.answers?.length) {
      selfScore = selfAssessment.answers.reduce((sum: number, answer: any) => sum + answer.score, 0) / selfAssessment.answers.length;
    }

    if (managerAssessment?.answers?.length) {
      managerScore = managerAssessment.answers.reduce((sum: number, answer: any) => sum + answer.score, 0) / managerAssessment.answers.length;
    }

    if (assessments360.length > 0) {
      score360 = assessments360.reduce((sum, a) => sum + a.overallScore, 0) / assessments360.length;
    }

    // Se não há avaliações, não incluir na matriz (será filtrado)
    if (!selfScore && !managerScore && !score360) {
      return 0; // Indica dados insuficientes
    }

    // Redistribuir pesos dinamicamente baseado nas avaliações disponíveis
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Autoavaliação (peso base 20%)
    if (selfScore !== null) {
      const weight = managerScore !== null ? 0.2 : 0.4; // Se não há gestor, aumenta para 40%
      totalWeightedScore += selfScore * weight;
      totalWeight += weight;
    }

    // Avaliação do gestor (peso base 50%)
    if (managerScore !== null) {
      totalWeightedScore += managerScore * 0.5;
      totalWeight += 0.5;
    }

    // Avaliações 360 (peso base 30%)
    if (score360 !== null) {
      const weight = managerScore !== null ? 0.3 : 0.6; // Se não há gestor, aumenta para 60%
      totalWeightedScore += score360 * weight;
      totalWeight += weight;
    }

    // Normalizar pela soma dos pesos (deve ser sempre 1.0)
    const finalScore = totalWeightedScore / totalWeight;
    return Math.round(finalScore * 10) / 10;
  }

  /**
   * Calcula o score de potencial baseado em critérios específicos e dados do colaborador
   */
  private calculatePotentialScore(collaborator: any, selfAssessment: any, managerAssessment: any, assessments360: any[]): number {
    const potentialFactors: number[] = [];

    // Fator 1: Senioridade (júnior = mais potencial)
    const seniorityScore = this.getSeniorityPotentialScore(collaborator.seniority);
    potentialFactors.push(seniorityScore);

    // Fator 2: Critérios específicos de potencial das avaliações
    const criteriaScore = this.getPotentialCriteriaScore(selfAssessment, managerAssessment, assessments360);
    if (criteriaScore > 0) {
      potentialFactors.push(criteriaScore);
    }

    // Fator 3: Consistência nas avaliações 360 (diversidade de feedback positivo)
    if (assessments360.length >= 2) {
      const consistencyScore = this.getConsistencyScore(assessments360);
      potentialFactors.push(consistencyScore);
    }

    // Se não há dados suficientes, não incluir na matriz (será filtrado)
    if (potentialFactors.length === 0) {
      return 0; // Indica dados insuficientes
    }

    const avgScore = potentialFactors.reduce((sum, score) => sum + score, 0) / potentialFactors.length;
    return Math.round(avgScore * 10) / 10;
  }

  /**
   * Score de potencial baseado na senioridade
   */
  private getSeniorityPotentialScore(seniority: string): number {
    const seniorityMap: Record<string, number> = {
      'junior': 4.5,
      'pleno': 4.0,
      'senior': 3.5,
      'especialista': 3.0,
      'principal': 2.5,
      'staff': 2.0
    };
    
    return seniorityMap[seniority.toLowerCase()] || 3.0;
  }

  /**
   * Score de potencial baseado em critérios específicos
   */
  private getPotentialCriteriaScore(selfAssessment: any, managerAssessment: any, assessments360: any[]): number {
    // Critérios que indicam potencial
    const potentialCriteria = ['capacidade-aprender', 'team-player', 'resiliencia-adversidades'];
    const scores: number[] = [];

    // Verificar critérios na avaliação do gestor (mais peso)
    if (managerAssessment?.answers) {
      const potentialAnswers = managerAssessment.answers.filter((answer: any) => 
        potentialCriteria.includes(answer.criterionId)
      );
      if (potentialAnswers.length > 0) {
        const avgScore = potentialAnswers.reduce((sum: number, answer: any) => sum + answer.score, 0) / potentialAnswers.length;
        scores.push(avgScore * 0.6); // 60% peso
      }
    }

    // Verificar critérios na autoavaliação
    if (selfAssessment?.answers) {
      const potentialAnswers = selfAssessment.answers.filter((answer: any) => 
        potentialCriteria.includes(answer.criterionId)
      );
      if (potentialAnswers.length > 0) {
        const avgScore = potentialAnswers.reduce((sum: number, answer: any) => sum + answer.score, 0) / potentialAnswers.length;
        scores.push(avgScore * 0.4); // 40% peso
      }
    }

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) : 0;
  }

  /**
   * Score de consistência baseado na variação das avaliações 360
   */
  private getConsistencyScore(assessments360: any[]): number {
    if (assessments360.length < 2) return 3;

    const scores = assessments360.map(a => a.overallScore);
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    
    // Menor variância = maior consistência = maior potencial
    if (variance <= 0.5) return 4.5; // Muito consistente
    if (variance <= 1.0) return 4.0; // Consistente
    if (variance <= 1.5) return 3.5; // Moderadamente consistente
    return 3.0; // Inconsistente
  }

  /**
   * Determina a posição na matriz 9-box baseado nos scores
   */
  private determineMatrixPosition(performance: number, potential: number): { position: number, label: string, color: string } {
    // Normalizar scores para grid 3x3
    const perfLevel = performance <= 2.5 ? 1 : performance <= 3.5 ? 2 : 3;
    const potLevel = potential <= 2.5 ? 1 : potential <= 3.5 ? 2 : 3;

    // Mapeamento da matriz 9-box
    const matrixMap: Record<string, { position: number, label: string, color: string }> = {
      '3-3': { position: 1, label: 'Estrelas', color: '#22c55e' },           // Alto Perf, Alto Pot
      '3-2': { position: 2, label: 'Talentos', color: '#84cc16' },          // Alto Perf, Médio Pot
      '3-1': { position: 3, label: 'Questionáveis', color: '#eab308' },     // Alto Perf, Baixo Pot
      '2-3': { position: 4, label: 'Especialistas', color: '#3b82f6' },     // Médio Perf, Alto Pot
      '2-2': { position: 5, label: 'Consistentes', color: '#6b7280' },      // Médio Perf, Médio Pot
      '2-1': { position: 6, label: 'Trabalhadores', color: '#f59e0b' },     // Médio Perf, Baixo Pot
      '1-3': { position: 7, label: 'Potenciais', color: '#8b5cf6' },        // Baixo Perf, Alto Pot
      '1-2': { position: 8, label: 'Inconsistentes', color: '#ef4444' },    // Baixo Perf, Médio Pot
      '1-1': { position: 9, label: 'Baixo Desempenho', color: '#dc2626' }   // Baixo Perf, Baixo Pot
    };

    const key = `${perfLevel}-${potLevel}`;
    return matrixMap[key] || { position: 5, label: 'Consistentes', color: '#6b7280' };
  }

  /**
   * Calcula estatísticas da matriz
   */
  private calculateMatrixStats(positions: any[]): any {
    const totalCollaborators = positions.length;
    
    // Distribuição por categoria
    const categoryDistribution: Record<string, number> = {};
    positions.forEach(pos => {
      categoryDistribution[pos.matrixLabel] = (categoryDistribution[pos.matrixLabel] || 0) + 1;
    });

    // Distribuição por unidade de negócio
    const businessUnitDistribution: Record<string, number> = {};
    positions.forEach(pos => {
      businessUnitDistribution[pos.businessUnit] = (businessUnitDistribution[pos.businessUnit] || 0) + 1;
    });

    // Top talents (posições 1, 2, 4)
    const topTalents = positions.filter(pos => [1, 2, 4].includes(pos.matrixPosition)).length;

    // Low performers (posições 8, 9)
    const lowPerformers = positions.filter(pos => [8, 9].includes(pos.matrixPosition)).length;

    return {
      totalCollaborators,
      categoryDistribution,
      businessUnitDistribution,
      topTalents,
      lowPerformers
    };
  }

  // Métodos auxiliares existentes (adaptados)
  private calculateSelfAssessmentAverage(assessment: any): number | null {
    if (!assessment?.answers?.length) return null;
    const total = assessment.answers.reduce((sum: number, answer: any) => sum + answer.score, 0);
    return Math.round((total / assessment.answers.length) * 10) / 10;
  }

  private calculateManagerAssessmentAverage(assessments: any[]): number | null {
    if (!assessments.length) return null;
    const allScores: number[] = [];
    
    assessments.forEach(assessment => {
      if (assessment.answers?.length) {
        assessment.answers.forEach((answer: any) => {
          allScores.push(answer.score);
        });
      }
    });
    
    if (allScores.length === 0) return null;
    const total = allScores.reduce((sum, score) => sum + score, 0);
    return Math.round((total / allScores.length) * 10) / 10;
  }

  private calculateAssessment360Average(assessments: any[]): number | null {
    if (!assessments.length) return null;
    const total = assessments.reduce((sum, assessment) => sum + (assessment.overallScore || 0), 0);
    return Math.round((total / assessments.length) * 10) / 10;
  }

  /**
   * Busca usuários potenciais para serem mentores
   * Retorna usuários ativos que não são mentores de ninguém ainda
   */
  async getPotentialMentors(): Promise<UserSummary[]> {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        mentorId: null, // Usuários que não são mentorados por ninguém
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        businessUnit: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Filtrar usuários que não são mentores de ninguém
    const mentorIds = await this.prisma.user.findMany({
      where: {
        isActive: true,
        mentorId: { not: null },
      },
      select: {
        mentorId: true,
      },
    });

    const activeMentorIds = new Set(mentorIds.map(u => u.mentorId).filter(id => id !== null));

    return users.filter(user => !activeMentorIds.has(user.id));
  }

  /**
   * Busca usuários com filtros avançados para o RH
   */
  async getUsersWithAdvancedFilters(filters: {
    search?: string;
    projectId?: string;
    jobTitle?: string;
    businessUnit?: string;
    seniority?: string;
    careerTrack?: string;
    isActive?: boolean;
    roles?: string[];
  }): Promise<{
    users: any[];
    totalCount: number;
    filteredCount: number;
  }> {
    try {
      // Buscar o ciclo ativo
      const activeCycle = await this.prisma.evaluationCycle.findFirst({
        where: { status: 'OPEN' },
        select: { name: true }
      });

      if (!activeCycle) {
        console.warn('Nenhum ciclo ativo encontrado para getUsersWithAdvancedFilters');
        // Retornar lista vazia em vez de erro
        return {
          users: [],
          totalCount: 0,
          filteredCount: 0,
        };
      }

    // Construir filtros para o Prisma
    const where: any = {};
    
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { email: { contains: searchTerm } },
      ];
    }

    if (filters.jobTitle && filters.jobTitle.trim()) {
      where.jobTitle = { contains: filters.jobTitle.trim() };
    }

    if (filters.businessUnit && filters.businessUnit.trim()) {
      where.businessUnit = filters.businessUnit.trim();
    }

    if (filters.seniority && filters.seniority.trim()) {
      where.seniority = filters.seniority.trim();
    }

    if (filters.careerTrack && filters.careerTrack.trim()) {
      where.careerTrack = filters.careerTrack.trim();
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Buscar usuários base
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managerId: true,
        mentorId: true,
      },
      orderBy: [
        { businessUnit: 'asc' },
        { name: 'asc' }
      ]
    });

    // Verificar se há usuários
    if (!users || users.length === 0) {
      return {
        users: [],
        totalCount: 0,
        filteredCount: 0,
      };
    }

    // Filtrar por roles se especificado
    let filteredUsers = users;
    if (filters.roles && filters.roles.length > 0) {
      filteredUsers = users.filter(user => {
        try {
          if (!user.roles || typeof user.roles !== 'string') {
            return false;
          }
          const userRoles = JSON.parse(user.roles) as string[];
          return Array.isArray(userRoles) && filters.roles!.some(role => userRoles.includes(role));
        } catch (error) {
          console.error('Erro ao fazer parse dos roles do usuário:', user.id, error);
          return false;
        }
      });
    }

    // Buscar projetos dos usuários (se filtro por projeto estiver ativo)
    let userProjects: Map<string, any[]> = new Map();
    if (filters.projectId) {
      // Buscar usuários que participam do projeto específico
      const projectAssignments = await this.prisma.userProjectAssignment.findMany({
        where: { projectId: filters.projectId },
        include: {
          user: true,
          project: true,
        },
      });

      const projectUserIds = new Set(projectAssignments.map(pa => pa.userId));
      filteredUsers = filteredUsers.filter(user => projectUserIds.has(user.id));

      // Buscar roles dos usuários nos projetos
      const userProjectRoles = await this.prisma.userProjectRole.findMany({
        where: { userId: { in: filteredUsers.map(u => u.id) } },
        include: {
          project: true,
        },
      });

      // Organizar projetos por usuário
      filteredUsers.forEach(user => {
        const userRoles = userProjectRoles.filter(upr => upr.userId === user.id);
        const projects = userRoles.map(ur => ({
          id: ur.project.id,
          name: ur.project.name,
          roleInProject: ur.role,
        }));
        userProjects.set(user.id, projects);
      });
    } else {
      // Buscar projetos de todos os usuários
      const allUserProjectRoles = await this.prisma.userProjectRole.findMany({
        where: { userId: { in: filteredUsers.map(u => u.id) } },
        include: {
          project: true,
        },
      });

      filteredUsers.forEach(user => {
        const userRoles = allUserProjectRoles.filter(upr => upr.userId === user.id);
        const projects = userRoles.map(ur => ({
          id: ur.project.id,
          name: ur.project.name,
          roleInProject: ur.role,
        }));
        userProjects.set(user.id, projects);
      });
    }

    // Buscar dados de progresso de avaliação
    const [
      selfAssessments,
      assessments360,
      managerAssessmentsReceived,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      committeeAssessments,
      managersAndMentors
    ] = await Promise.all([
      this.prisma.selfAssessment.findMany({
        where: { 
          cycle: activeCycle.name,
          authorId: { in: filteredUsers.map(u => u.id) }
        },
        select: { authorId: true, status: true, submittedAt: true }
      }),
      this.prisma.assessment360.findMany({
        where: { 
          cycle: activeCycle.name,
          status: 'SUBMITTED',
          evaluatedUserId: { in: filteredUsers.map(u => u.id) }
        },
        select: { evaluatedUserId: true }
      }),
      this.prisma.managerAssessment.findMany({
        where: { 
          cycle: activeCycle.name,
          evaluatedUserId: { in: filteredUsers.map(u => u.id) }
        },
        select: { evaluatedUserId: true, status: true, submittedAt: true }
      }),
      this.prisma.mentoringAssessment.findMany({
        where: { 
          cycle: activeCycle.name,
          status: 'SUBMITTED',
          mentorId: { in: filteredUsers.map(u => u.id) }
        },
        select: { mentorId: true }
      }),
      this.prisma.referenceFeedback.findMany({
        where: { 
          cycle: activeCycle.name,
          status: 'SUBMITTED',
          referencedUserId: { in: filteredUsers.map(u => u.id) }
        },
        select: { referencedUserId: true }
      }),
      this.prisma.committeeAssessment.findMany({
        where: { 
          cycle: activeCycle.name,
          evaluatedUserId: { in: filteredUsers.map(u => u.id) }
        },
        select: { evaluatedUserId: true, status: true, submittedAt: true }
      }),
      this.prisma.user.findMany({
        where: { 
          id: { 
            in: [
              ...filteredUsers.map(user => user.managerId).filter(id => id !== null) as string[],
              ...filteredUsers.map(user => user.mentorId).filter(id => id !== null) as string[]
            ]
          }
        },
        select: { id: true, name: true }
      })
    ]);

    // Criar maps para acesso rápido
    const managerAndMentorMap = new Map(managersAndMentors.map(m => [m.id, m.name]));
    const selfAssessmentMap = new Map(selfAssessments.map(sa => [sa.authorId, sa]));
    const managerAssessmentMap = new Map(managerAssessmentsReceived.map(ma => [ma.evaluatedUserId, ma]));
    const committeeAssessmentMap = new Map(committeeAssessments.map(ca => [ca.evaluatedUserId, ca]));

    // Contar assessments por usuário
    const assessments360Map = new Map<string, number>();
    assessments360.forEach(a => {
      const count = assessments360Map.get(a.evaluatedUserId) || 0;
      assessments360Map.set(a.evaluatedUserId, count + 1);
    });

    const mentoringAssessmentMap = new Map<string, number>();
    mentoringAssessmentsReceived.forEach(ma => {
      const count = mentoringAssessmentMap.get(ma.mentorId) || 0;
      mentoringAssessmentMap.set(ma.mentorId, count + 1);
    });

    const referenceFeedbackMap = new Map<string, number>();
    referenceFeedbacksReceived.forEach(rf => {
      const count = referenceFeedbackMap.get(rf.referencedUserId) || 0;
      referenceFeedbackMap.set(rf.referencedUserId, count + 1);
    });

    // Montar resposta final
    const usersWithProgress = filteredUsers.map(user => {
      const selfAssessment = selfAssessmentMap.get(user.id);
      const managerAssessment = managerAssessmentMap.get(user.id);
      const committeeAssessment = committeeAssessmentMap.get(user.id);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: this.parseUserRoles(user.roles),
        jobTitle: user.jobTitle,
        seniority: user.seniority,
        careerTrack: user.careerTrack,
        businessUnit: user.businessUnit,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        managerName: user.managerId ? managerAndMentorMap.get(user.managerId) || null : null,
        mentorName: user.mentorId ? managerAndMentorMap.get(user.mentorId) || null : null,
        projects: userProjects.get(user.id) || [],
        evaluationProgress: {
          selfAssessment: {
            status: selfAssessment?.status || 'PENDENTE',
            submittedAt: selfAssessment?.submittedAt || null
          },
          assessments360Received: assessments360Map.get(user.id) || 0,
          managerAssessment: {
            status: managerAssessment?.status || 'PENDENTE',
            submittedAt: managerAssessment?.submittedAt || null
          },
          mentoringAssessmentsReceived: mentoringAssessmentMap.get(user.id) || 0,
          referenceFeedbacksReceived: referenceFeedbackMap.get(user.id) || 0,
          committeeAssessment: {
            status: committeeAssessment?.status || 'PENDING',
            submittedAt: committeeAssessment?.submittedAt || null
          }
        }
      };
    });

    return {
      users: usersWithProgress,
      totalCount: users.length,
      filteredCount: filteredUsers.length,
    };
    } catch (error) {
      console.error('Erro ao buscar usuários com filtros avançados:', error);
      // Retornar resultado vazio em caso de erro
      return {
        users: [],
        totalCount: 0,
        filteredCount: 0,
      };
    }
  }

  /**
   * Busca lista de projetos disponíveis
   */
  async getProjectsList(): Promise<any[]> {
    const projects = await this.prisma.project.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return projects;
  }
} 