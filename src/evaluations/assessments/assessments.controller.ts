import { Controller, Get, Post, Body, Param, UseGuards, Patch, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AssessmentsService } from './assessments.service';
import { Create360AssessmentDto } from './dto/create-360-assessment.dto';
import { Update360AssessmentDto } from './dto/update-360-assessment.dto';

@Controller('evaluations/collaborator')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Patch('360-assessment')
  async update360Assessment(@Request() req, @Body() updateDto: Update360AssessmentDto) {
    return this.assessmentsService.update360Assessment(updateDto, req.user.id);
  }
} 