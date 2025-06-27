import { Module } from '@nestjs/common';
import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';
import { CycleAutomationService } from './cycle-automation.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CyclesController],
  providers: [CyclesService, CycleAutomationService, PrismaService],
  exports: [CyclesService, CycleAutomationService],
})
export class CyclesModule {} 