import { Body, Controller, Get, Param, Post, NotFoundException, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthCheckResponseDto, SummaryResponseDto, TestSummaryDto } from './dto/gen-ai-test.dto';
import { PersonalInsightsRequest, PersonalInsightsResponse, PersonalInsightsData } from './dto/personal-insights.dto';
import { GenAiService } from './gen-ai.service';
import { PrismaService } from '../database/prisma.service';

@ApiTags('gen-ai')
@Controller('api/gen-ai')
export class GenAiController {
  constructor(
    private readonly genAiService: GenAiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('test-summary')
  @ApiOperation({ summary: 'Testa a geração de summary a partir de um texto de avaliação' })
  @ApiResponse({ status: 200, description: 'Summary gerado com sucesso', type: SummaryResponseDto })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async testSummary(@Body() body: TestSummaryDto): Promise<SummaryResponseDto> {
    const summary = await this.genAiService.getSummary(body.evaluationText);
    return { summary };
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Verifica se o serviço está funcionando' })
  @ApiResponse({
    status: 200,
    description: 'Serviço funcionando corretamente',
    type: HealthCheckResponseDto,
  })
  healthCheck(): HealthCheckResponseDto {
    return {
      status: 'ok',
      message: 'GenAI Service está funcionando corretamente',
    };
  }

  @Post('personal-insights')
  @ApiOperation({ summary: 'Gera insights personalizados para um colaborador' })
  @ApiResponse({ status: 200, description: 'Insights gerados com sucesso', type: PersonalInsightsResponse })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async generatePersonalInsights(@Body() body: PersonalInsightsRequest): Promise<PersonalInsightsResponse> {
    // Verificar se já existe insight salvo
    const existingInsight = await this.prisma.personalInsights.findUnique({
      where: {
        collaboratorId_cycle: {
          collaboratorId: body.collaboratorId,
          cycle: body.cycle,
        },
      },
    });

    if (existingInsight) {
      // Retornar insight existente
      return {
        collaboratorId: existingInsight.collaboratorId,
        collaboratorName: existingInsight.collaboratorName,
        jobTitle: existingInsight.jobTitle,
        cycle: existingInsight.cycle,
        averageScore: existingInsight.averageScore,
        insights: existingInsight.insights,
        generatedAt: existingInsight.createdAt.toISOString(),
      };
    }

    // Buscar dados completos do colaborador
    const collaborator = await this.prisma.user.findUnique({
      where: { id: body.collaboratorId },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Buscar ciclo de avaliação
    const cycle = await this.prisma.evaluationCycle.findFirst({
      where: { name: body.cycle },
    });

    if (!cycle) {
      throw new NotFoundException('Ciclo de avaliação não encontrado');
    }

    // Buscar avaliações 360° (exceto autoavaliação)
    const assessments360 = await this.prisma.assessment360.findMany({
      where: {
        evaluatedUserId: body.collaboratorId,
        cycle: body.cycle,
        NOT: {
          authorId: body.collaboratorId, // Excluir autoavaliação
        },
      },
      include: {
        author: true,
      },
    });

    // Buscar autoavaliação separadamente
    const selfAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: body.collaboratorId,
        cycle: body.cycle,
      },
      include: {
        answers: true,
      },
    });

    // Buscar avaliações do gestor
    const managerAssessments = await this.prisma.managerAssessment.findMany({
      where: {
        evaluatedUserId: body.collaboratorId,
        cycle: body.cycle,
      },
      include: {
        answers: true,
      },
    });

    // Buscar avaliação do comitê
    const committeeAssessment = await this.prisma.committeeAssessment.findFirst({
      where: {
        evaluatedUserId: body.collaboratorId,
        cycle: body.cycle,
        status: 'SUBMITTED',
      },
    });

    // Calcular notas médias
    const selfScore = selfAssessment 
      ? selfAssessment.answers.reduce((sum, ans) => sum + ans.score, 0) / selfAssessment.answers.length 
      : undefined;

    const managerScore = managerAssessments.length > 0
      ? managerAssessments[0].answers.reduce((sum, ans) => sum + ans.score, 0) / managerAssessments[0].answers.length
      : undefined;

    const committeeScore = committeeAssessment?.finalScore;

    const allScores = [selfScore, managerScore, committeeScore].filter(score => score !== undefined && score !== null) as number[];
    const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;

    // Preparar dados para o GenAI
    const personalData: PersonalInsightsData = {
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        jobTitle: collaborator.jobTitle || 'Não informado',
        businessUnit: collaborator.businessUnit || 'Não informado',
        seniority: collaborator.seniority || 'Não informado',
      },
      cycle: body.cycle,
      scores: {
        selfEvaluation: selfScore,
        managerEvaluation: managerScore,
        committeeEvaluation: committeeScore,
        averageScore,
      },
      assessments360: assessments360.map(assessment => ({
        assessorName: assessment.author.name,
        scores: { overall: assessment.overallScore },
        strengths: assessment.strengths || '',
        improvements: assessment.improvements || '',
      })),
      managerAssessments: managerAssessments.map(assessment => ({
        answers: assessment.answers.map(answer => ({
          criterionId: answer.criterionId,
          score: answer.score,
          justification: answer.justification || '',
        })),
      })),
      committeeAssessment: committeeAssessment ? {
        finalScore: committeeAssessment.finalScore,
        justification: committeeAssessment.justification || '',
      } : undefined,
    };

    // Gerar insights com GPT-4o
    const insights = await this.genAiService.getPersonalInsights(personalData);

    // Salvar insights no banco de dados
    const savedInsight = await this.prisma.personalInsights.create({
      data: {
        collaboratorId: body.collaboratorId,
        cycle: body.cycle,
        insights,
        collaboratorName: collaborator.name,
        jobTitle: collaborator.jobTitle || 'Não informado',
        averageScore,
      },
    });

    // Retornar resposta
    return {
      collaboratorId: savedInsight.collaboratorId,
      collaboratorName: savedInsight.collaboratorName,
      jobTitle: savedInsight.jobTitle,
      cycle: savedInsight.cycle,
      averageScore: Number(savedInsight.averageScore.toFixed(2)),
      insights: savedInsight.insights,
      generatedAt: savedInsight.createdAt.toISOString(),
    };
  }

  @Get('personal-insights/:collaboratorId/:cycle')
  @ApiOperation({ summary: 'Verifica se já existe insight gerado para o colaborador no ciclo' })
  @ApiResponse({ status: 200, description: 'Insight encontrado', type: PersonalInsightsResponse })
  @ApiResponse({ status: 404, description: 'Insight não encontrado' })
  async getExistingPersonalInsight(
    @Param('collaboratorId') collaboratorId: string,
    @Param('cycle') cycle: string
  ): Promise<PersonalInsightsResponse> {
    const insight = await this.prisma.personalInsights.findUnique({
      where: {
        collaboratorId_cycle: {
          collaboratorId,
          cycle,
        },
      },
    });

    if (!insight) {
      throw new NotFoundException('Insight não encontrado para este colaborador e ciclo');
    }

    return {
      collaboratorId: insight.collaboratorId,
      collaboratorName: insight.collaboratorName,
      jobTitle: insight.jobTitle,
      cycle: insight.cycle,
      averageScore: Number(insight.averageScore.toFixed(2)),
      insights: insight.insights,
      generatedAt: insight.createdAt.toISOString(),
    };
  }
}
