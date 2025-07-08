import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrismaService } from '../database/prisma.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, PrismaService],
  exports: [MonitoringService],
})
export class MonitoringModule {}