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
} from './assessments/dto';
import { User } from '../auth/entities/user.entity';
import { PrismaService } from '../database/prisma.service';
import { isValidCriterionId } from '../models/criteria';
import { ProjectsService } from '../projects/projects.service';
import { CyclesService } from './cycles/cycles.service';
import { CollaboratorEvaluationType } from '../models/evaluations/collaborator';

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
    evaluationType: 'self' | '360' | 'mentoring' | 'reference',
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

    if (existingAssessment.status === 'SUBMITTED') {
      throw new BadRequestException('Esta avaliação já foi submetida.');
    }

    // Atualizar o status para SUBMITTED e registrar a data de submissão
    const updatedAssessment = await model.update({
      where: { id: evaluationId },
      data: {
        status: 'SUBMITTED',
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
        status: 'DRAFT',
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
        status: 'DRAFT',
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
        status: 'DRAFT',
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
        status: 'DRAFT',
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
    ];

    // Criar a avaliação de gestor com os 5 critérios de comportamento para o ciclo ativo
    const managerAssessment = await this.prisma.managerAssessment.create({
      data: {
        authorId: managerId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
        status: 'DRAFT',
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
   * Busca todas as avaliações RECEBIDAS por um usuário para um ciclo específico
   */
  async getReceivedEvaluationsByCycle(userId: string, cycle: string) {
    const [assessments360Received, mentoringAssessmentsReceived, referenceFeedbacksReceived] =
      await Promise.all([
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
      ]);

    return {
      cycle,
      assessments360Received,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      summary: {
        assessments360ReceivedCount: assessments360Received.length,
        mentoringAssessmentsReceivedCount: mentoringAssessmentsReceived.length,
        referenceFeedbacksReceivedCount: referenceFeedbacksReceived.length,
        totalReceivedCount:
          assessments360Received.length +
          mentoringAssessmentsReceived.length +
          referenceFeedbacksReceived.length,
      },
    };
  }

  /**
   * Busca todas as avaliações de um usuário para um ciclo específico
   */
  async getUserEvaluationsByCycle(userId: string, cycle: string) {
    const [selfAssessment, assessments360, mentoringAssessments, referenceFeedbacks] =
      await Promise.all([
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
      ]);

    return {
      cycle,
      selfAssessment,
      assessments360,
      mentoringAssessments,
      referenceFeedbacks,
      summary: {
        selfAssessmentCompleted: !!selfAssessment,
        assessments360Count: assessments360.length,
        mentoringAssessmentsCount: mentoringAssessments.length,
        referenceFeedbacksCount: referenceFeedbacks.length,
      },
    };
  }
}
