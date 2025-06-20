import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Guard para proteger rotas que requerem acesso de RH
 * Permite acesso apenas para usuários com role 'rh' ou 'admin'
 */
@Injectable()
export class HRRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar se o usuário tem role de RH ou Admin
    // Se user.roles já é um array (vem do JWT), usar diretamente
    // Se é string (vem do banco), fazer parse
    const userRoles = Array.isArray(user.roles) ? user.roles : JSON.parse(user.roles || '[]');
    const hasPermission = userRoles.includes('rh') || userRoles.includes('admin');

    if (!hasPermission) {
      throw new ForbiddenException(
        'Acesso negado. Apenas usuários do RH podem acessar esta funcionalidade.',
      );
    }

    return true;
  }
}
