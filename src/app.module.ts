import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { GenAiModule } from './gen-ai/gen-ai.module';
import { OKRsModule } from './okrs/okrs.module';
import { ProjectsModule } from './projects/projects.module';
import { PDIsModule } from './pdis/pdis.module';

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

    // Módulo de agendamento de tarefas
    ScheduleModule.forRoot(),

    // Módulo do banco de dados (com configuração TypeORM)
    DatabaseModule,

    // Módulo de autenticação
    AuthModule,

    // Módulo de avaliações
    EvaluationsModule,

    // Módulo de projetos
    ProjectsModule,

    // Módulo de integração com GenAI
    GenAiModule,
    // Módulo de OKRs
    OKRsModule,

    PDIsModule,
  ],
})
export class AppModule {}
