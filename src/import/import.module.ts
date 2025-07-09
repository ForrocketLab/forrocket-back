import { Module } from '@nestjs/common';

import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [AuthModule, DatabaseModule, EvaluationsModule, ProjectsModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
