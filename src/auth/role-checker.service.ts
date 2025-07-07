import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoleCheckerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se um usuário tem uma role específica usando a nova estrutura UserRoleAssignment
   * @param userId - ID do usuário
   * @param role - Role a verificar
   * @returns Promise<boolean>
   */
  async userHasRole(userId: string, role: string): Promise<boolean> {
    // Mapear strings legadas para novos enums se necessário
    const roleMapping: Record<string, UserRole> = {
      admin: UserRole.ADMIN,
      rh: UserRole.RH,
      comite: UserRole.COMMITTEE,
      committee: UserRole.COMMITTEE,
      gestor: UserRole.MANAGER,
      manager: UserRole.MANAGER,
      colaborador: UserRole.COLLABORATOR,
      collaborator: UserRole.COLLABORATOR,
    };

    // Converter string para enum se necessário
    const normalizedRole =
      typeof role === 'string' ? roleMapping[role.toLowerCase()] || (role as UserRole) : role;

    try {
      const assignment = await this.prisma.userRoleAssignment.findFirst({
        where: {
          userId,
          role: normalizedRole,
        },
      });

      return !!assignment;
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      return false;
    }
  }

  /**
   * Verifica se um usuário tem qualquer uma das roles especificadas
   * @param userId - ID do usuário
   * @param roles - Array de roles a verificar
   * @returns Promise<boolean>
   */
  async userHasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    for (const role of roles) {
      if (await this.userHasRole(userId, role)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtém todas as roles de um usuário
   * @param userId - ID do usuário
   * @returns Promise<UserRole[]>
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const assignments = await this.prisma.userRoleAssignment.findMany({
        where: { userId },
        select: { role: true },
      });

      return assignments.map((a) => a.role);
    } catch (error) {
      console.error('Erro ao buscar roles do usuário:', error);
      return [];
    }
  }

  /**
   * Verifica se um usuário é admin
   * @param userId - ID do usuário
   * @returns Promise<boolean>
   */
  async isAdmin(userId: string): Promise<boolean> {
    return this.userHasRole(userId, UserRole.ADMIN);
  }

  /**
   * Verifica se um usuário é do RH
   * @param userId - ID do usuário
   * @returns Promise<boolean>
   */
  async isHR(userId: string): Promise<boolean> {
    return this.userHasRole(userId, UserRole.RH);
  }

  /**
   * Verifica se um usuário é membro do comitê
   * @param userId - ID do usuário
   * @returns Promise<boolean>
   */
  async isCommittee(userId: string): Promise<boolean> {
    return this.userHasRole(userId, UserRole.COMMITTEE);
  }

  /**
   * Verifica se um usuário é gestor
   * @param userId - ID do usuário
   * @returns Promise<boolean>
   */
  async isManager(userId: string): Promise<boolean> {
    return this.userHasRole(userId, UserRole.MANAGER);
  }

  /**
   * Verifica se um usuário é colaborador
   * @param userId - ID do usuário
   * @returns Promise<boolean>
   */
  async isCollaborator(userId: string): Promise<boolean> {
    return this.userHasRole(userId, UserRole.COLLABORATOR);
  }
}
