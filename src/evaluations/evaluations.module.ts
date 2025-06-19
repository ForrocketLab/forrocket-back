import { Module } from '@nestjs/common';

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

// Submódulos

@Module({
  imports: [DatabaseModule, ProjectsModule, CyclesModule],
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
