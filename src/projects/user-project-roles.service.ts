import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

// Tipos internos para o service
interface CreateUserProjectRoleData {
  userId: string;
  projectId: string;
  role: UserRole;
}

interface UpdateUserProjectRoleData {
  role: UserRole;
}

interface UserProjectRoleFilters {
  userId?: string;
  projectId?: string;
  role?: UserRole;
  includeUser?: boolean;
  includeProject?: boolean;
}

@Injectable()
export class UserProjectRolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova atribuição de role para um usuário em um projeto
   */
  async create(createDto: CreateUserProjectRoleData): Promise<any> {
    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${createDto.userId} não encontrado`);
    }

    // Verificar se projeto existe
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });
    if (!project) {
      throw new NotFoundException(`Projeto com ID ${createDto.projectId} não encontrado`);
    }

    // Verificar se a role já existe para este usuário neste projeto
    const existingRole = await this.prisma.userProjectRole.findFirst({
      where: {
        userId: createDto.userId,
        projectId: createDto.projectId,
        role: createDto.role,
      },
    });

    if (existingRole) {
      throw new ConflictException(
        `Usuário já possui a role ${createDto.role} no projeto ${project.name}`
      );
    }

    // Criar nova atribuição de role
    const userProjectRole = await this.prisma.userProjectRole.create({
      data: {
        userId: createDto.userId,
        projectId: createDto.projectId,
        role: createDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return userProjectRole;
  }

  /**
   * Lista todas as atribuições de roles com filtros opcionais
   */
  async findAll(filters: UserProjectRoleFilters = {}): Promise<any[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.role) {
      where.role = filters.role;
    }

    const include: any = {};
    if (filters.includeUser) {
      include.user = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      };
    }
    if (filters.includeProject) {
      include.project = {
        select: {
          id: true,
          name: true,
          description: true,
        },
      };
    }

    const userProjectRoles = await this.prisma.userProjectRole.findMany({
      where,
      include,
      orderBy: [
        { createdAt: 'desc' },
        { role: 'asc' },
      ],
    });

    return userProjectRoles;
  }

  /**
   * Lista todas as roles de um usuário específico
   */
  async findUserRoles(
    userId: string,
    options: { includeProject?: boolean } = {}
  ): Promise<any[]> {
    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    const include: any = {};
    if (options.includeProject) {
      include.project = {
        select: {
          id: true,
          name: true,
          description: true,
        },
      };
    }

    const userProjectRoles = await this.prisma.userProjectRole.findMany({
      where: { userId },
      include,
      orderBy: [
        { project: { name: 'asc' } },
        { role: 'asc' },
      ],
    });

    return userProjectRoles;
  }

  /**
   * Lista todas as roles de um projeto específico
   */
  async findProjectRoles(
    projectId: string,
    options: { includeUser?: boolean } = {}
  ): Promise<any[]> {
    // Verificar se projeto existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Projeto com ID ${projectId} não encontrado`);
    }

    const include: any = {};
    if (options.includeUser) {
      include.user = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      };
    }

    const userProjectRoles = await this.prisma.userProjectRole.findMany({
      where: { projectId },
      include,
      orderBy: [
        { role: 'asc' },
        { user: { name: 'asc' } },
      ],
    });

    return userProjectRoles;
  }

  /**
   * Busca uma atribuição de role específica por ID
   */
  async findOne(id: string): Promise<any> {
    const userProjectRole = await this.prisma.userProjectRole.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!userProjectRole) {
      throw new NotFoundException(`Atribuição de role com ID ${id} não encontrada`);
    }

    return userProjectRole;
  }

  /**
   * Atualiza uma atribuição de role específica
   */
  async update(id: string, updateDto: UpdateUserProjectRoleData): Promise<any> {
    // Verificar se a atribuição existe
    const existingRole = await this.prisma.userProjectRole.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
      },
    });

    if (!existingRole) {
      throw new NotFoundException(`Atribuição de role com ID ${id} não encontrada`);
    }

    // Verificar se já existe outra role igual para o mesmo usuário/projeto
    const conflictingRole = await this.prisma.userProjectRole.findFirst({
      where: {
        userId: existingRole.userId,
        projectId: existingRole.projectId,
        role: updateDto.role,
        id: {
          not: id, // Excluir o registro atual da verificação
        },
      },
    });

    if (conflictingRole) {
      throw new ConflictException(
        `Usuário já possui a role ${updateDto.role} no projeto ${existingRole.project.name}`
      );
    }

    // Atualizar a role
    const updatedRole = await this.prisma.userProjectRole.update({
      where: { id },
      data: {
        role: updateDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return updatedRole;
  }

  /**
   * Remove uma atribuição de role específica
   */
  async remove(id: string): Promise<void> {
    // Verificar se a atribuição existe
    const existingRole = await this.prisma.userProjectRole.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Atribuição de role com ID ${id} não encontrada`);
    }

    // Remover a atribuição
    await this.prisma.userProjectRole.delete({
      where: { id },
    });
  }

  /**
   * Remove todas as roles de um usuário de um projeto específico
   */
  async removeUserFromProject(userId: string, projectId: string): Promise<void> {
    // Verificar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se projeto existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Projeto com ID ${projectId} não encontrado`);
    }

    // Remover todas as roles do usuário neste projeto
    await this.prisma.userProjectRole.deleteMany({
      where: {
        userId,
        projectId,
      },
    });
  }
} 