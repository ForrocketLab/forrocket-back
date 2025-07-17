import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AssessmentStatus, CriterionPillar, Criterion } from '@prisma/client';

import {
  MentorDashboardResponseDto,
  MentorDashboardSummaryDto,
  MentoredCollaboratorDto,
  Collaborator360AssessmentDto,
  CollaboratorCycleMeanDto,
  CollaboratorPerformanceDto,
} from './dto';
import { EncryptionService } from '../common/services/encryption.service';
import { PrismaService } from '../database/prisma.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';

@Injectable()
export class MentorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly cyclesService: CyclesService,
  ) {}

  /**
   * Obtém o número de avaliações pendentes para o mentor no ciclo especificado
   * @param mentorId ID do mentor
   * @param _cycle Ciclo de avaliação
   * @returns Número de avaliações pendentes
   */
  async getPendingReviewsCount(mentorId: string, _cycle: string): Promise<number> {
    // Buscar todos os colaboradores mentorados
    const mentoredCollaborators = await this.getMentoredCollaborators(mentorId);

    if (mentoredCollaborators.length === 0) {
      return 0;
    }

    // Para mentores, não há avaliações pendentes já que não fazem mais avaliações diretas
    return 0;
  }

  /**
   * Obtém a média das avaliações de mentoring recebidas pelo mentor
   * @param mentorId ID do mentor
   * @param cycle Ciclo de avaliação
   * @returns Média das avaliações ou null se não houver avaliações
   */
  async getMentoringAssessmentAverage(mentorId: string, cycle: string): Promise<number | null> {
    const mentoringAssessments = await this.prisma.mentoringAssessment.findMany({
      where: {
        mentorId,
        cycle,
        status: AssessmentStatus.SUBMITTED,
      },
      select: {
        score: true,
      },
    });

    if (mentoringAssessments.length === 0) {
      return null;
    }

    const totalScore = mentoringAssessments.reduce((sum, assessment) => sum + assessment.score, 0);
    return parseFloat((totalScore / mentoringAssessments.length).toFixed(2));
  }

  /**
   * Obtém todos os colaboradores mentorados por um mentor
   * @param mentorId ID do mentor
   * @returns Lista de colaboradores mentorados
   */
  async getMentoredCollaborators(mentorId: string) {
    return await this.prisma.user.findMany({
      where: {
        mentorId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
      },
    });
  }

  /**
   * Obtém todos os colaboradores mentorados com informações detalhadas sobre avaliações
   * @param mentorId ID do mentor
   * @param cycle Ciclo de avaliação
   * @returns Lista detalhada de colaboradores mentorados
   */
  async getMentoredCollaboratorsWithAssessmentStatus(
    mentorId: string,
    cycle: string,
  ): Promise<MentoredCollaboratorDto[]> {
    const mentoredCollaborators = await this.getMentoredCollaborators(mentorId);

    if (mentoredCollaborators.length === 0) {
      return [];
    }

    const collaboratorsWithStatus = await Promise.all(
      mentoredCollaborators.map(async (collaborator) => {
        // Buscar autoavaliação do colaborador
        const selfAssessment = await this.prisma.selfAssessment.findFirst({
          where: {
            authorId: collaborator.id,
            cycle,
            status: AssessmentStatus.SUBMITTED,
          },
          include: {
            answers: true,
          },
        });

        // Buscar avaliações de gestor recebidas pelo colaborador
        const managerAssessments = await this.prisma.managerAssessment.findMany({
          where: {
            evaluatedUserId: collaborator.id,
            cycle,
            status: AssessmentStatus.SUBMITTED,
          },
          include: {
            answers: true,
          },
        });

        // Calcular médias
        const selfAssessmentAverage = this.calculateSelfAssessmentAverage(selfAssessment);
        const managerAssessmentAverage = this.calculateManagerAssessmentAverage(managerAssessments);

        // Gerar iniciais
        const initials = collaborator.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          collaboratorId: collaborator.id,
          collaboratorName: collaborator.name,
          collaboratorEmail: collaborator.email,
          jobTitle: collaborator.jobTitle,
          seniority: collaborator.seniority,
          mentorAssessmentStatus: AssessmentStatus.PENDING, // Mentores não fazem mais avaliações diretas
          selfAssessmentAverage,
          managerAssessmentAverage,
          initials,
        };
      }),
    );

    return collaboratorsWithStatus;
  }

  /**
   * Obtém dashboard completo do mentor para um ciclo específico
   * @param mentorId ID do mentor
   * @param cycle Ciclo de avaliação
   * @returns Dashboard completo com estatísticas e lista de mentorados
   */
  async getMentorDashboard(mentorId: string, cycle: string): Promise<MentorDashboardResponseDto> {
    // Verificar se o usuário é mentor
    const isMentor = await this.isMentor(mentorId);
    if (!isMentor) {
      throw new ForbiddenException('Usuário não é mentor de nenhum colaborador');
    }

    // Buscar dados em paralelo para melhor performance
    const [mentoringAssessmentAverage, pendingReviews, mentoredCollaborators] = await Promise.all([
      this.getMentoringAssessmentAverage(mentorId, cycle),
      this.getPendingReviewsCount(mentorId, cycle),
      this.getMentoredCollaboratorsWithAssessmentStatus(mentorId, cycle),
    ]);

    const totalMentoredCollaborators = mentoredCollaborators.length;
    const completedReviews = totalMentoredCollaborators - pendingReviews;
    const completionPercentage =
      totalMentoredCollaborators > 0
        ? Math.round((completedReviews / totalMentoredCollaborators) * 100)
        : 100;

    const summary: MentorDashboardSummaryDto = {
      mentoringAssessmentAverage,
      pendingReviews,
      totalMentoredCollaborators,
      completionPercentage,
    };

    return {
      summary,
      mentoredCollaborators,
      cycle,
    };
  }

  /**
   * Verifica se um usuário é mentor de algum colaborador
   * @param userId ID do usuário
   * @returns True se é mentor, false caso contrário
   */
  async isMentor(userId: string): Promise<boolean> {
    const mentoredCount = await this.prisma.user.count({
      where: {
        mentorId: userId,
        isActive: true,
      },
    });

    return mentoredCount > 0;
  }

  /**
   * Recupera todas as avaliações 360 para um colaborador em um ciclo específico
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação
   * @returns Lista de avaliações 360 com informações descriptografadas
   */
  async getCollaborator360Assessments(
    collaboratorId: string,
    cycle: string,
  ): Promise<Collaborator360AssessmentDto[]> {
    // Verificar se o colaborador existe
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId, isActive: true },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Buscar todas as avaliações de gestor recebidas pelo colaborador no ciclo
    const managerAssessments = await this.prisma.managerAssessment.findMany({
      where: {
        evaluatedUserId: collaboratorId,
        cycle,
        status: AssessmentStatus.SUBMITTED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        answers: true,
      },
    });

    // Buscar informações dos critérios separadamente para mapear os dados
    const allCriterionIds = managerAssessments.flatMap((assessment) =>
      assessment.answers.map((answer) => answer.criterionId),
    );
    const criteriaMap = await this.prisma.criterion
      .findMany({
        where: {
          id: { in: allCriterionIds },
        },
      })
      .then((criteria) =>
        criteria.reduce(
          (map, criterion) => {
            map[criterion.id] = criterion;
            return map;
          },
          {} as Record<string, Criterion>,
        ),
      );

    // Mapear para DTOs descriptografados
    const assessments360 = managerAssessments.map((assessment) => {
      const decryptedAnswers = assessment.answers.map((answer) => {
        const decryptedJustification = this.encryptionService.decrypt(answer.justification);

        const criterion = criteriaMap[answer.criterionId];

        return {
          criterionId: answer.criterionId,
          criterionName: criterion?.name || 'Critério não encontrado',
          pillar: criterion?.pillar || CriterionPillar.EXECUTION,
          score: answer.score,
          justification: decryptedJustification,
        };
      });

      return {
        assessmentId: assessment.id,
        authorId: assessment.authorId,
        authorName: assessment.author.name,
        authorEmail: assessment.author.email,
        authorJobTitle: assessment.author.jobTitle,
        cycle,
        status: assessment.status,
        submittedAt: assessment.submittedAt,
        answers: decryptedAnswers,
      };
    });

    return assessments360;
  }

  /**
   * Calcula as métricas de performance completas para um colaborador
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação atual
   * @returns Métricas de performance detalhadas
   */
  async getCollaboratorPerformanceMetrics(
    collaboratorId: string,
    cycle: string,
  ): Promise<CollaboratorPerformanceDto> {
    // Verificar se o colaborador existe
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        businessUnit: true,
        mentorId: true,
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // 1. Buscar score geral do comitê para o ciclo atual
    const committeeAssessment = await this.prisma.committeeAssessment.findFirst({
      where: {
        evaluatedUserId: collaboratorId,
        cycle,
        status: AssessmentStatus.SUBMITTED,
      },
    });

    const committeeOverallScore = committeeAssessment?.finalScore || null;

    // 2. Calcular crescimento vs. ciclo anterior
    const previousCycle = this.getPreviousCycle(cycle);
    const previousCommitteeAssessment = await this.prisma.committeeAssessment.findFirst({
      where: {
        evaluatedUserId: collaboratorId,
        cycle: previousCycle,
        status: AssessmentStatus.SUBMITTED,
      },
    });

    const performanceGrowth = this.calculatePerformanceGrowth(
      committeeOverallScore,
      previousCommitteeAssessment?.finalScore || null,
    );

    // 3. Contar total de avaliações completadas no ciclo atual
    const [selfAssessmentCount, assessments360Count, mentoringAssessmentCount] = await Promise.all([
      // Autoavaliação FEITA pela pessoa
      this.prisma.selfAssessment.count({
        where: {
          authorId: collaboratorId,
          cycle,
          status: AssessmentStatus.SUBMITTED,
        },
      }),
      // Avaliações 360 RECEBIDAS pela pessoa (feitas por gestores)
      this.prisma.assessment360.count({
        where: {
          authorId: collaboratorId,
          cycle,
          status: AssessmentStatus.SUBMITTED,
        },
      }),
      // Avaliações de mentoring FEITAS pela pessoa (se ela é mentora)
      this.prisma.mentoringAssessment.count({
        where: {
          authorId: collaboratorId,
          cycle,
          status: AssessmentStatus.SUBMITTED,
        },
      }),
    ]);

    const totalAssessmentsCompleted =
      selfAssessmentCount + assessments360Count + mentoringAssessmentCount;

    return {
      committeeOverallScore,
      performanceGrowth,
      totalAssessmentsCompleted,
      assessmentBreakdown: {
        selfAssessment: selfAssessmentCount,
        assessments360: assessments360Count,
        mentoringAssessments: mentoringAssessmentCount,
      },
    };
  }

  /**
   * Calcula as médias de performance por ciclo para um colaborador
   * @param collaboratorId ID do colaborador
   * @returns Lista de performances por ciclo
   */
  async getCollaboratorCyclePerformances(
    collaboratorId: string,
  ): Promise<CollaboratorCycleMeanDto[]> {
    // Buscar todos os ciclos onde o colaborador teve avaliações (autoavaliação ou recebidas)
    const [selfAssessmentCycles, managerAssessmentCycles] = await Promise.all([
      this.prisma.selfAssessment.findMany({
        where: {
          authorId: collaboratorId,
          status: AssessmentStatus.SUBMITTED,
        },
        select: { cycle: true },
        distinct: ['cycle'],
      }),
      this.prisma.managerAssessment.findMany({
        where: {
          evaluatedUserId: collaboratorId,
          status: AssessmentStatus.SUBMITTED,
        },
        select: { cycle: true },
        distinct: ['cycle'],
      }),
    ]);

    // Combinar e deduplicas ciclos
    const allCycles = [
      ...selfAssessmentCycles.map((item) => item.cycle),
      ...managerAssessmentCycles.map((item) => item.cycle),
    ];
    const uniqueCycles = [...new Set(allCycles)];

    const cyclePerformances = await Promise.all(
      uniqueCycles.map(async (cycle) => {
        // Média da autoavaliação FEITA pela pessoa
        const selfAssessment = await this.prisma.selfAssessment.findFirst({
          where: {
            authorId: collaboratorId,
            cycle,
            status: AssessmentStatus.SUBMITTED,
          },
          include: {
            answers: true,
          },
        });

        const selfAssessmentMean = this.calculateSelfAssessmentAverage(selfAssessment);

        // Buscar avaliações de gestor RECEBIDAS pela pessoa
        const managerAssessments = await this.prisma.managerAssessment.findMany({
          where: {
            evaluatedUserId: collaboratorId,
            cycle,
            status: AssessmentStatus.SUBMITTED,
          },
          include: {
            answers: true,
          },
        });

        // Buscar avaliações de gestor RECEBIDAS pela pessoa
        const asessments360 = await this.prisma.assessment360.findMany({
          where: {
            evaluatedUserId: collaboratorId,
            cycle,
            status: AssessmentStatus.SUBMITTED,
          },
        });

        // Buscar critérios para categorizar por pilares
        const allCriterionIds = managerAssessments.flatMap((assessment) =>
          assessment.answers.map((answer) => answer.criterionId),
        );

        const criteriaMap = await this.prisma.criterion
          .findMany({
            where: {
              id: { in: allCriterionIds },
            },
          })
          .then((criteria) =>
            criteria.reduce(
              (map, criterion) => {
                map[criterion.id] = criterion;
                return map;
              },
              {} as Record<string, Criterion>,
            ),
          );

        // Separar por pilares
        const executionScores: number[] = [];
        const behaviorScores: number[] = [];
        const allScores: number[] = [];

        managerAssessments.forEach((assessment) => {
          assessment.answers.forEach((answer) => {
            allScores.push(answer.score);

            const criterion = criteriaMap[answer.criterionId];
            if (criterion?.pillar === CriterionPillar.EXECUTION) {
              executionScores.push(answer.score);
            } else if (criterion?.pillar === CriterionPillar.BEHAVIOR) {
              behaviorScores.push(answer.score);
            }
          });
        });

        // Calcular médias
        const managerExecutionMean =
          executionScores.length > 0
            ? parseFloat(
                (
                  executionScores.reduce((sum, score) => sum + score, 0) / executionScores.length
                ).toFixed(2),
              )
            : null;

        const managerBehaviorMean =
          behaviorScores.length > 0
            ? parseFloat(
                (
                  behaviorScores.reduce((sum, score) => sum + score, 0) / behaviorScores.length
                ).toFixed(2),
              )
            : null;

        // Calcular média das avaliações 360 recebidas pela pessoa
        const assessment360Mean =
          asessments360.length > 0
            ? parseFloat(
                (
                  asessments360.reduce((sum, assessment) => sum + assessment.overallScore, 0) /
                  asessments360.length
                ).toFixed(2),
              )
            : null;

        // Buscar nota final do comitê para este ciclo
        const committeeAssessment = await this.prisma.committeeAssessment.findFirst({
          where: {
            evaluatedUserId: collaboratorId,
            cycle,
            status: AssessmentStatus.SUBMITTED,
          },
        });

        const overallScore = committeeAssessment?.finalScore || null;

        return {
          cycle,
          selfAssessmentMean,
          managerExecutionMean,
          managerBehaviorMean,
          assessments360Mean: assessment360Mean,
          overallScore,
        };
      }),
    );

    // Ordenar por ciclo (mais recentes primeiro)
    return cyclePerformances.sort((a, b) => b.cycle.localeCompare(a.cycle));
  }

  /**
   * Obtém crescimento de performance entre dois ciclos
   * @param currentScore Score atual
   * @param previousScore Score anterior
   * @returns Crescimento em pontos percentuais ou null se não há dados suficientes
   *
   * **Cálculo do crescimento:**
   * - Fórmula: ((scoreAtual - scoreAnterior) / scoreAnterior) * 100
   * - Exemplo: Score atual = 4.5, Score anterior = 4.0
   * - Crescimento = ((4.5 - 4.0) / 4.0) * 100 = 12.5%
   * - Valores negativos indicam declínio na performance
   */
  private calculatePerformanceGrowth(
    currentScore: number | null,
    previousScore: number | null,
  ): number | null {
    if (currentScore === null || previousScore === null) {
      return null;
    }

    const growth = ((currentScore - previousScore) / previousScore) * 100;
    return parseFloat(growth.toFixed(2));
  }

  /**
   * Obtém o ciclo anterior baseado no formato "YYYY.N"
   * @param cycle Ciclo atual
   * @returns Ciclo anterior
   */
  private getPreviousCycle(cycle: string): string {
    const [year, period] = cycle.split('.').map(Number);

    if (period === 1) {
      // Se for o primeiro período, vai para o último período do ano anterior
      return `${year - 1}.2`;
    } else {
      // Se for o segundo período, vai para o primeiro período do mesmo ano
      return `${year}.1`;
    }
  }

  /**
   * Calcula a média da autoavaliação de um colaborador
   * @param selfAssessment Autoavaliação com respostas
   * @returns Média ou null se não houver dados
   */
  private calculateSelfAssessmentAverage(
    selfAssessment: {
      answers: Array<{ score: number }>;
    } | null,
  ): number | null {
    if (!selfAssessment?.answers || selfAssessment.answers.length === 0) {
      return null;
    }

    const totalScore = selfAssessment.answers.reduce((sum, answer) => sum + answer.score, 0);
    return parseFloat((totalScore / selfAssessment.answers.length).toFixed(2));
  }

  /**
   * Calcula a média das avaliações de gestor de um colaborador
   * @param managerAssessments Lista de avaliações de gestor com respostas
   * @returns Média ou null se não houver dados
   */
  private calculateManagerAssessmentAverage(
    managerAssessments: Array<{
      answers: Array<{ score: number }>;
    }>,
  ): number | null {
    if (!managerAssessments || managerAssessments.length === 0) {
      return null;
    }

    let totalScore = 0;
    let totalAnswers = 0;

    managerAssessments.forEach((assessment) => {
      if (assessment.answers && assessment.answers.length > 0) {
        assessment.answers.forEach((answer) => {
          totalScore += answer.score;
          totalAnswers++;
        });
      }
    });

    if (totalAnswers === 0) {
      return null;
    }

    return parseFloat((totalScore / totalAnswers).toFixed(2));
  }

  /**
   * Método integrado para obter performance completa do colaborador
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação
   * @returns Performance completa incluindo métricas e médias por ciclo
   */
  async getCollaboratorCompletePerformance(
    collaboratorId: string,
    cycle: string,
  ): Promise<{
    performance: CollaboratorPerformanceDto;
    cycleMeans: CollaboratorCycleMeanDto[];
  }> {
    // Buscar em paralelo para melhor performance
    const [performance, cycleMeans] = await Promise.all([
      this.getCollaboratorPerformanceMetrics(collaboratorId, cycle),
      this.getCollaboratorCyclePerformances(collaboratorId),
    ]);

    return {
      performance,
      cycleMeans,
    };
  }

  /**
   * Busca a autoavaliação de um colaborador em um ciclo específico
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação
   * @returns Autoavaliação com respostas descriptografadas ou null se não encontrada
   */
  async getCollaboratorSelfAssessment(
    collaboratorId: string,
    cycle: string,
  ): Promise<{
    id: string;
    cycle: string;
    status: AssessmentStatus;
    createdAt: Date;
    updatedAt: Date;
    submittedAt: Date | null;
    answers: Array<{
      id: string;
      criterionId: string;
      score: number;
      justification: string;
    }>;
  } | null> {
    const selfAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: collaboratorId,
        cycle,
      },
      include: {
        answers: true,
      },
    });

    if (!selfAssessment) {
      return null;
    }

    // Descriptografar as justificativas
    const decryptedAnswers = selfAssessment.answers.map((answer) => ({
      ...answer,
      justification: this.encryptionService.decrypt(answer.justification),
    }));

    return {
      ...selfAssessment,
      answers: decryptedAnswers,
    };
  }

  /**
   * Busca avaliações de gestor recebidas por um colaborador em um ciclo específico
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação
   * @returns Lista de avaliações de gestor com informações dos autores
   */
  async getCollaboratorManagerAssessments(
    collaboratorId: string,
    cycle: string,
  ): Promise<
    Array<{
      id: string;
      cycle: string;
      status: AssessmentStatus;
      createdAt: Date;
      updatedAt: Date;
      submittedAt: Date | null;
      author: {
        id: string;
        name: string;
        email: string;
        jobTitle: string;
      };
      answers: Array<{
        id: string;
        criterionId: string;
        criterionName: string;
        pillar: CriterionPillar;
        score: number;
        justification: string;
      }>;
    }>
  > {
    const managerAssessments = await this.prisma.managerAssessment.findMany({
      where: {
        evaluatedUserId: collaboratorId,
        cycle,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        answers: true,
      },
    });

    // Buscar critérios para mapear informações
    const allCriterionIds = managerAssessments.flatMap((assessment) =>
      assessment.answers.map((answer) => answer.criterionId),
    );

    const criteriaMap = await this.prisma.criterion
      .findMany({
        where: {
          id: { in: allCriterionIds },
        },
      })
      .then((criteria) =>
        criteria.reduce(
          (map, criterion) => {
            map[criterion.id] = criterion;
            return map;
          },
          {} as Record<string, Criterion>,
        ),
      );

    // Mapear com informações dos critérios e descriptografar justificativas
    return managerAssessments.map((assessment) => {
      const decryptedAnswers = assessment.answers.map((answer) => {
        const criterion = criteriaMap[answer.criterionId];

        return {
          id: answer.id,
          criterionId: answer.criterionId,
          criterionName: criterion?.name || 'Critério não encontrado',
          pillar: criterion?.pillar || CriterionPillar.EXECUTION,
          score: answer.score,
          justification: this.encryptionService.decrypt(answer.justification),
        };
      });

      return {
        id: assessment.id,
        cycle: assessment.cycle,
        status: assessment.status,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
        submittedAt: assessment.submittedAt,
        author: assessment.author,
        answers: decryptedAnswers,
      };
    });
  }

  /**
   * Busca avaliações 360 recebidas por um colaborador em um ciclo específico
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação
   * @returns Lista de avaliações 360 com informações dos autores
   */
  async getCollaboratorFeedback360(
    collaboratorId: string,
    cycle: string,
  ): Promise<
    Array<{
      id: string;
      cycle: string;
      status: AssessmentStatus;
      createdAt: Date;
      updatedAt: Date;
      submittedAt: Date | null;
      overallScore: number;
      strengths: string;
      improvements: string;
      periodWorked: string | null;
      motivationToWorkAgain: any; // WorkAgainMotivation
      author: {
        id: string;
        name: string;
        email: string;
        jobTitle: string;
      };
    }>
  > {
    const feedback360 = await this.prisma.assessment360.findMany({
      where: {
        evaluatedUserId: collaboratorId,
        cycle,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });

    // Descriptografar os campos de feedback
    return feedback360.map((assessment) => ({
      id: assessment.id,
      cycle: assessment.cycle,
      status: assessment.status,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      submittedAt: assessment.submittedAt,
      overallScore: assessment.overallScore,
      strengths: this.encryptionService.decrypt(assessment.strengths),
      improvements: this.encryptionService.decrypt(assessment.improvements),
      periodWorked: assessment.periodWorked,
      motivationToWorkAgain: assessment.motivationToWorkAgain,
      author: assessment.author,
    }));
  }

  /**
   * Busca todas as avaliações de um colaborador em um ciclo específico
   * @param collaboratorId ID do colaborador
   * @param cycle Ciclo de avaliação
   * @returns Objeto com todos os tipos de avaliações
   */
  async getCollaboratorAllAssessments(
    collaboratorId: string,
    cycle: string,
  ): Promise<{
    selfAssessment: Awaited<ReturnType<typeof this.getCollaboratorSelfAssessment>>;
    managerAssessments: Awaited<ReturnType<typeof this.getCollaboratorManagerAssessments>>;
    feedback360: Awaited<ReturnType<typeof this.getCollaboratorFeedback360>>;
  }> {
    // Verificar se o colaborador existe
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId, isActive: true },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Buscar todas as avaliações em paralelo
    const [selfAssessment, managerAssessments, feedback360] = await Promise.all([
      this.getCollaboratorSelfAssessment(collaboratorId, cycle),
      this.getCollaboratorManagerAssessments(collaboratorId, cycle),
      this.getCollaboratorFeedback360(collaboratorId, cycle),
    ]);

    return {
      selfAssessment,
      managerAssessments,
      feedback360,
    };
  }
}
