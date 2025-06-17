import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UserProfileDto } from './dto';
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

    // 4. CRIAÇÃO DOS RELACIONAMENTOS
    await this.createUserRelationships(createdUser.id, createUserDto);

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

    // Verificar se projetos existem
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
  }

  /**
   * Processa e gera os dados automaticamente
   * @param createUserDto - Dados do usuário
   * @returns Dados processados para criação
   */
  private async processUserData(createUserDto: CreateUserDto): Promise<any> {
    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    // Determinar roles baseado nos projectAssignments
    const roles = ['colaborador'];
    const hasManagerRole = createUserDto.projectAssignments.some(
      assignment => assignment.roleInProject === 'gestor'
    );
    
    if (hasManagerRole) {
      roles.push('gestor');
    }

    // Encontrar manager (gestor do primeiro projeto como colaborador)
    let managerId: string | null = null;
    let managerName: string | null = null;

    const collaboratorAssignment = createUserDto.projectAssignments.find(
      assignment => assignment.roleInProject === 'colaborador'
    );

    if (collaboratorAssignment) {
      const manager = await this.findProjectManager(collaboratorAssignment.projectId);
      if (manager) {
        managerId = manager.id;
        managerName = manager.name;
      }
    }

    // Buscar nome do mentor
    let mentorName: string | null = null;
    if (createUserDto.mentorId) {
      const mentor = await this.prisma.user.findUnique({
        where: { id: createUserDto.mentorId },
        select: { name: true }
      });
      mentorName = mentor?.name || null;
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
      mentorId: createUserDto.mentorId || null,
      isActive: true,
      // Campos temporários (legacy) - serão migrados
      projects: JSON.stringify(createUserDto.projectAssignments.map(p => p.projectId)),
      directReports: null,
    };
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
   * Cria os relacionamentos do usuário
   * @param userId - ID do usuário criado
   * @param createUserDto - Dados originais
   */
  private async createUserRelationships(userId: string, createUserDto: CreateUserDto): Promise<void> {
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
    const managerAssignments = createUserDto.projectAssignments.filter(
      assignment => assignment.roleInProject === 'gestor'
    );

    for (const managerAssignment of managerAssignments) {
      // Buscar todos os colaboradores do projeto
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
              isActive: true
            }
          }
        }
      });

      const activeCollaborators = collaborators.filter(c => c.user.isActive);
      
      if (activeCollaborators.length > 0) {
        const directReportsIds = activeCollaborators.map(c => c.user.id);
        const directReportsNames = activeCollaborators.map(c => c.user.name);

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            directReports: JSON.stringify(directReportsIds)
          }
        });
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