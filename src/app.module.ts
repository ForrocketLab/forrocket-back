import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { ProjectsModule } from './projects/projects.module';

/**
 * Módulo principal da aplicação RPE
 * Integra todos os módulos e configurações globais
 */
@Module({
  imports: [
    // Configuração global para carregar variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Módulo do banco de dados (com configuração TypeORM)
    DatabaseModule,

    // Módulo de autenticação
    AuthModule,

    // Módulo de avaliações
    EvaluationsModule,

    // Módulo de projetos
    ProjectsModule,
  ],
})
export class AppModule {}
