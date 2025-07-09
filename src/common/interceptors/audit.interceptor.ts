import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { Request } from 'express';
import { User } from '@prisma/client'; 

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User | undefined; 
    const now = Date.now();

    const endpoint = request.url;
    const method = request.method;
    const userId = user?.id; 

    // --- Mantenha estes CONSOLE.LOGS para verificar após a correção ---
    this.logger.debug(`Requisição recebida: ${method} ${endpoint}`);
    this.logger.debug(`Objeto user no interceptor: ${JSON.stringify(user)}`);
    this.logger.debug(`userId capturado: ${userId}`);

    // Lógica de Exclusão de Endpoints de Monitoramento
    const excludedPaths = [
      '/api/monitoring/',
    ];
    const isExcluded = excludedPaths.some(path => endpoint.startsWith(path));

    if (isExcluded) {
      this.logger.debug(`Requisição para ${endpoint} ignorada pela auditoria.`);
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const durationMs = Date.now() - now;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          await this.prisma.auditLog.create({
            data: {
              eventType: 'API_CALL',
              userId,
              details: { endpoint, method, statusCode, durationMs },
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
        error: async (err) => {
          const durationMs = Date.now() - now;
          const statusCode = err.status || 500;

          await this.prisma.auditLog.create({
            data: {
              eventType: 'API_CALL',
              userId,
              details: { endpoint, method, statusCode, durationMs, error: err.message },
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