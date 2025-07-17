import { Module } from '@nestjs/common';

import { CycleAutomationService } from './cycle-automation.service';
import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';
import { RoleCheckerService } from '../../auth/role-checker.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CyclesController],
  providers: [CyclesService, CycleAutomationService, PrismaService, RoleCheckerService],
  exports: [CyclesService, CycleAutomationService],
})
export class CyclesModule {}
