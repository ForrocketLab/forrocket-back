import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UserProfileDto, UserType } from './dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo usuário aplicando todas as regras de negócio e validações
   * @param createUserDto - Dados para criação do usuário
   * @returns Usuário criado (sem o passwordHash)
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserProfileDto> {
    console.log('🔄 Iniciando criação de usuário:', createUserDto.email);

    // 1. VALIDAÇÕES INICIAIS
    await this.validateUserCreation(createUserDto);

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
      
      if (hasManagerRole) {
        roles.push('gestor');
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
      const role = assignment.roleInProject === 'gestor' ? 'MANAGER' : 'COLLABORATOR';
      await this.prisma.userProjectRole.create({
        data: {
          userId,
          projectId: assignment.projectId,
          role
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
    }

    // Atualizar directReports dos projetos onde é gestor
    await this.updateDirectReports(userId, createUserDto);
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
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
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
} 