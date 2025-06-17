import { Module } from '@nestjs/common';

import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

// Submódulos
import { CyclesModule } from './cycles/cycles.module';

@Module({
  imports: [
    DatabaseModule, 
    ProjectsModule,
    CyclesModule,
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
