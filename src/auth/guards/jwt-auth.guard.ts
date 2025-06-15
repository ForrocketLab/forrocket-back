import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../public.decorator';

/**
 * Guard para autenticação JWT
 * Protege rotas que precisam de autenticação
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina se a requisição pode prosseguir
   * @param context - Contexto de execução
   * @returns True se autorizado, false caso contrário
   */
  canActivate(context: ExecutionContext) {
    // Verifica se a rota é marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Manipula erros de autenticação
   * @param err - Erro ocorrido
   * @param user - Usuário (se encontrado)
   * @param info - Informações adicionais
   * @returns Usuário se válido
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.log('❌ Erro na autenticação JWT:', { err, info });
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
} 