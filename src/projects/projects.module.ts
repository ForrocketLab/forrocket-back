import { Module } from '@nestjs/common';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { UserProjectRolesService } from './user-project-roles.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, UserProjectRolesService],
  exports: [ProjectsService, UserProjectRolesService],
})
export class ProjectsModule {}
