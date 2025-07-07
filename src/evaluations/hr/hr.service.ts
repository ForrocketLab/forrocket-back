import { Injectable } from '@nestjs/common';
import { CriterionPillar } from '@prisma/client';
import { CollaboratorEvolutionSummaryDto, EvolutionTrendDto, PillarPerformanceDto } from './dto/collaborator-evolution-summary.dto';
import { CollaboratorDetailedEvolutionDto } from './dto/collaborator-detailed-evolution.dto';
import { CycleDetailedDataDto } from './dto/cycle-detailed-data.dto';
import { PillarEvolutionDetailedDto, PillarCriterionEvolutionDto, PillarInsightDto, PillarBenchmarkDto } from './dto/pillar-evolution.dto';
import { BenchmarkingDto } from './dto/benchmarking.dto';
import { PredictionsDto } from './dto/predictions.dto';
import { HRDashboardDto } from './dto/hr-dashboard.dto';
import { EvolutionComparisonDto, CollaboratorComparisonDataDto, ComparisonInsightDto, ComparisonSummaryDto } from './dto/evolution-comparison.dto';
import { OrganizationalTrendsDto } from './dto/organizational-trends.dto';
import { PrismaService } from '../../database/prisma.service';

interface CollaboratorSummaryFilters {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterBy?: string;
}

interface ComparisonParams {
  collaboratorIds: string[];
  cycles?: string[];
  pillar?: string;
}

interface TrendsParams {
  startCycle?: string;
  endCycle?: string;
}

// Interfaces para o método getPerformanceHistory
interface PerformanceDataDto {
  cycle: string;
  selfScore: PillarScores;
  managerScore: PillarScores;
  finalScore: number | null;
}

interface PerformanceHistoryDto {
  performanceData: PerformanceDataDto[];
  assessmentsSubmittedCount: number;
}

interface PillarScores {
  [CriterionPillar.BEHAVIOR]: number | null;
  [CriterionPillar.EXECUTION]: number | null;
  [CriterionPillar.MANAGEMENT]: number | null;
}

interface AssessmentWithAnswers {
  id: string;
  cycle: string;
  answers: AnswerWithCriterion[];
}

interface AnswerWithCriterion {
  criterionId: string;
  score: number;
}

interface CriterionAverages {
  selfAvg: number;
  managerAvg: number;
  committeeAvg: number;
  description: string;
  pillar: string;
  count: number;
}

interface AssessmentAnswer {
  score: number;
  criterionId: string;
}

interface Assessment {
  id: string;
  cycle: string;
  comments?: string;
  answers: AssessmentAnswer[];
}

@Injectable()
export class HRService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvolutionDashboard(): Promise<HRDashboardDto> {
    // Buscar estatísticas gerais
    const totalCollaborators = await this.prisma.user.count({
      where: { isActive: true },
    });

    // Buscar ciclos únicos para análise histórica
    const cycles = await this.getUniqueCycles();
    const latestCycle = cycles[0]; // Assumindo ordenação decrescente
    const previousCycle = cycles[1];

    // Calcular médias organizacionais
    const currentStats = await this.getOrganizationStats(latestCycle);
    const previousStats = previousCycle ? await this.getOrganizationStats(previousCycle) : null;

    // Calcular crescimento organizacional
    const organizationGrowthPercentage = 
      currentStats.average && previousStats?.average
        ? ((currentStats.average - previousStats.average) / previousStats.average) * 100
        : 0;

    // Distribuição de performance
    const performanceDistribution = await this.getPerformanceDistribution(latestCycle);

    // Análise de tendências
    const trendAnalysis = await this.getTrendAnalysis();

    // Gerar destaques
    const highlights = await this.generateHighlights(currentStats, previousStats, performanceDistribution);

    return {
      organizationStats: {
        totalCollaborators,
        collaboratorsWithHistory: currentStats.collaboratorsEvaluated,
        currentOverallAverage: Number(currentStats.average?.toFixed(2)) || 0,
        previousOverallAverage: previousStats?.average ? Number(previousStats.average.toFixed(2)) : null,
        organizationGrowthPercentage: Number(organizationGrowthPercentage.toFixed(2)),
      },
      performanceDistribution,
      trendAnalysis,
      highlights,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getCollaboratorsEvolutionSummary(
    filters: CollaboratorSummaryFilters = {},
  ): Promise<CollaboratorEvolutionSummaryDto[]> {
    // Buscar todos os colaboradores ativos
    const collaborators = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        businessUnit: true,
        managerId: true,
      },
    });

    // Para cada colaborador, calcular evolução
    const summaries: CollaboratorEvolutionSummaryDto[] = [];

    for (const collaborator of collaborators) {
      const performanceHistory = await this.getPerformanceHistory(collaborator.id);
      
      if (performanceHistory.performanceData.length === 0) {
        continue; // Pular colaboradores sem histórico
      }

      // Calcular estatísticas
      const latestData = performanceHistory.performanceData[0]; // Mais recente
      const historicalAverage = this.calculateHistoricalAverage(performanceHistory.performanceData);
      const evolutionTrend = this.calculateEvolutionTrend(performanceHistory.performanceData);
      const pillarPerformance = this.calculatePillarPerformance(performanceHistory.performanceData);
      const performanceCategory = this.categorizePerformance(historicalAverage);

      // Buscar nome do gestor
      let managerName: string | null = null;
      if (collaborator.managerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: collaborator.managerId },
          select: { name: true },
        });
        managerName = manager?.name || null;
      }

      summaries.push({
        collaboratorId: collaborator.id,
        name: collaborator.name,
        jobTitle: collaborator.jobTitle,
        seniority: collaborator.seniority,
        businessUnit: collaborator.businessUnit,
        latestScore: latestData.finalScore,
        latestCycle: latestData.cycle,
        historicalAverage: Number(historicalAverage.toFixed(2)),
        totalCycles: performanceHistory.performanceData.length,
        evolutionTrend,
        pillarPerformance,
        performanceCategory,
        firstCycle: performanceHistory.performanceData[performanceHistory.performanceData.length - 1]?.cycle || null,
        managerName,
      });
    }

    // Aplicar filtros e ordenação
    return this.applySummaryFilters(summaries, filters);
  }

  async getCollaboratorDetailedEvolution(
    collaboratorId: string,
  ): Promise<CollaboratorDetailedEvolutionDto | null> {
    // Buscar dados básicos do colaborador
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        businessUnit: true,
        careerTrack: true,
        managerId: true,
        mentorId: true,
      }
    });

    if (!collaborator) {
      return null;
    }

    // Buscar histórico de performance
    const performanceHistory = await this.getPerformanceHistory(collaboratorId);
    
    if (performanceHistory.performanceData.length === 0) {
      return null;
    }

    // Buscar dados detalhados por ciclo incluindo critérios
    const cycleDetails = await this.getCycleDetails(collaboratorId, performanceHistory.performanceData.map(p => p.cycle));

    // Calcular médias por critério ao longo dos ciclos
    const criteriaAverages = new Map<string, CriterionAverages>();

    for (const cycle of cycleDetails) {
      for (const criterion of cycle.criteria) {
        const current = criteriaAverages.get(criterion.id) || {
          selfAvg: 0,
          managerAvg: 0,
          committeeAvg: 0,
          description: criterion.description,
          pillar: criterion.pillar,
          count: 0
        };

        if (criterion.selfScore) current.selfAvg += criterion.selfScore;
        if (criterion.managerScore) current.managerAvg += criterion.managerScore;
        if (criterion.committeeScore) current.committeeAvg += criterion.committeeScore;
        current.count = (current.count || 0) + 1;
        
        criteriaAverages.set(criterion.id, current);
      }
    }

    // Calcular médias finais
    const criteriaEvolution = Array.from(criteriaAverages.entries()).map(([id, data]) => ({
      id,
      description: data.description,
      pillar: data.pillar,
      selfAverage: data.selfAvg / data.count,
      managerAverage: data.managerAvg / data.count,
      committeeAverage: data.committeeAvg / data.count
    }));

    // Calcular evolução por pilar
    const pillarAverages = new Map<string, { total: number; count: number }>();
    criteriaEvolution.forEach(criterion => {
      const current = pillarAverages.get(criterion.pillar) || { total: 0, count: 0 };
      current.total += (criterion.selfAverage + criterion.managerAverage + criterion.committeeAverage) / 3;
      current.count += 1;
      pillarAverages.set(criterion.pillar, current);
    });

    const pillarEvolution = Array.from(pillarAverages.entries()).map(([pillar, data]) => {
      const pillarCriteria = criteriaEvolution.filter(c => c.pillar === pillar);
      const pillarAverage = data.total / data.count;
      
      // Calcular dados históricos do pilar
      const historicalData: Record<string, number | null> = {};
      cycleDetails.forEach(cycle => {
        const cycleAverage = this.calculatePillarAverageForCycle(cycle, pillar);
        historicalData[cycle.cycle] = cycleAverage > 0 ? cycleAverage : null;
      });
      
      // Calcular breakdown por tipo de avaliação
      const assessmentTypeBreakdown: Record<string, any> = {};
      cycleDetails.forEach(cycle => {
        const selfAvg = cycle.criteria.filter(c => c.pillar === pillar && c.selfScore !== null).reduce((sum, c) => sum + (c.selfScore || 0), 0) / cycle.criteria.filter(c => c.pillar === pillar && c.selfScore !== null).length || null;
        const managerAvg = cycle.criteria.filter(c => c.pillar === pillar && c.managerScore !== null).reduce((sum, c) => sum + (c.managerScore || 0), 0) / cycle.criteria.filter(c => c.pillar === pillar && c.managerScore !== null).length || null;
        const committeeAvg = cycle.criteria.filter(c => c.pillar === pillar && c.committeeScore !== null).reduce((sum, c) => sum + (c.committeeScore || 0), 0) / cycle.criteria.filter(c => c.pillar === pillar && c.committeeScore !== null).length || null;
        
        assessmentTypeBreakdown[cycle.cycle] = {
          selfAssessment: selfAvg,
          managerAssessment: managerAvg,
          committeeFinal: committeeAvg,
          selfVsManagerGap: selfAvg !== null && managerAvg !== null ? selfAvg - managerAvg : null,
        };
      });
      
      // Calcular estatísticas do resumo
      const historicalScores = Object.values(historicalData).filter(score => score !== null) as number[];
      const bestScore = historicalScores.length > 0 ? Math.max(...historicalScores) : null;
      const worstScore = historicalScores.length > 0 ? Math.min(...historicalScores) : null;
      const historicalAverage = historicalScores.length > 0 ? historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length : 0;
      const overallTrend = this.calculateTrendFromScores(historicalScores);
      const totalVariation = bestScore !== null && worstScore !== null ? bestScore - worstScore : 0;
      const consistencyScore = this.calculateConsistencyScore(historicalScores);
      
      return {
        pillar,
        average: pillarAverage,
        trend: this.calculateTrend(cycleDetails, pillar),
        criteria: pillarCriteria,
        summary: {
          currentAverage: pillarAverage,
          historicalAverage,
          bestScore,
          worstScore,
          totalCycles: cycleDetails.length,
          overallTrend,
          totalVariation,
          consistencyScore,
        },
        historicalData,
        assessmentTypeBreakdown,
        benchmark: {
          vsOrganizationAverage: 0.3, // Placeholder
          percentileRank: 78, // Placeholder
          seniorityRanking: 'Top 25%', // Placeholder
          roleRanking: 'Top 15%', // Placeholder
        },
        insights: [], // Será preenchido depois
        developmentRecommendations: [
          'Continuar fortalecendo pontos fortes identificados',
          'Focar no desenvolvimento das áreas com pontuação mais baixa',
        ],
        prediction: {
          expectedScore: null,
          confidenceLevel: 70,
          keyFactors: ['Histórico de evolução', 'Média do time'],
        },
        analyzedAt: new Date().toISOString(),
      } as PillarEvolutionDetailedDto;
    });

    // Gerar insights baseados nos dados
    const insights = this.generateInsights(criteriaEvolution, pillarEvolution);

    // Calcular benchmarking
    const benchmarking = await this.calculateBenchmarking(collaboratorId);

    // Gerar predições
    const predictions = this.generatePredictions(criteriaEvolution, pillarEvolution);

    // Buscar nomes de gestor e mentor
    let managerName: string | null = null;
    let mentorName: string | null = null;
    
    if (collaborator.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: collaborator.managerId },
        select: { name: true },
      });
      managerName = manager?.name || null;
    }

    if (collaborator.mentorId) {
      const mentor = await this.prisma.user.findUnique({
        where: { id: collaborator.mentorId },
        select: { name: true },
      });
      mentorName = mentor?.name || null;
    }

    // Calcular resumo
    const finalScores = performanceHistory.performanceData
      .map(p => p.finalScore)
      .filter(score => score !== null) as number[];
    
    const bestScore = finalScores.length > 0 ? Math.max(...finalScores) : null;
    const worstScore = finalScores.length > 0 ? Math.min(...finalScores) : null;
    const historicalAverage = this.calculateHistoricalAverage(performanceHistory.performanceData);
    const overallTrend = this.calculateEvolutionTrend(performanceHistory.performanceData).trend;
    const consistencyScore = this.calculateConsistencyScore(finalScores);

    return {
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
        jobTitle: collaborator.jobTitle,
        seniority: collaborator.seniority,
        businessUnit: collaborator.businessUnit,
        careerTrack: collaborator.careerTrack || '',
        managerName,
        mentorName,
      },
      summary: {
        totalCycles: cycleDetails.length,
        bestScore,
        worstScore,
        historicalAverage: Number(historicalAverage.toFixed(2)),
        overallTrend,
        consistencyScore,
      },
      cycleDetails,
      pillarEvolution,
      criteriaEvolution,
      insights: insights.map(insight => insight.description), // Converter para array de strings
      benchmarking,
      predictions,
    };
  }

  async compareCollaboratorsEvolution(params: ComparisonParams): Promise<EvolutionComparisonDto> {
    const { collaboratorIds, cycles, pillar } = params;

    // Buscar dados básicos dos colaboradores
    const collaborators = await this.prisma.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        seniority: true,
        businessUnit: true,
      },
    });

    // Para cada colaborador, buscar dados de performance
    const collaboratorData: CollaboratorComparisonDataDto[] = [];
    const allCycles = cycles || await this.getUniqueCycles();

    for (const collaborator of collaborators) {
      const performanceHistory = await this.getPerformanceHistory(collaborator.id);
      
      // Filtrar dados baseado nos parâmetros
      let historicalData: Record<string, number | null> = {};
      let pillarData: Record<string, Record<string, number | null>> | null = null;

      for (const cycleData of performanceHistory.performanceData) {
        if (allCycles.includes(cycleData.cycle)) {
          if (pillar && pillar !== 'overall') {
            // Usar dados específicos do pilar
            const pillarKey = pillar.toLowerCase() as keyof typeof cycleData.selfScore;
            historicalData[cycleData.cycle] = cycleData.finalScore; // Simplificado
          } else {
            historicalData[cycleData.cycle] = cycleData.finalScore;
          }
        }
      }

      const stats = this.calculateComparisonStats(Object.values(historicalData).filter(v => v !== null) as number[]);

      collaboratorData.push({
        collaborator: {
          id: collaborator.id,
          name: collaborator.name,
          jobTitle: collaborator.jobTitle,
          seniority: collaborator.seniority,
          businessUnit: collaborator.businessUnit,
        },
        historicalData,
        pillarData,
        stats,
      });
    }

    // Gerar insights da comparação
    const insights = this.generateComparisonInsights(collaboratorData);

    // Calcular médias do grupo por ciclo
    const groupAveragesByCycle: Record<string, number> = {};
    for (const cycle of allCycles) {
      const cycleScores = collaboratorData
        .map(c => c.historicalData[cycle])
        .filter(score => score !== null) as number[];
      
      if (cycleScores.length > 0) {
        groupAveragesByCycle[cycle] = Number((cycleScores.reduce((a, b) => a + b, 0) / cycleScores.length).toFixed(2));
      }
    }

    // Calcular resumo
    const allScores = collaboratorData.flatMap(c => 
      Object.values(c.historicalData).filter(score => score !== null) as number[]
    );
    
    const groupAverage = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
    const groupStandardDeviation = this.calculateStandardDeviation(allScores);
    const maxDifference = allScores.length > 0 ? Math.max(...allScores) - Math.min(...allScores) : 0;

    const topPerformer = collaboratorData.reduce((best, current) => 
      current.stats.average > best.stats.average ? current : best
    ).collaborator.name;

    const mostImproved = collaboratorData.reduce((best, current) => 
      current.stats.growthRate > best.stats.growthRate ? current : best
    ).collaborator.name;

    return {
      summary: {
        totalCollaborators: collaboratorData.length,
        cyclesIncluded: allCycles,
        pillarFocus: pillar || null,
        groupAverage: Number(groupAverage.toFixed(2)),
        groupStandardDeviation: Number(groupStandardDeviation.toFixed(2)),
        maxDifference: Number(maxDifference.toFixed(2)),
        topPerformer,
        mostImproved,
      },
      collaborators: collaboratorData,
      insights,
      groupAveragesByCycle,
      recommendations: [], // TODO: Implementar recomendações específicas
      analyzedAt: new Date().toISOString(),
    };
  }

  async getOrganizationalTrends(params: TrendsParams): Promise<OrganizationalTrendsDto> {
    // TODO: Implementar análise completa de tendências organizacionais
    // Por enquanto, retorno estrutura básica
    const cycles = await this.getUniqueCycles();
    const startCycle = params.startCycle || cycles[cycles.length - 1];
    const endCycle = params.endCycle || cycles[0];

    return {
      period: {
        startCycle,
        endCycle,
        totalCycles: cycles.length,
      },
      pillarTrends: [], // TODO: Implementar
      businessUnitTrends: [], // TODO: Implementar
      seniorityTrends: [], // TODO: Implementar
      patterns: [], // TODO: Implementar
      executiveSummary: {
        overallTrend: 'stable',
        keyFindings: [],
        concernAreas: [],
        opportunities: [],
        riskFactors: [],
      },
      predictions: {
        expectedOrganizationAverage: null,
        confidenceLevel: 0,
        factorsToWatch: [],
        recommendedActions: [],
      },
      externalBenchmark: null,
      analyzedAt: new Date().toISOString(),
    };
  }

  async getCollaboratorPillarEvolution(
    collaboratorId: string,
    pillar: 'BEHAVIOR' | 'EXECUTION' | 'MANAGEMENT',
  ): Promise<PillarEvolutionDetailedDto> {
    // Buscar colaborador
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaborator) {
      throw new Error('Colaborador não encontrado');
    }

    // Buscar critérios do pilar
    const criteria = await this.prisma.criterion.findMany({
      where: { pillar },
    });

    // Buscar avaliações do colaborador
    const cycleDetails = await this.getCycleDetails(collaboratorId, []);

    // Calcular médias por critério
    const criteriaEvolution: PillarCriterionEvolutionDto[] = criteria.map((criterion) => {
      const selfAverage = this.calculateAverageForCriterion(cycleDetails, criterion.id, 'self');
      const managerAverage = this.calculateAverageForCriterion(cycleDetails, criterion.id, 'manager');
      const committeeAverage = this.calculateAverageForCriterion(cycleDetails, criterion.id, 'committee');

      return {
        id: criterion.id,
        description: criterion.description,
        pillar: criterion.pillar,
        selfAverage,
        managerAverage,
        committeeAverage,
      };
    });

    // Calcular média geral do pilar
    const average = criteriaEvolution.reduce((acc, curr) => {
      const criterionAverage = (curr.selfAverage + curr.managerAverage + curr.committeeAverage) / 3;
      return acc + criterionAverage;
    }, 0) / criteriaEvolution.length;

    // Calcular tendência
    const trend = this.calculateTrend(cycleDetails, pillar);

    // Calcular dados históricos
    const historicalData: Record<string, number | null> = {};
    cycleDetails.forEach((cycle) => {
      const cycleAverage = this.calculatePillarAverageForCycle(cycle, pillar);
      historicalData[cycle.cycle] = cycleAverage;
    });

    // Calcular resumo estatístico
    const scores = Object.values(historicalData).filter((score): score is number => score !== null);
    const summary = {
      currentAverage: historicalData[cycleDetails[0]?.cycle] || null,
      historicalAverage: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: scores.length ? Math.max(...scores) : null,
      worstScore: scores.length ? Math.min(...scores) : null,
      totalCycles: scores.length,
      overallTrend: this.calculateTrendFromScores(scores),
      totalVariation: scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : 0,
      consistencyScore: this.calculateConsistencyScore(scores),
    };

    // Calcular breakdown por tipo de avaliação
    const assessmentTypeBreakdown: Record<string, any> = {};
    cycleDetails.forEach((cycle) => {
      const breakdown = {
        selfAssessment: cycle.selfAssessmentScore,
        managerAssessment: cycle.managerAssessmentScore,
        committeeFinal: cycle.committeeAssessmentScore,
        selfVsManagerGap: cycle.selfAssessmentScore !== null && cycle.managerAssessmentScore !== null
          ? cycle.selfAssessmentScore - cycle.managerAssessmentScore
          : null,
      };
      assessmentTypeBreakdown[cycle.cycle] = breakdown;
    });

    // Gerar insights
    const insights = this.generateInsights(criteriaEvolution, []);

    // Calcular benchmarking
    const benchmark = await this.calculateBenchmarking(collaboratorId);

    // Gerar predições
    const predictions = this.generatePredictions(criteriaEvolution, []);

    return {
      pillar,
      average,
      trend,
      criteria: criteriaEvolution,
      summary,
      historicalData,
      assessmentTypeBreakdown,
      benchmark: {
        vsOrganizationAverage: 0.3, // Placeholder
        percentileRank: 78, // Placeholder
        seniorityRanking: 'Top 25%', // Placeholder
        roleRanking: 'Top 15%', // Placeholder
      },
      insights,
      developmentRecommendations: [
        'Continuar fortalecendo pontos fortes identificados',
        'Focar no desenvolvimento das áreas com pontuação mais baixa',
      ],
      prediction: {
        expectedScore: predictions.nextEvaluationPrediction,
        confidenceLevel: 70,
        keyFactors: ['Histórico de evolução', 'Média do time'],
      },
      analyzedAt: new Date().toISOString(),
    };
  }

  async getHistoricalEvolution(currentCycle?: string) {
    const currentStats = await this.getOrganizationStats(currentCycle || await this.getCurrentCycle());
    const previousStats = await this.getOrganizationStats(await this.getPreviousCycle(currentCycle), true);
    const distribution = await this.getPerformanceDistribution(currentCycle);
    const trends = await this.getTrendAnalysis(currentCycle);
    const highlights = await this.generateHighlights(currentStats, previousStats, distribution);

    return {
      organizationStats: {
        totalCollaborators: currentStats.collaboratorsEvaluated,
        collaboratorsWithHistory: currentStats.collaboratorsEvaluated,
        currentOverallAverage: currentStats.average || 0,
        previousOverallAverage: previousStats?.average || 0,
        organizationGrowthPercentage: previousStats?.average && currentStats.average
          ? ((currentStats.average - previousStats.average) / previousStats.average) * 100
          : 0
      },
      performanceDistribution: distribution,
      trendAnalysis: trends,
      highlights,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getCurrentCycle(): Promise<string> {
    const latestCycle = await this.prisma.committeeAssessment.findFirst({
      orderBy: { cycle: 'desc' },
      select: { cycle: true }
    });
    return latestCycle?.cycle || '';
  }

  private async getPreviousCycle(currentCycle?: string): Promise<string> {
    const cycle = currentCycle || await this.getCurrentCycle();
    const previousCycle = await this.prisma.committeeAssessment.findFirst({
      where: { cycle: { lt: cycle } },
      orderBy: { cycle: 'desc' },
      select: { cycle: true }
    });
    return previousCycle?.cycle || '';
  }

  // Métodos auxiliares privados

  private async getUniqueCycles(): Promise<string[]> {
    // Buscar ciclos únicos de todas as avaliações
    const [selfCycles, managerCycles, committeeCycles] = await Promise.all([
      this.prisma.selfAssessment.findMany({
        where: { status: 'SUBMITTED' },
        select: { cycle: true },
        distinct: ['cycle'],
      }),
      this.prisma.managerAssessment.findMany({
        where: { status: 'SUBMITTED' },
        select: { cycle: true },
        distinct: ['cycle'],
      }),
      this.prisma.committeeAssessment.findMany({
        where: { status: 'SUBMITTED' },
        select: { cycle: true },
        distinct: ['cycle'],
      }),
    ]);

    const allCycles = new Set([
      ...selfCycles.map(c => c.cycle),
      ...managerCycles.map(c => c.cycle),
      ...committeeCycles.map(c => c.cycle),
    ]);

    return Array.from(allCycles).sort((a, b) => b.localeCompare(a)); // Ordenação decrescente
  }

  private async getOrganizationStats(cycle: string, previousCycle?: boolean) {
    const committeeAssessments = await this.prisma.committeeAssessment.findMany({
      where: { cycle, status: 'SUBMITTED' },
    });

    const finalScores = committeeAssessments.map(a => Number(a.finalScore));
    const average = finalScores.length > 0 ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : null;

    return {
      average,
      collaboratorsEvaluated: finalScores.length,
    };
  }

  private async getPerformanceDistribution(cycle?: string) {
    const currentCycle = cycle || await this.getCurrentCycle();
    const committeeAssessments = await this.prisma.committeeAssessment.findMany({
      where: { cycle, status: 'SUBMITTED' },
    });

    const finalScores = committeeAssessments.map(a => Number(a.finalScore));
    
    const highPerformers = finalScores.filter(score => score >= 4.5).length;
    const solidPerformers = finalScores.filter(score => score >= 3.5 && score < 4.5).length;
    const developing = finalScores.filter(score => score >= 2.5 && score < 3.5).length;
    const critical = finalScores.filter(score => score < 2.5).length;
    
    const total = finalScores.length;

    return {
      highPerformers,
      solidPerformers,
      developing,
      critical,
      percentages: {
        highPerformers: total > 0 ? Number((highPerformers / total * 100).toFixed(1)) : 0,
        solidPerformers: total > 0 ? Number((solidPerformers / total * 100).toFixed(1)) : 0,
        developing: total > 0 ? Number((developing / total * 100).toFixed(1)) : 0,
        critical: total > 0 ? Number((critical / total * 100).toFixed(1)) : 0,
      },
    };
  }

  private async getTrendAnalysis(cycle?: string) {
    const currentCycle = cycle || await this.getCurrentCycle();
    // Buscar todos os colaboradores ativos
    const collaborators = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    let improving = 0;
    let declining = 0;
    let stable = 0;

    // Analisar tendência de cada colaborador
    for (const collaborator of collaborators) {
      const performanceHistory = await this.getPerformanceHistory(collaborator.id);
      if (performanceHistory.performanceData.length < 2) continue;

      const scores = performanceHistory.performanceData
        .map(p => p.finalScore)
        .filter(score => score !== null) as number[];

      if (scores.length < 2) continue;

      const chronologicalScores = [...scores].reverse();
      const firstScore = chronologicalScores[0];
      const lastScore = chronologicalScores[chronologicalScores.length - 1];
      const percentageChange = ((lastScore - firstScore) / firstScore) * 100;

      if (percentageChange > 5) improving++;
      else if (percentageChange < -5) declining++;
      else stable++;
    }

    // Calcular pilares com maior crescimento e necessidade de atenção
    const pillarAnalysis = await this.analyzePillarTrends(currentCycle);

    return {
      improving,
      declining,
      stable,
      fastestGrowingPillar: pillarAnalysis.fastestGrowing,
      pillarNeedingAttention: pillarAnalysis.needingAttention
    };
  }

  private async analyzePillarTrends(cycle: string) {
    // Buscar dados reais dos pilares
    const collaborators = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    const pillarGrowth = {
      BEHAVIOR: { totalGrowth: 0, count: 0 },
      EXECUTION: { totalGrowth: 0, count: 0 },
      MANAGEMENT: { totalGrowth: 0, count: 0 }
    };

    // Analisar crescimento de cada pilar por colaborador
    for (const collaborator of collaborators) {
      const history = await this.getPerformanceHistory(collaborator.id);
      if (history.performanceData.length < 2) continue;

      const sortedData = [...history.performanceData].reverse(); // Cronológico
      const firstData = sortedData[0];
      const lastData = sortedData[sortedData.length - 1];

      // Calcular crescimento por pilar
      for (const pillar of ['BEHAVIOR', 'EXECUTION', 'MANAGEMENT'] as const) {
        const firstScore = firstData.selfScore?.[pillar] || firstData.managerScore?.[pillar];
        const lastScore = lastData.selfScore?.[pillar] || lastData.managerScore?.[pillar];

        if (firstScore && lastScore && firstScore > 0) {
          const growth = ((lastScore - firstScore) / firstScore) * 100;
          pillarGrowth[pillar].totalGrowth += growth;
          pillarGrowth[pillar].count++;
        }
      }
    }

    // Calcular médias de crescimento
    const averageGrowth = {
      BEHAVIOR: pillarGrowth.BEHAVIOR.count > 0 ? pillarGrowth.BEHAVIOR.totalGrowth / pillarGrowth.BEHAVIOR.count : 0,
      EXECUTION: pillarGrowth.EXECUTION.count > 0 ? pillarGrowth.EXECUTION.totalGrowth / pillarGrowth.EXECUTION.count : 0,
      MANAGEMENT: pillarGrowth.MANAGEMENT.count > 0 ? pillarGrowth.MANAGEMENT.totalGrowth / pillarGrowth.MANAGEMENT.count : 0
    };

    // Encontrar pilar com maior crescimento
    const fastestGrowing = Object.entries(averageGrowth)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Encontrar pilar que precisa de atenção (menor crescimento ou declínio)
    const needingAttention = Object.entries(averageGrowth)
      .sort(([,a], [,b]) => a - b)[0][0];

    return {
      fastestGrowing,
      needingAttention
    };
  }

  private async generateHighlights(currentStats: any, previousStats: any, distribution: any) {
    const highlights: any[] = [];

    // Buscar colaboradores com maior evolução e declínio
    const collaborators = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { 
        id: true,
        name: true,
        jobTitle: true,
        businessUnit: true
      }
    });

    const evolutionData = await Promise.all(
      collaborators.map(async (collaborator) => {
        const history = await this.getPerformanceHistory(collaborator.id);
        const scores = history.performanceData
          .map(p => p.finalScore)
          .filter(score => score !== null) as number[];

        if (scores.length < 2) return null;

        const chronologicalScores = [...scores].reverse();
        const firstScore = chronologicalScores[0];
        const lastScore = chronologicalScores[chronologicalScores.length - 1];
        const percentageChange = ((lastScore - firstScore) / firstScore) * 100;

        return {
          ...collaborator,
          percentageChange,
          lastScore
        };
      })
    );

    // Filtrar null e ordenar por percentageChange
    const validData = evolutionData.filter(data => data !== null);
    const topPerformers = validData
      .filter(data => data!.percentageChange > 15)
      .sort((a, b) => b!.percentageChange - a!.percentageChange)
      .slice(0, 3);

    const criticalPerformers = validData
      .filter(data => data!.percentageChange < -15)
      .sort((a, b) => a!.percentageChange - b!.percentageChange)
      .slice(0, 3);

    // Destaques positivos
    if (topPerformers.length > 0) {
      highlights.push({
        type: 'achievement',
        title: 'Top Performers em Evolução',
        description: `${topPerformers.length} colaboradores se destacaram com crescimento excepcional:
          ${topPerformers.map(p => `${p!.name} (${p!.percentageChange.toFixed(1)}%)`).join(', ')}`,
        value: topPerformers[0]!.percentageChange,
        priority: 'high'
      });
    }

    // Destaques de atenção
    if (criticalPerformers.length > 0) {
      highlights.push({
        type: 'concern',
        title: 'Colaboradores com Queda Significativa',
        description: `${criticalPerformers.length} colaboradores apresentaram declínio preocupante:
          ${criticalPerformers.map(p => `${p!.name} (${p!.percentageChange.toFixed(1)}%)`).join(', ')}`,
        value: criticalPerformers[0]!.percentageChange,
        priority: 'high'
      });
    }

    // Destaque de crescimento organizacional
    if (currentStats.average && previousStats?.average) {
      const growth = ((currentStats.average - previousStats.average) / previousStats.average) * 100;
      if (Math.abs(growth) > 2) {
        highlights.push({
          type: growth > 0 ? 'achievement' : 'concern',
          title: growth > 0 ? 'Crescimento organizacional' : 'Declínio organizacional',
          description: `A organização registrou ${growth > 0 ? 'crescimento' : 'declínio'} de ${Math.abs(growth).toFixed(1)}% na média geral.`,
          value: Number(growth.toFixed(1)),
          priority: Math.abs(growth) > 5 ? 'high' : 'medium'
        });
      }
    }

    return highlights;
  }

  private calculateHistoricalAverage(performanceData: any[]): number {
    const finalScores = performanceData
      .map(p => p.finalScore)
      .filter(score => score !== null) as number[];
    
    return finalScores.length > 0 ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : 0;
  }

  private calculateEvolutionTrend(performanceData: any[]): EvolutionTrendDto {
    const finalScores = performanceData
      .map(p => p.finalScore)
      .filter(score => score !== null) as number[];

    if (finalScores.length < 2) {
      return {
        trend: 'stable',
        percentageChange: 0,
        consecutiveCycles: 0,
      };
    }

    // Reverter ordem para análise cronológica (mais antigo primeiro)
    const chronologicalScores = [...finalScores].reverse();
    const firstScore = chronologicalScores[0];
    const lastScore = chronologicalScores[chronologicalScores.length - 1];
    
    const percentageChange = ((lastScore - firstScore) / firstScore) * 100;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (percentageChange > 5) trend = 'improving';
    else if (percentageChange < -5) trend = 'declining';

    return {
      trend,
      percentageChange: Number(percentageChange.toFixed(2)),
      consecutiveCycles: 1, // Simplificado
    };
  }

  private calculatePillarPerformance(performanceData: any[]): PillarPerformanceDto {
    // Simplificação - calcular médias dos pilares do último ciclo
    const latestData = performanceData[0];
    
    if (!latestData) {
      return {
        behavior: null,
        execution: null,
        management: null,
        bestPillar: null,
        worstPillar: null,
      };
    }

    const behavior = latestData.selfScore?.BEHAVIOR || latestData.managerScore?.BEHAVIOR || null;
    const execution = latestData.selfScore?.EXECUTION || latestData.managerScore?.EXECUTION || null;
    const management = latestData.selfScore?.MANAGEMENT || latestData.managerScore?.MANAGEMENT || null;

    const scores = [
      { pillar: 'BEHAVIOR', score: behavior },
      { pillar: 'EXECUTION', score: execution },
      { pillar: 'MANAGEMENT', score: management },
    ].filter(p => p.score !== null);

    const bestPillar = scores.length > 0 ? scores.reduce((best, current) => 
      (current.score! > best.score!) ? current : best).pillar : null;
    
    const worstPillar = scores.length > 0 ? scores.reduce((worst, current) => 
      (current.score! < worst.score!) ? current : worst).pillar : null;

    return {
      behavior,
      execution,
      management,
      bestPillar,
      worstPillar,
    };
  }

  private categorizePerformance(average: number): 'high-performer' | 'solid-performer' | 'developing' | 'critical' {
    if (average >= 4.5) return 'high-performer';
    if (average >= 3.5) return 'solid-performer';
    if (average >= 2.5) return 'developing';
    return 'critical';
  }

  private applySummaryFilters(
    summaries: CollaboratorEvolutionSummaryDto[], 
    filters: CollaboratorSummaryFilters
  ): CollaboratorEvolutionSummaryDto[] {
    let filtered = [...summaries];

    // Aplicar filtros
    if (filters.filterBy) {
      switch (filters.filterBy) {
        case 'improving':
          filtered = filtered.filter(s => s.evolutionTrend.trend === 'improving');
          break;
        case 'declining':
          filtered = filtered.filter(s => s.evolutionTrend.trend === 'declining');
          break;
        case 'stable':
          filtered = filtered.filter(s => s.evolutionTrend.trend === 'stable');
          break;
        case 'high-performers':
          filtered = filtered.filter(s => s.performanceCategory === 'high-performer');
          break;
        case 'low-performers':
          filtered = filtered.filter(s => s.performanceCategory === 'critical');
          break;
      }
    }

    // Aplicar ordenação
    if (filters.sortBy) {
      const order = filters.sortOrder || 'desc';
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'latestScore':
            aValue = a.latestScore || 0;
            bValue = b.latestScore || 0;
            break;
          case 'evolution':
            aValue = a.evolutionTrend.percentageChange;
            bValue = b.evolutionTrend.percentageChange;
            break;
          case 'totalCycles':
            aValue = a.totalCycles;
            bValue = b.totalCycles;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }

  private async getCycleDetails(collaboratorId: string, cycles: string[]): Promise<CycleDetailedDataDto[]> {
    const cycleDetails = await Promise.all(
      cycles.map(async (cycle) => {
        // Buscar avaliações do ciclo
        const selfAssessment = await this.prisma.selfAssessment.findFirst({
          where: { authorId: collaboratorId, cycle },
          select: {
            id: true,
            cycle: true,
            answers: {
              select: {
                score: true,
                criterionId: true,
                justification: true,
              },
            },
          },
        });

        const managerAssessment = await this.prisma.managerAssessment.findFirst({
          where: { evaluatedUserId: collaboratorId, cycle },
          select: {
            id: true,
            cycle: true,
            answers: {
              select: {
                score: true,
                criterionId: true,
                justification: true,
              },
            },
          },
        });

        const committeeAssessment = await this.prisma.committeeAssessment.findFirst({
          where: { evaluatedUserId: collaboratorId, cycle },
          select: {
            id: true,
            cycle: true,
            finalScore: true,
            justification: true,
          },
        });

        // Buscar critérios
        const criteria = await this.prisma.criterion.findMany({
          select: {
            id: true,
            description: true,
            pillar: true,
          },
        });

        // Mapear critérios e notas
        const criteriaMap = new Map<string, {
          id: string;
          description: string;
          pillar: string;
          selfScore?: number;
          managerScore?: number;
          committeeScore?: number;
        }>();

        // Inicializar todos os critérios
        criteria.forEach(criterion => {
          criteriaMap.set(criterion.id, {
            id: criterion.id,
            description: criterion.description,
            pillar: criterion.pillar,
          });
        });

        // Adicionar notas da autoavaliação
        selfAssessment?.answers?.forEach((answer) => {
          const criterion = criteriaMap.get(answer.criterionId);
          if (criterion) {
            criterion.selfScore = answer.score;
          }
        });

        // Adicionar notas da avaliação do gestor
        managerAssessment?.answers?.forEach((answer) => {
          const criterion = criteriaMap.get(answer.criterionId);
          if (criterion) {
            criterion.managerScore = answer.score;
          }
        });

        // Calcular médias
        const selfAssessmentScore = selfAssessment?.answers
          ? this.calculateAverageScore(selfAssessment.answers)
          : null;

        const managerAssessmentScore = managerAssessment?.answers
          ? this.calculateAverageScore(managerAssessment.answers)
          : null;

        const committeeAssessmentScore = committeeAssessment?.finalScore || null;

        // Coletar comentários
        const comments: string[] = [];
        if (selfAssessment?.answers?.length) {
          const justifications = selfAssessment.answers
            .filter(a => a.justification)
            .map(a => `Autoavaliação: ${a.justification}`);
          comments.push(...justifications);
        }
        if (managerAssessment?.answers?.length) {
          const justifications = managerAssessment.answers
            .filter(a => a.justification)
            .map(a => `Gestor: ${a.justification}`);
          comments.push(...justifications);
        }
        if (committeeAssessment?.justification) {
          comments.push(`Comitê: ${committeeAssessment.justification}`);
        }

        return {
          cycle,
          selfAssessmentScore,
          managerAssessmentScore,
          committeeAssessmentScore,
          criteria: Array.from(criteriaMap.values()),
          comments,
        };
      })
    );

    return cycleDetails;
  }

  private calculateTrend(cycleDetails: CycleDetailedDataDto[], pillar: string): string {
    // Implementar lógica de cálculo de tendência
    return 'stable';
  }

  private generateInsights(
    criteriaEvolution: PillarCriterionEvolutionDto[],
    pillarEvolution: PillarEvolutionDetailedDto[],
  ): PillarInsightDto[] {
    const insights: PillarInsightDto[] = [];

    // Identificar pontos fortes
    const strongCriteria = criteriaEvolution
      .filter(c => (c.selfAverage + c.managerAverage + c.committeeAverage) / 3 >= 4.0);
    
    strongCriteria.forEach(criterion => {
      insights.push({
        type: 'strength',
        description: `Critério "${criterion.description}" é um ponto forte com média alta`,
        relatedCriterion: criterion.id,
        value: (criterion.selfAverage + criterion.managerAverage + criterion.committeeAverage) / 3,
        priority: 'high',
      });
    });

    // Identificar áreas de melhoria
    const weakCriteria = criteriaEvolution
      .filter(c => (c.selfAverage + c.managerAverage + c.committeeAverage) / 3 <= 3.0);
    
    weakCriteria.forEach(criterion => {
      insights.push({
        type: 'weakness',
        description: `Critério "${criterion.description}" precisa de atenção e desenvolvimento`,
        relatedCriterion: criterion.id,
        value: (criterion.selfAverage + criterion.managerAverage + criterion.committeeAverage) / 3,
        priority: 'high',
      });
    });

    return insights;
  }

  private generatePredictions(
    criteriaEvolution: PillarCriterionEvolutionDto[],
    pillarEvolution: PillarEvolutionDetailedDto[],
  ): PredictionsDto {
    // Calcular média atual
    const currentAverage = criteriaEvolution.reduce((acc, curr) => {
      const avg = (curr.selfAverage + curr.managerAverage + curr.committeeAverage) / 3;
      return acc + avg;
    }, 0) / criteriaEvolution.length;

    // Identificar áreas de melhoria
    const improvementAreas = criteriaEvolution
      .filter(c => (c.selfAverage + c.managerAverage + c.committeeAverage) / 3 < 3.5)
      .map(c => c.description);

    // Identificar pontos fortes
    const strengths = criteriaEvolution
      .filter(c => (c.selfAverage + c.managerAverage + c.committeeAverage) / 3 >= 4.0)
      .map(c => c.description);

    return {
      nextEvaluationPrediction: currentAverage * 1.1, // Estimativa simples de 10% de melhoria
      confidenceLevel: 70, // Valor fixo para exemplo
      improvementAreas: improvementAreas.length > 0 ? improvementAreas : ['Sem áreas críticas identificadas'],
      strengths: strengths.length > 0 ? strengths : ['Desenvolvimento equilibrado'],
    };
  }

  private calculateConsistencyScore(scores: number[]): number {
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Converter para score de consistência (0-100), onde menor desvio = maior consistência
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 50));
    return Number(consistencyScore.toFixed(0));
  }

  private calculateComparisonStats(scores: number[]) {
    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const trend = this.calculateTrendFromScores(scores);
    const growthRate = scores.length > 1 ? ((scores[scores.length - 1] - scores[0]) / scores[0]) * 100 : 0;
    const consistency = this.calculateConsistencyScore(scores);

    return {
      average: Number(average.toFixed(2)),
      trend,
      totalCycles: scores.length,
      growthRate: Number(growthRate.toFixed(2)),
      consistency,
    };
  }

  private calculateTrendFromScores(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 2) return 'stable';
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private generateComparisonInsights(collaboratorData: CollaboratorComparisonDataDto[]): ComparisonInsightDto[] {
    const insights: ComparisonInsightDto[] = [];

    // Encontrar líder
    const leader = collaboratorData.reduce((best, current) => 
      current.stats.average > best.stats.average ? current : best
    );

    insights.push({
      type: 'leader',
      collaboratorId: leader.collaborator.id,
      collaboratorName: leader.collaborator.name,
      description: `Apresenta a melhor performance média do grupo (${leader.stats.average})`,
      value: leader.stats.average,
    });

    // Encontrar quem mais melhorou
    const mostImproved = collaboratorData.reduce((best, current) => 
      current.stats.growthRate > best.stats.growthRate ? current : best
    );

    if (mostImproved.stats.growthRate > 0) {
      insights.push({
        type: 'most_improved',
        collaboratorId: mostImproved.collaborator.id,
        collaboratorName: mostImproved.collaborator.name,
        description: `Apresentou o maior crescimento no período (${mostImproved.stats.growthRate}%)`,
        value: mostImproved.stats.growthRate,
      });
    }

    return insights;
  }

  private calculateStandardDeviation(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  /**
   * Implementação própria do método getPerformanceHistory para evitar dependência circular
   */
  private async getPerformanceHistory(userId: string): Promise<PerformanceHistoryDto> {
    const [
      criteria,
      selfAssessments,
      managerAssessments,
      committeeAssessments,
      submitted360Assessments,
    ] = await Promise.all([
      this.prisma.criterion.findMany(),
      this.prisma.selfAssessment.findMany({
        where: { authorId: userId, status: 'SUBMITTED' },
        include: { answers: true },
      }),
      this.prisma.managerAssessment.findMany({
        where: { evaluatedUserId: userId, status: 'SUBMITTED' },
        include: { answers: true },
      }),
      this.prisma.committeeAssessment.findMany({
        where: { evaluatedUserId: userId, status: 'SUBMITTED' },
      }),
      this.prisma.assessment360.findMany({
        where: { evaluatedUserId: userId, status: 'SUBMITTED' },
        select: {
          cycle: true,
          overallScore: true,
        },
      }),
    ]);

    // Mapeia critérioId para seu pilar
    const criteriaPillarMap = new Map<string, CriterionPillar>(
      criteria.map((c) => [c.id, c.pillar as CriterionPillar]),
    );

    const selfScoresByCycle = this.calculatePillarScoresLocal(selfAssessments, criteriaPillarMap);
    const managerScoresByCycle = this.calculatePillarScoresLocal(managerAssessments, criteriaPillarMap);

    // Formata as notas finais do comitê
    const finalScoresByCycle = new Map<string, number>(
      committeeAssessments.map((assessment) => [
        assessment.cycle,
        Number(assessment.finalScore.toFixed(2)),
      ]),
    );

    // Consolida os dados por ciclo
    const allCycles = [
      ...new Set<string>([
        ...selfScoresByCycle.keys(),
        ...managerScoresByCycle.keys(),
        ...finalScoresByCycle.keys(),
      ]),
    ].sort((a, b) => b.localeCompare(a)); // ordena por ciclos mais recentes

    const performanceData: PerformanceDataDto[] = [];
    const emptyPillarScores: PillarScores = {
      [CriterionPillar.BEHAVIOR]: null,
      [CriterionPillar.EXECUTION]: null,
      [CriterionPillar.MANAGEMENT]: null,
    };

    for (const cycle of allCycles) {
      performanceData.push({
        cycle,
        selfScore: selfScoresByCycle.get(cycle) ?? { ...emptyPillarScores },
        managerScore: managerScoresByCycle.get(cycle) ?? { ...emptyPillarScores },
        finalScore: finalScoresByCycle.get(cycle) ?? null,
      });
    }

    const totalAssessmentsSubmitted = selfAssessments.length + submitted360Assessments.length;

    return {
      performanceData,
      assessmentsSubmittedCount: totalAssessmentsSubmitted,
    };
  }

  /**
   * Função auxiliar para calcular as médias de notas por pilar para um conjunto de avaliações.
   */
  private calculatePillarScoresLocal(
    assessments: (AssessmentWithAnswers & { answers: AnswerWithCriterion[] })[],
    criteriaPillarMap: Map<string, CriterionPillar>,
  ): Map<string, PillarScores> {
    const scoresByCycle = new Map<string, PillarScores>();

    for (const assessment of assessments) {
      if (!assessment.answers || assessment.answers.length === 0) {
        continue;
      }

      // Agrupa as notas e contagens por pilar
      const pillarScores = {
        [CriterionPillar.BEHAVIOR]: { total: 0, count: 0 },
        [CriterionPillar.EXECUTION]: { total: 0, count: 0 },
        [CriterionPillar.MANAGEMENT]: { total: 0, count: 0 },
      };

      for (const answer of assessment.answers) {
        const pillar = criteriaPillarMap.get(answer.criterionId);
        if (pillar && pillarScores[pillar]) {
          pillarScores[pillar].total += answer.score;
          pillarScores[pillar].count++;
        }
      }

      // Calcula a média para cada pilar
      const averageScores: PillarScores = {
        [CriterionPillar.BEHAVIOR]:
          pillarScores.BEHAVIOR.count > 0
            ? Number((pillarScores.BEHAVIOR.total / pillarScores.BEHAVIOR.count).toFixed(2))
            : null,
        [CriterionPillar.EXECUTION]:
          pillarScores.EXECUTION.count > 0
            ? Number((pillarScores.EXECUTION.total / pillarScores.EXECUTION.count).toFixed(2))
            : null,
        [CriterionPillar.MANAGEMENT]:
          pillarScores.MANAGEMENT.count > 0
            ? Number((pillarScores.MANAGEMENT.total / pillarScores.MANAGEMENT.count).toFixed(2))
            : null,
      };

      scoresByCycle.set(assessment.cycle, averageScores);
    }

    return scoresByCycle;
  }

  private calculateAverageScore(answers: AssessmentAnswer[]): number {
    if (!answers || answers.length === 0) return 0;
    const sum = answers.reduce((acc, answer) => acc + answer.score, 0);
    return sum / answers.length;
  }

  private calculateAverageForCriterion(cycleDetails: CycleDetailedDataDto[], criterionId: string, type: 'self' | 'manager' | 'committee'): number {
    const scores = cycleDetails
      .map(cycle => {
        const criterion = cycle.criteria.find(c => c.id === criterionId);
        if (!criterion) return null;
        
        switch (type) {
          case 'self':
            return criterion.selfScore;
          case 'manager':
            return criterion.managerScore;
          case 'committee':
            return criterion.committeeScore;
          default:
            return null;
        }
      })
      .filter((score): score is number => score !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  private calculatePillarAverageForCycle(cycle: CycleDetailedDataDto, pillar: string): number {
    const scores = cycle.criteria
      .filter(c => c.pillar === pillar)
      .map(c => {
        // Usar a pontuação do comitê se disponível, senão usar a do gestor, senão a autoavaliação
        return c.committeeScore || c.managerScore || c.selfScore;
      })
      .filter((score): score is number => score !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  private async calculateBenchmarking(collaboratorId: string): Promise<BenchmarkingDto> {
    // Implementar lógica de cálculo de benchmarking
    return {
      rankInBusinessUnit: 5,
      totalInBusinessUnit: 20,
      percentileInBusinessUnit: 75,
      rankInSeniority: 3,
      totalInSeniority: 15,
      percentileInSeniority: 80,
    };
  }
} 