import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { MentorModule } from 'src/mentor/mentor.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ClimateModule } from './climate/climate.module';
import { CommitteeModule } from './committee/committee.module';
import { CriteriaPublicController } from './criteria-public.controller';
import { CriteriaSimpleController } from './criteria-simple.controller';
import { CriteriaController } from './criteria.controller';
import { CriteriaService } from './criteria.service';
import { CyclesModule } from './cycles/cycles.module';
import { CyclesService } from './cycles/cycles.service';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { ManagerController } from './manager.controller';
import { DatabaseModule } from '../database/database.module';
import { GenAiModule } from '../gen-ai/gen-ai.module';
import { ProjectsModule } from '../projects/projects.module';
import { HRModule } from './hr/hr.module';
import { CommonModule } from '../common/common.module';
import { EvaluationDecryptionInterceptor } from '../common/interceptors/evaluation-decryption.interceptor';

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    GenAiModule,
    CyclesModule,
    CommitteeModule,
    HRModule,
    AssessmentsModule,
    ClimateModule,
    CommonModule,
    MentorModule,
  ],
  controllers: [
    EvaluationsController,
    ManagerController,
    CriteriaController,
    CriteriaPublicController,
    CriteriaSimpleController,
  ],
  providers: [
    EvaluationsService,
    CyclesService,
    CriteriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: EvaluationDecryptionInterceptor,
    },
  ],
  exports: [EvaluationsService, CyclesService, CriteriaService, AssessmentsModule],
})
export class EvaluationsModule {}
