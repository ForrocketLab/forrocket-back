import { Module } from '@nestjs/common';

import { CyclesModule } from './cycles/cycles.module';
import { CyclesService } from './cycles/cycles.service';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { ManagerController } from './manager.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

// Submódulos

@Module({
  imports: [DatabaseModule, ProjectsModule, CyclesModule],
  controllers: [EvaluationsController, ManagerController],
  providers: [EvaluationsService, CyclesService],
  exports: [EvaluationsService, CyclesService],
})
export class EvaluationsModule {}
