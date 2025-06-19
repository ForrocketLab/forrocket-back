import { Module } from '@nestjs/common';

import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { DatabaseModule } from '../../database/database.module';
import { CyclesModule } from '../cycles/cycles.module';

@Module({
  imports: [DatabaseModule, CyclesModule],
  controllers: [CommitteeController],
  providers: [CommitteeService],
  exports: [CommitteeService],
})
export class CommitteeModule {}
