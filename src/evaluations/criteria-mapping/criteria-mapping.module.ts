import { Module } from '@nestjs/common';
import { CriteriaMappingService } from './criteria-mapping.service';
import { DatabaseModule } from '../../database/database.module'; 

@Module({
  imports: [DatabaseModule],
  providers: [CriteriaMappingService],
  exports: [CriteriaMappingService],
})
export class CriteriaMappingModule {}