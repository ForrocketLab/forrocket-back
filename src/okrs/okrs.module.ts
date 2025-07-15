import { Module, forwardRef } from '@nestjs/common'; 
import { OKRsController } from './okrs.controller';
import { OkrService } from './okr.service'; 
import { ObjectiveService } from './objective.service'; 
import { KeyResultService } from './key-result.service'; 
import { DatabaseModule } from '../database/database.module';

/**
 * Módulo responsável pela funcionalidade de OKRs
 */
@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [OKRsController],
  providers: [
    OkrService, 
    ObjectiveService, 
    KeyResultService, 
  ],
  exports: [
    OkrService,     ObjectiveService,
    KeyResultService,
  ],
})
export class OKRsModule {}