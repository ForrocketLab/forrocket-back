import { Module } from '@nestjs/common';
import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [CyclesController],
  providers: [CyclesService, PrismaService],
  exports: [CyclesService],
})
export class CyclesModule {} 