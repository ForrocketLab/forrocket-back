import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CollaboratorEvaluationData } from '../../gen-ai/dto/collaborator-summary.dto';

@Injectable()
export class CommitteeDataService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Coleta todas as avaliações de um colaborador para análise do comitê
   */
  async getCollaboratorEvaluationData(collaboratorId: string, cycle: string): Promise<CollaboratorEvaluationData> {
    // Verificar se o colaborador existe
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        seniority: true,
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Buscar autoavaliação
    const selfAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: collaboratorId,
        cycle: cycle,
      },
      include: {
        answers: true,
      },
    });

    // Buscar avaliações 360 recebidas
    const assessments360 = await this.prisma.assessment360.findMany({
      where: {
        evaluatedUserId: collaboratorId,
        cycle: cycle,
        status: 'SUBMITTED',
      },
      include: {
        author: {
          select: {
            name: true,
            jobTitle: true,
          },
        },
      },
    });

    // Buscar avaliações de gestor recebidas
    const managerAssessments = await this.prisma.managerAssessment.findMany({
      where: {
        evaluatedUserId: collaboratorId,
        cycle: cycle,
        status: 'SUBMITTED',
      },
      include: {
        author: {
          select: {
            name: true,
            jobTitle: true,
          },
        },
        answers: true,
      },
    });

    // Buscar avaliações de mentoring recebidas (onde o colaborador foi mentorado)
    const mentoringAssessments = await this.prisma.mentoringAssessment.findMany({
      where: {
        mentorId: collaboratorId, // Avaliações onde ele foi o mentor avaliado
        cycle: cycle,
        status: 'SUBMITTED',
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    // Buscar reference feedbacks recebidos
    const referenceFeedbacks = await this.prisma.referenceFeedback.findMany({
      where: {
        referencedUserId: collaboratorId,
        cycle: cycle,
        status: 'SUBMITTED',
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    // Processar autoavaliação
    const processedSelfAssessment = selfAssessment ? {
      averageScore: this.calculateAverageScore(selfAssessment.answers.map(a => a.score)),
      answers: selfAssessment.answers.map(answer => {
        const criterionInfo = this.getCriterionInfo(answer.criterionId);
        return {
          criterionName: criterionInfo.name,
          pillarName: criterionInfo.pillar,
          score: answer.score,
          justification: answer.justification,
        };
      }),
    } : null;

    // Processar avaliações 360
    const processed360 = assessments360.map(assessment => ({
      authorName: assessment.author.name,
      authorJobTitle: assessment.author.jobTitle,
      overallScore: assessment.overallScore,
      strengths: assessment.strengths,
      improvements: assessment.improvements,
    }));

    // Processar avaliações de gestor
    const processedManagerAssessments = managerAssessments.map(assessment => ({
      authorName: assessment.author.name,
      authorJobTitle: assessment.author.jobTitle,
      answers: assessment.answers.map(answer => {
        const criterionInfo = this.getCriterionInfo(answer.criterionId);
        return {
          criterionName: criterionInfo.name,
          pillarName: criterionInfo.pillar,
          score: answer.score,
          justification: answer.justification,
        };
      }),
    }));

    // Processar avaliações de mentoring
    const processedMentoring = mentoringAssessments.map(assessment => ({
      authorName: assessment.author.name,
      score: assessment.score,
      justification: assessment.justification,
    }));

    // Processar reference feedbacks
    const processedReferences = referenceFeedbacks.map(feedback => ({
      authorName: feedback.author.name,
      justification: feedback.justification,
    }));

    // Calcular estatísticas
    const allScores = [
      ...(processedSelfAssessment?.answers.map(a => a.score) || []),
      ...processed360.map(a => a.overallScore),
      ...processedManagerAssessments.flatMap(a => a.answers.map(ans => ans.score)),
      ...processedMentoring.map(a => a.score),
    ];

    const statistics = {
      averageScore: this.calculateAverageScore(allScores),
      totalEvaluations: assessments360.length + managerAssessments.length + mentoringAssessments.length + (selfAssessment ? 1 : 0),
      scoresByPillar: this.calculateScoresByPillar(processedSelfAssessment, processedManagerAssessments),
    };

    return {
      collaboratorId: collaborator.id,
      collaboratorName: collaborator.name,
      jobTitle: collaborator.jobTitle,
      seniority: collaborator.seniority,
      cycle: cycle,
      selfAssessment: processedSelfAssessment,
      assessments360: processed360,
      managerAssessments: processedManagerAssessments,
      mentoringAssessments: processedMentoring,
      referenceFeedbacks: processedReferences,
      statistics: statistics,
    };
  }

  /**
   * Calcula a média de scores
   */
  private calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Calcula scores por pilar
   */
  private calculateScoresByPillar(
    selfAssessment: any,
    managerAssessments: any[]
  ): { comportamento: number; execucao: number; gestao: number } {
    const pillarScores = {
      comportamento: [] as number[],
      execucao: [] as number[],
      gestao: [] as number[],
    };

    // Scores da autoavaliação
    if (selfAssessment) {
      selfAssessment.answers.forEach((answer: any) => {
        const pillarKey = this.mapPillarName(answer.pillarName);
        if (pillarKey) {
          pillarScores[pillarKey].push(answer.score);
        }
      });
    }

    // Scores das avaliações de gestor
    managerAssessments.forEach(assessment => {
      assessment.answers.forEach((answer: any) => {
        const pillarKey = this.mapPillarName(answer.pillarName);
        if (pillarKey) {
          pillarScores[pillarKey].push(answer.score);
        }
      });
    });

    return {
      comportamento: this.calculateAverageScore(pillarScores.comportamento),
      execucao: this.calculateAverageScore(pillarScores.execucao),
      gestao: this.calculateAverageScore(pillarScores.gestao),
    };
  }

  /**
   * Mapeia nomes de pilares para chaves padronizadas
   */
  private mapPillarName(pillarName: string): 'comportamento' | 'execucao' | 'gestao' | null {
    const normalizedName = pillarName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (normalizedName.includes('comportamento')) return 'comportamento';
    if (normalizedName.includes('execucao') || normalizedName.includes('execução')) return 'execucao';
    if (normalizedName.includes('gestao') || normalizedName.includes('gestão')) return 'gestao';
    
    return null;
  }

  /**
   * Obtém informações de critério baseado no ID
   * NOTA: Mapeamento temporário até migração completa para FK na tabela Criterion
   */
  private getCriterionInfo(criterionId: string): { name: string; pillar: string } {
    const criteriaMap: Record<string, { name: string; pillar: string }> = {
      // Pilar Comportamento
      'sentimento-de-dono': { name: 'Sentimento de Dono', pillar: 'Comportamento' },
      'resiliencia-adversidades': { name: 'Resiliência nas Adversidades', pillar: 'Comportamento' },
      'organizacao-trabalho': { name: 'Organização no Trabalho', pillar: 'Comportamento' },
      'capacidade-aprender': { name: 'Capacidade de Aprender', pillar: 'Comportamento' },
      'team-player': { name: 'Ser Team Player', pillar: 'Comportamento' },
      
      // Pilar Execução
      'entregar-qualidade': { name: 'Entregar com Qualidade', pillar: 'Execução' },
      'atender-prazos': { name: 'Atender aos Prazos', pillar: 'Execução' },
      'fazer-mais-menos': { name: 'Fazer Mais com Menos', pillar: 'Execução' },
      'pensar-fora-caixa': { name: 'Pensar Fora da Caixa', pillar: 'Execução' },
      
      // Pilar Gestão
      'gestao-gente': { name: 'Gestão de Gente', pillar: 'Gestão' },
      'gestao-resultados': { name: 'Gestão de Resultados', pillar: 'Gestão' },
      'evolucao-rocket': { name: 'Evolução da Rocket Corp', pillar: 'Gestão' },
    };

    return criteriaMap[criterionId] || { name: criterionId, pillar: 'Desconhecido' };
  }
} 