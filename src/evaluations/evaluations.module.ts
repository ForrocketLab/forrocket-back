import { Module } from '@nestjs/common';

import { CommitteeModule } from './committee/committee.module';
import { CyclesModule } from './cycles/cycles.module';
import { CyclesService } from './cycles/cycles.service';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { ManagerController } from './manager.controller';
import { CriteriaController } from './criteria.controller';
import { CriteriaPublicController } from './criteria-public.controller';
import { CriteriaSimpleController } from './criteria-simple.controller';
import { CriteriaService } from './criteria.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { GenAiModule } from '../gen-ai/gen-ai.module';
import { HRModule } from './hr/hr.module';
import { AssessmentsModule } from './assessments/assessments.module';

@Module({
  imports: [DatabaseModule, ProjectsModule, GenAiModule, CyclesModule, CommitteeModule, HRModule, AssessmentsModule],
  controllers: [
    EvaluationsController,
    ManagerController,
    CriteriaController,
    CriteriaPublicController,
    CriteriaSimpleController,
  ],
  providers: [EvaluationsService, CyclesService, CriteriaService],
  exports: [EvaluationsService, CyclesService, CriteriaService, AssessmentsModule],
})
export class EvaluationsModule {}
