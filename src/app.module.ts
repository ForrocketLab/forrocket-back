import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ErpSimulationModule } from './erp-simulation/erp-simulation.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { GenAiModule } from './gen-ai/gen-ai.module';
import { ImportModule } from './import/import.module';
import { MentorModule } from './mentor/mentor.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OKRsModule } from './okrs/okrs.module';
import { PDIsModule } from './pdis/pdis.module';
import { ProjectsModule } from './projects/projects.module';
import { LeaderModule } from './evaluations/leader.module';

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

    // Módulo de importação de dados
    ImportModule,
    ErpSimulationModule,

    // Módulo de integração com GenAI
    GenAiModule,
    // Módulo de OKRs
    OKRsModule,

    PDIsModule,

    // Módulo de monitoramento
    MonitoringModule,

    MentorModule,
    // Módulo do fluxo de líder
    LeaderModule,

    // Módulo de e-mail
    EmailModule,
  ],
})
export class AppModule {}
