import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CommitteeRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar se o usuário tem role de committee (sistema legado ou novo)
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
    const isCommittee = userRoles.includes('comite') || userRoles.includes('COMMITTEE') || userRoles.includes('committee');

    if (!isCommittee) {
      throw new ForbiddenException('Apenas membros do comitê podem acessar esta funcionalidade');
    }

    return true;
  }
} 