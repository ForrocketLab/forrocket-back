import { Module } from '@nestjs/common';
import { ClimateController } from './climate.controller';
import { ClimateService } from './climate.service';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { CyclesService } from '../cycles/cycles.service';
import { GenAiModule } from '../../gen-ai/gen-ai.module';

@Module({
  imports: [GenAiModule],
  controllers: [ClimateController],
  providers: [ClimateService, PrismaService, EncryptionService, CyclesService],
  exports: [ClimateService],
})
export class ClimateModule {} 