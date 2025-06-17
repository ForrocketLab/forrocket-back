import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvaluationCycles() {
    return this.prisma.evaluationCycle.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getEvaluationCycleById(id: string) {
    return this.prisma.evaluationCycle.findUnique({
      where: { id },
    });
  }

  async getActiveCycle() {
    return this.prisma.evaluationCycle.findFirst({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }
} 