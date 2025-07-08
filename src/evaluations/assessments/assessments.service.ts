import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Update360AssessmentDto } from './dto/update-360-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async update360Assessment(updateDto: Update360AssessmentDto, authorId: string) {
    const { evaluatedUserId, cycleId, ...updateData } = updateDto;

    // Atualiza a avaliação existente
    const updatedAssessment = await this.prisma.assessment360.update({
      where: {
        authorId_evaluatedUserId_cycle: {
          authorId,
          evaluatedUserId,
          cycle: cycleId,
        },
      },
      data: updateData,
    });

    return updatedAssessment;
  }
} 