import { Module } from '@nestjs/common';

import { CommitteeModule } from './committee/committee.module';
import { CriteriaMappingModule } from './criteria-mapping/criteria-mapping.module'; // NOVO: Importar CriteriaMappingModule
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

// Submódulos

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    GenAiModule,
    CyclesModule,
    CommitteeModule,
    CriteriaMappingModule,
    HRModule,
  ],
  controllers: [
    EvaluationsController,
    ManagerController,
    CriteriaController,
    CriteriaPublicController,
    CriteriaSimpleController,
  ],
  providers: [EvaluationsService, CyclesService, CriteriaService],
  exports: [EvaluationsService, CyclesService, CriteriaService],
})
export class EvaluationsModule {}
