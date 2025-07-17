import { Module } from '@nestjs/common';

import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';
import { EncryptionService } from '../common/services/encryption.service';
import { PrismaService } from '../database/prisma.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';

@Module({
  controllers: [MentorController],
  providers: [MentorService, PrismaService, EncryptionService, CyclesService],
  exports: [MentorService],
})
export class MentorModule {}
