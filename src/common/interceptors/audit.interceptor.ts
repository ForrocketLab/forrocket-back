import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const now = Date.now();

    // Capturar detalhes da requisição
    const eventType = 'API_CALL';
    const endpoint = request.url;
    const method = request.method;
    // Ajuste aqui para usar a propriedade correta do usuário
    const userId = (user as any)?.id || (user as any)?.userId;

    return next.handle().pipe(
      tap({
        next: async (data) => {
          // Executa após a requisição ser concluída com sucesso
          const durationMs = Date.now() - now;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          // Registrar a chamada de API
          await this.prisma.auditLog.create({
            data: {
              eventType,
              userId,
              details: {
                endpoint,
                method,
                statusCode,
                durationMs,
              },
              originIp: request.ip,
            },
          });

          // Atualizar lastActivityAt para o usuário
          if (userId) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { lastActivityAt: new Date() },
            });
          }
        },
        error: async (err) => {
          // Executa se a requisição falhar
          const durationMs = Date.now() - now;
          const statusCode = err.status || 500;

          await this.prisma.auditLog.create({
            data: {
              eventType,
              userId,
              details: {
                endpoint,
                method,
                statusCode,
                durationMs,
                error: err.message,
              },
              originIp: request.ip,
            },
          });

          if (userId) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { lastActivityAt: new Date() },
            });
          }
        },
      }),
    );
  }
}