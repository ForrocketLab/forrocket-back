import { Module } from '@nestjs/common';
import { OKRsController } from './okrs.controller';
import { OKRsService } from './okrs.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Módulo responsável pela funcionalidade de OKRs
 */
@Module({
  imports: [DatabaseModule],
  controllers: [OKRsController],
  providers: [OKRsService],
  exports: [OKRsService],
})
export class OKRsModule {} 