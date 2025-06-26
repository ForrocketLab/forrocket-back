import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateSelfAssessmentDto,
  Create360AssessmentDto,
  CreateMentoringAssessmentDto,
  CreateReferenceFeedbackDto,
  CreateManagerAssessmentDto,
  SelfAssessmentCompletionByPillarDto,
  OverallCompletionDto,
  PillarProgressDto,
} from './assessments/dto';
import { User } from '../auth/entities/user.entity';
import { PrismaService } from '../database/prisma.service';
import {
  ALL_CRITERIA,
  getCriteriaByPillar,
  getAllPillars,
  isValidCriterionId,
} from '../models/criteria';
import { ProjectsService } from '../projects/projects.service';
import { CyclesService } from './cycles/cycles.service';
import {
  ISelfAssessment,
  ISelfAssessmentAnswer,
  EvaluationStatus,
  CollaboratorEvaluationType,
} from '../models/evaluations/collaborator';
import { ManagerDashboardResponseDto } from './manager/manager-dashboard.dto';
import { Received360AssessmentDto } from './manager/dto/received-assessment360.dto';
import {
  AnswerWithCriterion,
  AssessmentWithAnswers,
  PerformanceDataDto,
} from './assessments/dto/performance-data.dto';
import { CriterionPillar } from '@prisma/client';
import { PillarScores } from './assessments/dto/pillar-scores.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private cyclesService: CyclesService,
  ) {}

  /**
   * Submete uma avaliação (muda o status de DRAFT para SUBMITTED)
   * @param evaluationId O ID da avaliação a ser submetida
   * @param authorId O ID do autor da avaliação (para validação de segurança)
   */
  async submitAssessment(
    evaluationId: string,
    authorId: string,
    evaluationType: 'self' | '360' | 'mentoring' | 'reference' | 'manager' | 'committee',
  ) {
    let model: any;
    let updateWhere: any;

    // Determinar o modelo e a condição de busca com base no tipo de avaliação
    switch (evaluationType) {
      case 'self':
        model = this.prisma.selfAssessment;
        updateWhere = { id: evaluationId, authorId: authorId };
        break;
      case '360':
        model = this.prisma.assessment360;
        updateWhere = { id: evaluationId, authorId: authorId };
        break;
      case 'mentoring':
        model = this.prisma.mentoringAssessment;
        updateWhere = { id: evaluationId, authorId: authorId };
        break;
      case 'reference':
        model = this.prisma.referenceFeedback;
        updateWhere = { id: evaluationId, authorId: authorId };
        break;
      case 'manager':
        model = this.prisma.managerAssessment;
        updateWhere = { id: evaluationId, authorId: authorId };
        break;
      case 'committee': // <-- NOVO CASO ADICIONADO
        model = this.prisma.committeeAssessment;
        updateWhere = { id: evaluationId, authorId: authorId };
        break;
      default:
        throw new BadRequestException('Tipo de avaliação inválido.');
    }

    // Buscar a avaliação para verificar o status e a autoria
    const existingAssessment = await model.findUnique({
      where: updateWhere,
    });

    if (!existingAssessment) {
      throw new NotFoundException(
        `Avaliação com ID ${evaluationId} não encontrada ou você não é o autor.`,
      );
    }

    if (existingAssessment.status === EvaluationStatus.SUBMITTED) {
      // Usando o enum aqui
      throw new BadRequestException('Esta avaliação já foi submetida.');
    }

    // Atualizar o status para SUBMITTED e registrar a data de submissão
    const updatedAssessment = await model.update({
      where: { id: evaluationId },
      data: {
        status: EvaluationStatus.SUBMITTED, // Usando o enum aqui
        submittedAt: new Date(),
      },
    });

    return updatedAssessment;
  }

  /**
   * Cria uma autoavaliação com todos os 12 critérios para o ciclo ativo
   */
  async createSelfAssessment(userId: string, dto: Omit<CreateSelfAssessmentDto, 'cycle'>) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase('ASSESSMENTS');

    // Verificar se já existe uma autoavaliação para este ciclo
    const existingAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma autoavaliação para o ciclo ativo ${activeCycle.name}`,
      );
    }

    // Mapear os dados do DTO para o formato do banco
    const answers = [
      // Comportamento
      {
        criterionId: 'sentimento-de-dono',
        score: dto.sentimentoDeDonoScore,
        justification: dto.sentimentoDeDonoJustification,
      },
      {
        criterionId: 'resiliencia-adversidades',
        score: dto.resilienciaAdversidadesScore,
        justification: dto.resilienciaAdversidadesJustification,
      },
      {
        criterionId: 'organizacao-trabalho',
        score: dto.organizacaoTrabalhoScore,
        justification: dto.organizacaoTrabalhoJustification,
      },
      {
        criterionId: 'capacidade-aprender',
        score: dto.capacidadeAprenderScore,
        justification: dto.capacidadeAprenderJustification,
      },
      {
        criterionId: 'team-player',
        score: dto.teamPlayerScore,
        justification: dto.teamPlayerJustification,
      },

      // Execução
      {
        criterionId: 'entregar-qualidade',
        score: dto.entregarQualidadeScore,
        justification: dto.entregarQualidadeJustification,
      },
      {
        criterionId: 'atender-prazos',
        score: dto.atenderPrazosScore,
        justification: dto.atenderPrazosJustification,
      },
      {
        criterionId: 'fazer-mais-menos',
        score: dto.fazerMaisMenosScore,
        justification: dto.fazerMaisMenosJustification,
      },
      {
        criterionId: 'pensar-fora-caixa',
        score: dto.pensarForaCaixaScore,
        justification: dto.pensarForaCaixaJustification,
      },

      // Gestão e Liderança
      {
        criterionId: 'gestao-gente',
        score: dto.gestaoGenteScore,
        justification: dto.gestaoGenteJustification,
      },
      {
        criterionId: 'gestao-resultados',
        score: dto.gestaoResultadosScore,
        justification: dto.gestaoResultadosJustification,
      },
      {
        criterionId: 'evolucao-rocket',
        score: dto.evolucaoRocketScore,
        justification: dto.evolucaoRocketJustification,
      },
    ];

    // Criar a autoavaliação com todos os 12 critérios usando o ciclo ativo
    const selfAssessment = await this.prisma.selfAssessment.create({
      data: {
        authorId: userId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        answers: {
          create: answers,
        },
      },
      include: {
        answers: true,
      },
    });

    return selfAssessment;
  }

  /**
   * Cria uma avaliação 360 para o ciclo ativo
   */
  async create360Assessment(userId: string, dto: Omit<Create360AssessmentDto, 'cycle'>) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase('ASSESSMENTS');

    // Verificar se o usuário avaliado existe
    const evaluatedUser = await this.prisma.user.findUnique({
      where: { id: dto.evaluatedUserId },
    });

    if (!evaluatedUser) {
      throw new NotFoundException('Usuário avaliado não encontrado');
    }

    // Verificar se não está tentando avaliar a si mesmo
    if (userId === dto.evaluatedUserId) {
      throw new BadRequestException('Não é possível avaliar a si mesmo na avaliação 360');
    }

    // Verificar se o usuário pode avaliar o usuário alvo na avaliação 360 (colegas + gestores)
    const canEvaluate = await this.projectsService.canEvaluateUserIn360(
      userId,
      dto.evaluatedUserId,
    );
    if (!canEvaluate) {
      throw new ForbiddenException(
        'Você só pode avaliar colegas de trabalho (mesmo projeto) ou seu gestor direto na avaliação 360',
      );
    }

    // Verificar se já existe uma avaliação 360 para este usuário no ciclo ativo
    const existingAssessment = await this.prisma.assessment360.findFirst({
      where: {
        authorId: userId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma avaliação 360 para este usuário no ciclo ativo ${activeCycle.name}`,
      );
    }

    // Criar a avaliação 360 para o ciclo ativo
    const assessment360 = await this.prisma.assessment360.create({
      data: {
        authorId: userId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        evaluatedUserId: dto.evaluatedUserId,
        overallScore: dto.overallScore,
        strengths: dto.strengths,
        improvements: dto.improvements,
      },
    });

    return assessment360;
  }

  /**
   * Cria uma avaliação de mentoring para o ciclo ativo
   */
  async createMentoringAssessment(
    userId: string,
    dto: Omit<CreateMentoringAssessmentDto, 'cycle'>,
  ) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase('ASSESSMENTS');

    // Verificar se o mentor existe
    const mentor = await this.prisma.user.findUnique({
      where: { id: dto.mentorId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor não encontrado');
    }

    // Verificar se o usuário pode avaliar este mentor (só pode avaliar seu próprio mentor)
    const canEvaluateMentor = await this.projectsService.canEvaluateUserInMentoring(
      userId,
      dto.mentorId,
    );
    if (!canEvaluateMentor) {
      throw new ForbiddenException(
        'Você só pode avaliar seu mentor designado na avaliação de mentoring',
      );
    }

    // Verificar se já existe uma avaliação de mentoring para este mentor no ciclo ativo
    const existingAssessment = await this.prisma.mentoringAssessment.findFirst({
      where: {
        authorId: userId,
        mentorId: dto.mentorId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma avaliação de mentoring para este mentor no ciclo ativo ${activeCycle.name}`,
      );
    }

    // Criar a avaliação de mentoring para o ciclo ativo
    const mentoringAssessment = await this.prisma.mentoringAssessment.create({
      data: {
        authorId: userId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        mentorId: dto.mentorId,
        score: dto.score,
        justification: dto.justification,
      },
    });

    return mentoringAssessment;
  }

  /**
   * Cria um feedback de referência para o ciclo ativo
   */
  async createReferenceFeedback(userId: string, dto: Omit<CreateReferenceFeedbackDto, 'cycle'>) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase('ASSESSMENTS');

    // Verificar se o usuário referenciado existe
    const referencedUser = await this.prisma.user.findUnique({
      where: { id: dto.referencedUserId },
    });

    if (!referencedUser) {
      throw new NotFoundException('Usuário referenciado não encontrado');
    }

    // Verificar se não está tentando referenciar a si mesmo
    if (userId === dto.referencedUserId) {
      throw new BadRequestException('Não é possível referenciar a si mesmo');
    }

    // Verificar se já existe um feedback de referência para este usuário no ciclo ativo
    const existingFeedback = await this.prisma.referenceFeedback.findFirst({
      where: {
        authorId: userId,
        referencedUserId: dto.referencedUserId,
        cycle: activeCycle.name,
      },
    });

    if (existingFeedback) {
      throw new BadRequestException(
        `Já existe um feedback de referência para este usuário no ciclo ativo ${activeCycle.name}`,
      );
    }

    // Criar o feedback de referência para o ciclo ativo
    const referenceFeedback = await this.prisma.referenceFeedback.create({
      data: {
        authorId: userId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        referencedUserId: dto.referencedUserId,
        topic: dto.topic, // Campo opcional
        justification: dto.justification,
      },
    });

    return referenceFeedback;
  }

  /**
   * Cria uma avaliação de gestor para liderado no ciclo ativo
   */
  async createManagerAssessment(managerId: string, dto: Omit<CreateManagerAssessmentDto, 'cycle'>) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase('MANAGER_REVIEWS');

    // Verificar se o gestor tem permissão para fazer avaliações
    const isManager = await this.projectsService.isManager(managerId);
    if (!isManager) {
      throw new ForbiddenException('Apenas gestores podem criar avaliações de liderados');
    }

    // Verificar se o gestor pode avaliar o usuário específico
    const canEvaluate = await this.projectsService.canManagerEvaluateUser(
      managerId,
      dto.evaluatedUserId,
    );
    if (!canEvaluate) {
      throw new ForbiddenException(
        'Você só pode avaliar liderados dos projetos onde você é gestor',
      );
    }

    // Verificar se já existe uma avaliação para este liderado no ciclo ativo
    const existingAssessment = await this.prisma.managerAssessment.findFirst({
      where: {
        authorId: managerId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma avaliação para este liderado no ciclo ativo ${activeCycle.name}`,
      );
    }

    // Mapear os dados do DTO para o formato do banco (apenas critérios de comportamento)
    const answers = [
      // Comportamento
      {
        criterionId: 'sentimento-de-dono',
        score: dto.sentimentoDeDonoScore,
        justification: dto.sentimentoDeDonoJustification,
      },
      {
        criterionId: 'resiliencia-adversidades',
        score: dto.resilienciaAdversidadesScore,
        justification: dto.resilienciaAdversidadesJustification,
      },
      {
        criterionId: 'organizacao-trabalho',
        score: dto.organizacaoTrabalhoScore,
        justification: dto.organizacaoTrabalhoJustification,
      },
      {
        criterionId: 'capacidade-aprender',
        score: dto.capacidadeAprenderScore,
        justification: dto.capacidadeAprenderJustification,
      },
      {
        criterionId: 'team-player',
        score: dto.teamPlayerScore,
        justification: dto.teamPlayerJustification,
      },

      // Execução
      {
        criterionId: 'entregar-qualidade',
        score: dto.entregarComQualidadeScore,
        justification: dto.entregarComQualidadeJustification,
      },
      {
        criterionId: 'atender-prazos',
        score: dto.atenderPrazosScore,
        justification: dto.atenderPrazosJustification,
      },
      {
        criterionId: 'fazer-mais-menos',
        score: dto.fazerMaisMenosScore,
        justification: dto.fazerMaisMenosJustification,
      },
      {
        criterionId: 'pensar-fora-caixa',
        score: dto.pensarForaCaixaScore,
        justification: dto.pensarForaCaixaJustification,
      }
    ];

    // Criar a avaliação de gestor com os 5 critérios de comportamento para o ciclo ativo
    const managerAssessment = await this.prisma.managerAssessment.create({
      data: {
        authorId: managerId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        answers: {
          create: answers,
        },
      },
      include: {
        answers: true,
        evaluatedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            seniority: true,
          },
        },
      },
    });

    return managerAssessment;
  }

  /**
   * Calcula o status de preenchimento de uma autoavaliação por pilar.
   * Retorna um objeto com { completed: número de critérios completos, total: número total de critérios }
   * para cada pilar.
   */
  private calculateSelfAssessmentCompletionByPillar(
    selfAssessment: ISelfAssessment,
  ): SelfAssessmentCompletionByPillarDto {
    const pillarCompletion: SelfAssessmentCompletionByPillarDto =
      {} as SelfAssessmentCompletionByPillarDto;
    const allPillars = getAllPillars();

    // 1. Inicializa a contagem para cada pilar
    for (const pillar of allPillars) {
      const criteriaInPillar = getCriteriaByPillar(pillar);
      pillarCompletion[pillar] = {
        completed: 0,
        total: criteriaInPillar.length,
      };
    }

    if (!selfAssessment || !selfAssessment.answers) {
      return pillarCompletion;
    }

    // 2. Conta os critérios preenchidos por pilar
    for (const answer of selfAssessment.answers) {
      const criterion = ALL_CRITERIA.find((c) => c.id === answer.criterionId);

      if (criterion) {
        const isCompleted =
          answer.score >= 1 &&
          answer.score <= 5 &&
          answer.justification &&
          answer.justification.trim() !== '';

        if (isCompleted) {
          // Incrementa o contador 'completed' para o pilar do critério
          // Garante que o pilar exista antes de incrementar (já inicializamos acima)
          if (pillarCompletion[criterion.pillar]) {
            pillarCompletion[criterion.pillar].completed++;
          }
        }
      }
    }

    return pillarCompletion;
  }

  /**
   * Busca todas as avaliações RECEBIDAS por um usuário para um ciclo específico
   */
  async getReceivedEvaluationsByCycle(userId: string, cycle: string) {
    const [
      assessments360Received,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      managerAssessmentsReceived,
      committeeAssessmentsReceived,
    ] = await Promise.all([
      // Avaliações 360 recebidas (onde o usuário é o avaliado)
      this.prisma.assessment360.findMany({
        where: { evaluatedUserId: userId, cycle },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de mentoring recebidas (onde o usuário é o mentor)
      this.prisma.mentoringAssessment.findMany({
        where: { mentorId: userId, cycle },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Feedbacks de referência recebidos (onde o usuário é o referenciado)
      this.prisma.referenceFeedback.findMany({
        where: { referencedUserId: userId, cycle },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de gestor recebidas (onde o usuário é o avaliado)
      this.prisma.managerAssessment.findMany({
        where: { evaluatedUserId: userId, cycle },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
          },
          answers: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de comitê recebidas (onde o usuário é o avaliado)
      this.prisma.committeeAssessment.findMany({
        where: { evaluatedUserId: userId, cycle },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      cycle,
      assessments360Received,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      managerAssessmentsReceived,
      committeeAssessmentsReceived,
      summary: {
        assessments360ReceivedCount: assessments360Received.length,
        mentoringAssessmentsReceivedCount: mentoringAssessmentsReceived.length,
        referenceFeedbacksReceivedCount: referenceFeedbacksReceived.length,
        managerAssessmentsReceivedCount: managerAssessmentsReceived.length,
        committeeAssessmentsReceivedCount: committeeAssessmentsReceived.length,
        totalReceivedCount:
          assessments360Received.length +
          mentoringAssessmentsReceived.length +
          referenceFeedbacksReceived.length +
          managerAssessmentsReceived.length +
          committeeAssessmentsReceived.length,
      },
    };
  }

  /**
   * Busca todas as avaliações de um usuário para um ciclo específico
   * Incluirá o status de preenchimento por pilar para autoavaliação
   */
  async getUserEvaluationsByCycle(userId: string, cycle: string) {
    const [
      selfAssessmentFromDb,
      assessments360,
      mentoringAssessments,
      referenceFeedbacks,
      managerAssessments,
    ] = await Promise.all([
      // Autoavaliação
      this.prisma.selfAssessment.findFirst({
        where: { authorId: userId, cycle },
        include: { answers: true },
      }),

      // Avaliações 360
      this.prisma.assessment360.findMany({
        where: { authorId: userId, cycle },
        include: {
          evaluatedUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Avaliações de mentoring
      this.prisma.mentoringAssessment.findMany({
        where: { authorId: userId, cycle },
        include: {
          mentor: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Feedbacks de referência
      this.prisma.referenceFeedback.findMany({
        where: { authorId: userId, cycle },
        include: {
          referencedUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Avaliações de gestor feitas pelo usuário
      this.prisma.managerAssessment.findMany({
        where: { authorId: userId, cycle },
        include: {
          evaluatedUser: {
            select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
          },
          answers: true,
        },
      }),
    ]);

    // **IMPORTANTE**: Converter o objeto retornado pelo Prisma para o tipo ISelfAssessment
    // A asserção `as EvaluationStatus` corrige o problema de tipagem do 'status'.
    let selfAssessment: ISelfAssessment | null = null;
    if (selfAssessmentFromDb) {
      selfAssessment = {
        ...selfAssessmentFromDb,
        status: selfAssessmentFromDb.status as EvaluationStatus,
        createdAt: new Date(selfAssessmentFromDb.createdAt),
        updatedAt: new Date(selfAssessmentFromDb.updatedAt),
        submittedAt: selfAssessmentFromDb.submittedAt
          ? new Date(selfAssessmentFromDb.submittedAt)
          : undefined,
      } as ISelfAssessment;
    }

    // Calcular o status de preenchimento por pilar para a autoavaliação
    let selfAssessmentCompletionByPillar: SelfAssessmentCompletionByPillarDto =
      {} as SelfAssessmentCompletionByPillarDto; // <-- Use o DTO aqui
    if (selfAssessment) {
      selfAssessmentCompletionByPillar =
        this.calculateSelfAssessmentCompletionByPillar(selfAssessment);
    }

    // Calcular o progresso geral da autoavaliação (soma dos pilares)
    const totalCompleted = Object.values(selfAssessmentCompletionByPillar).reduce(
      (acc, p) => acc + p.completed,
      0,
    );
    const totalOverall = ALL_CRITERIA.length;

    return {
      cycle,
      selfAssessment: selfAssessment
        ? {
            ...selfAssessment,
            completionStatus: selfAssessmentCompletionByPillar,
            overallCompletion: {
              // Progresso geral (X/12)
              completed: totalCompleted,
              total: totalOverall,
            },
          }
        : null,
      assessments360,
      mentoringAssessments,
      referenceFeedbacks,
      managerAssessments,
      summary: {
        selfAssessmentCompleted:
          !!selfAssessment && selfAssessment.status === EvaluationStatus.SUBMITTED, // Usando o enum aqui
        selfAssessmentOverallProgress: {
          // No summary, a visão geral (X/12)
          completed: totalCompleted,
          total: totalOverall,
        },
        assessments360Count: assessments360.length,
        mentoringAssessmentsCount: mentoringAssessments.length,
        referenceFeedbacksCount: referenceFeedbacks.length,
        managerAssessmentsCount: managerAssessments.length,
      },
    };
  }

  private async calculateManagerOverallScore(
    managerId: string,
    cycle: string,
  ): Promise<number | null> {
    const assessments = await this.prisma.assessment360.findMany({
      where: { evaluatedUserId: managerId, cycle, status: EvaluationStatus.SUBMITTED }, // Usando o enum aqui
      select: { overallScore: true },
    });

    if (assessments.length === 0) return null;

    const totalScore = assessments.reduce((sum, assessment) => sum + assessment.overallScore, 0);
    return parseFloat((totalScore / assessments.length).toFixed(1));
  }

  private async calculateTeamCompletionPercentage(
    subordinateIds: string[],
    cycle: string,
  ): Promise<number> {
    if (subordinateIds.length === 0) return 100;

    // Para simplificar, consideramos "concluído" quando a autoavaliação é submetida.
    const completedCount = await this.prisma.selfAssessment.count({
      where: { authorId: { in: subordinateIds }, cycle, status: EvaluationStatus.SUBMITTED }, // Usando o enum aqui
    });

    const percentage = (completedCount / subordinateIds.length) * 100;
    return Math.round(percentage);
  }

  private async calculateManagerIncompleteReviews(
    managerId: string,
    subordinateIds: string[],
    cycle: string,
  ): Promise<number> {
    const totalSubordinates = subordinateIds.length;

    const completedCount = await this.prisma.managerAssessment.count({
      where: {
        authorId: managerId,
        evaluatedUserId: { in: subordinateIds },
        cycle,
        status: EvaluationStatus.SUBMITTED, // Usando o enum aqui
      },
    });

    return totalSubordinates - completedCount;
  }

  private async getFormattedCollaboratorsInfo(
    projectsWithSubordinates: any[],
    managerId: string,
    cycle: string,
  ): Promise<any[]> {
    const allSubordinateIds = projectsWithSubordinates.flatMap((p) =>
      p.subordinates.map((s) => s.id),
    );

    const subordinatesProgress = await this.prisma.user.findMany({
      where: { id: { in: allSubordinateIds } },
      select: {
        id: true,
        name: true,
        selfAssessments: {
          where: { cycle },
          select: { status: true, answers: { select: { score: true } } },
        },
        managerAssessmentsReceived: {
          where: { authorId: managerId, cycle },
          select: { status: true, answers: { select: { score: true } } },
        },
      },
    });

    const progressMap = new Map(
      subordinatesProgress.map((p) => {
        const calculateAverageScore = (answers: { score: number }[]) => {
          if (!answers || answers.length === 0) return null;
          const total = answers.reduce((sum, ans) => sum + ans.score, 0);
          return parseFloat((total / answers.length).toFixed(1));
        };

        const selfAssessment = p.selfAssessments[0];
        let status: 'PENDING' | 'DRAFT' | 'SUBMITTED' = 'PENDING';
        if (selfAssessment?.status === EvaluationStatus.SUBMITTED)
          status = EvaluationStatus.SUBMITTED; // Usando o enum aqui
        else if (selfAssessment?.status === EvaluationStatus.DRAFT) status = EvaluationStatus.DRAFT; // Usando o enum aqui

        return [
          p.id,
          {
            initials: p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            status: status,
            selfAssessmentScore: calculateAverageScore(selfAssessment?.answers),
            managerScore: calculateAverageScore(p.managerAssessmentsReceived[0]?.answers),
          },
        ];
      }),
    );

    return projectsWithSubordinates.map((project) => ({
      ...project,
      subordinates: project.subordinates.map((subordinate) => ({
        id: subordinate.id,
        name: subordinate.name,
        jobTitle: subordinate.jobTitle,
        ...(progressMap.get(subordinate.id) || {
          initials: '',
          status: 'Pendente',
          selfAssessmentScore: null,
          managerScore: null,
        }),
      })),
    }));
  }

  async getManagerDashboard(
    managerId: string,
    cycle: string,
  ): Promise<ManagerDashboardResponseDto> {
    // Busca a estrutura de projetos e a lista de todos os liderados.
    const projectsWithSubordinates = await this.projectsService.getEvaluableSubordinates(managerId);

    // Se não há liderados, retorna uma resposta padrão.
    if (projectsWithSubordinates.length === 0) {
      return {
        summary: { overallScore: null, completionPercentage: 100, incompleteReviews: 0 },
        collaboratorsInfo: [],
      };
    }

    const allSubordinateIds = projectsWithSubordinates.flatMap((p) =>
      p.subordinates.map((s) => s.id),
    );

    // Executa todos os cálculos de resumo em paralelo para melhor performance.
    const [overallScore, completionPercentage, incompleteReviews] = await Promise.all([
      this.calculateManagerOverallScore(managerId, cycle),
      this.calculateTeamCompletionPercentage(allSubordinateIds, cycle),
      this.calculateManagerIncompleteReviews(managerId, allSubordinateIds, cycle),
    ]);

    // Busca e formata os dados detalhados para a tabela de colaboradores.
    const collaboratorsInfo = await this.getFormattedCollaboratorsInfo(
      projectsWithSubordinates,
      managerId,
      cycle,
    );

    return {
      summary: {
        overallScore,
        completionPercentage,
        incompleteReviews,
      },
      collaboratorsInfo,
    };
  }

  // NOVA FUNÇÃO: Obter autoavaliação de subordinado para gestor
  async getSubordinateSelfAssessment(
    managerId: string,
    subordinateId: string,
  ): Promise<ISelfAssessment> {
    // 1. Validar a fase do ciclo ativo (deve ser MANAGER_REVIEWS ou EQUALIZATION)
    const activeCycle = await this.cyclesService.validateActiveCyclePhase('MANAGER_REVIEWS'); // Ou 'EQUALIZATION'

    // 2. Verificar se o subordinateId existe e está ativo
    const subordinate = await this.prisma.user.findUnique({
      where: { id: subordinateId, isActive: true },
      select: { id: true, name: true, email: true, managerId: true }, // Incluir managerId do subordinado
    });

    if (!subordinate) {
      throw new NotFoundException('Subordinado não encontrado.');
    }

    // 3. Validar se o gestor logado é realmente o gestor direto do subordinado
    if (subordinate.managerId !== managerId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar a autoavaliação deste usuário. Ele não é seu subordinado direto.',
      );
    }

    // 4. Buscar a autoavaliação do subordinado para o ciclo ativo
    const selfAssessmentFromDb = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: subordinateId,
        cycle: activeCycle.name,
        status: EvaluationStatus.SUBMITTED, // Apenas autoavaliações submetidas devem ser visíveis para o gestor
      },
      include: {
        answers: true, // Inclui as respostas detalhadas
      },
    });

    if (!selfAssessmentFromDb) {
      throw new NotFoundException(
        `Autoavaliação do subordinado ${subordinate.name} para o ciclo ${activeCycle.name} não encontrada ou não submetida.`,
      );
    }

    // 5. Mapear e retornar a autoavaliação para o tipo ISelfAssessment
    const selfAssessment: ISelfAssessment = {
      ...selfAssessmentFromDb,
      status: selfAssessmentFromDb.status as EvaluationStatus,
      createdAt: new Date(selfAssessmentFromDb.createdAt),
      updatedAt: new Date(selfAssessmentFromDb.updatedAt),
      submittedAt: selfAssessmentFromDb.submittedAt
        ? new Date(selfAssessmentFromDb.submittedAt)
        : undefined,
    } as ISelfAssessment;

    // Adicionar o progresso de preenchimento (já que já temos a função)
    const completionStatus = this.calculateSelfAssessmentCompletionByPillar(selfAssessment);
    const totalCompleted = Object.values(completionStatus).reduce((acc, p) => acc + p.completed, 0);
    const totalOverall = ALL_CRITERIA.length;

    return {
      ...selfAssessment,
      completionStatus,
      overallCompletion: {
        completed: totalCompleted,
        total: totalOverall,
      },
    };
  }

  async getSubordinateReceived360s(
    managerId: string,
    subordinateId: string,
    cycle: string,
  ): Promise<Received360AssessmentDto[]> {
    // valida se o gestor pode ver os dados deste subordinado
    const subordinate = await this.prisma.user.findUnique({
      where: { id: subordinateId, isActive: true },
    });
    if (!subordinate) {
      throw new NotFoundException('Subordinado não encontrado.');
    }
    if (subordinate.managerId !== managerId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar os dados deste usuário.',
      );
    }

    // busca no banco todas as avaliações 360 que o subordinado RECEBEU
    const receivedAssessments = await this.prisma.assessment360.findMany({
      where: {
        evaluatedUserId: subordinateId,
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

    // map dos dados do banco para o DTO
    const formattedAssessments = receivedAssessments.map((assessment) => ({
      evaluatorName: assessment.author.name,
      evaluatorJobTitle: assessment.author.jobTitle,
      rating: assessment.overallScore,
      strengths: assessment.strengths,
      weaknesses: assessment.improvements,
    }));

    return formattedAssessments;
  }

  // Histórico de notas por ciclos, pilares (BEHAVIOR, EXECUTION e MANAGEMENT) e inclui a nota final do comitê.
  async getPerformanceHistory(userId: string): Promise<PerformanceDataDto[]> {
    const [criteria, selfAssessments, managerAssessments, committeeAssessments] = await Promise.all(
      [
        this.prisma.criterion.findMany(),
        this.prisma.selfAssessment.findMany({
          where: { authorId: userId, status: 'SUBMITTED' }, // Considerar apenas avaliações enviadas
          include: { answers: true },
        }),
        this.prisma.managerAssessment.findMany({
          where: { evaluatedUserId: userId, status: 'SUBMITTED' }, // Considerar apenas avaliações recebidas
          include: { answers: true },
        }),
        this.prisma.committeeAssessment.findMany({
          where: { evaluatedUserId: userId, status: 'SUBMITTED' }, // Considerar apenas avaliações recebidas
        }),
      ],
    );

    // Mapeia critérioId para seu pilar
    const criteriaPillarMap = new Map<string, CriterionPillar>(
      criteria.map((c) => [c.id, c.pillar as CriterionPillar]),
    );

    const selfScoresByCycle = this.calculatePillarScores(selfAssessments, criteriaPillarMap);
    const managerScoresByCycle = this.calculatePillarScores(managerAssessments, criteriaPillarMap);

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

    return performanceData;
  }

  // Função auxiliar para calcular as médias de notas por pilar para um conjunto de avaliações.
  private calculatePillarScores(
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
}
