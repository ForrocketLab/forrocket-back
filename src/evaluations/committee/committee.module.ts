import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { GenAiModule } from '../../gen-ai/gen-ai.module';
import { CyclesModule } from '../cycles/cycles.module';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { CommitteeDataService } from './committee-data.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [DatabaseModule, GenAiModule, CyclesModule, CommonModule],
  controllers: [CommitteeController],
  providers: [CommitteeService, CommitteeDataService],
  exports: [CommitteeService, CommitteeDataService],
})
export class CommitteeModule {}
