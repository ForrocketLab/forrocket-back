import { Module } from '@nestjs/common';

import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [DatabaseModule, ProjectsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
