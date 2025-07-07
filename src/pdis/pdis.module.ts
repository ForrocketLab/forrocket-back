import { Module } from '@nestjs/common';
import { PDIsService } from './pdis.service';
import { PDIsController } from './pdis.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [PDIsController],
  providers: [PDIsService, PrismaService],
})
export class PDIsModule {} 