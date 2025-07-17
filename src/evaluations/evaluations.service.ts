import * as fs from 'fs';
import * as path from 'path';

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CriterionPillar, ManagerTeamSummary, WorkAgainMotivation } from '@prisma/client';

import { EncryptionService } from '../common/services/encryption.service';
import { GenAiService } from '../gen-ai/gen-ai.service';
import {
  CreateSelfAssessmentDto,
  UpdateSelfAssessmentDto,
  CreateMentoringAssessmentDto,
  CreateReferenceFeedbackDto,
  CreateManagerAssessmentDto,
  SelfAssessmentCompletionByPillarDto,
  PillarProgressDto,
  UpdateMentoringAssessmentDto,
  Create360AssessmentDto,
  Update360AssessmentDto,
  UpdateDesignatedMentorAssessmentDto,
} from './assessments/dto';
import { PrismaService } from '../database/prisma.service';
import { ALL_CRITERIA, getCriteriaByPillar, getAllPillars } from '../models/criteria';
import { ProjectsService } from '../projects/projects.service';
import {
  AnswerWithCriterion,
  AssessmentWithAnswers,
  PerformanceDataDto,
} from './assessments/dto/performance-data.dto';
import { PerformanceHistoryDto } from './assessments/dto/performance-history-dto';
import { PillarScores } from './assessments/dto/pillar-scores.dto';
import { CyclesService } from './cycles/cycles.service';
import { BrutalFactsMetricsDto } from './manager/dto/brutal-facts-metrics.dto';
import { MenteeInfoDto } from './dto/mentee-info.dto';
import { Received360AssessmentDto } from './manager/dto/received-assessment360.dto';
import {
  TeamHistoricalPerformanceResponseDto,
  TeamPerformanceByCycleDto,
} from './manager/dto/team-historical-performance.dto';
import { ManagerDashboardResponseDto } from './manager/manager-dashboard.dto';
import {
  TeamCollaboratorData,
  TeamEvaluationSummaryData,
  TeamScoreAnalysisData,
  CollaboratorScoreData,
} from '../gen-ai/dto/team-evaluation.dto';
import { ISelfAssessment, EvaluationStatus } from '../models/evaluations/collaborator';

@Injectable()
export class EvaluationsService {
  private readonly projectLogger = new Logger('ProjectEvaluations');
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private cyclesService: CyclesService,
    private genAiService: GenAiService,
    private encryptionService: EncryptionService,
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
   * Cria uma autoavaliação com todos os critérios necessários
   */
  async createSelfAssessment(userId: string, dto: CreateSelfAssessmentDto) {
    // Validar se o ciclo fornecido existe e está na fase correta
    await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

    // Verificar se o usuário tem papel de gestor para validar critérios obrigatórios
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: true,
      },
    });

    if (!userWithRoles) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isManager = userWithRoles.roleAssignments.some(
      (assignment) => assignment.role === 'MANAGER',
    );

    // Verificar se já existe uma autoavaliação para este ciclo
    const existingAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: dto.cycleId,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(`Já existe uma autoavaliação para o ciclo ${dto.cycleId}`);
    }

    // Validar critérios obrigatórios baseado no papel do usuário
    const requiredCriteria = [
      'sentimento-de-dono',
      'resiliencia-adversidades',
      'organizacao-trabalho',
      'capacidade-aprender',
      'team-player',
      'entregar-qualidade',
      'atender-prazos',
      'fazer-mais-menos',
      'pensar-fora-caixa',
    ];

    if (isManager) {
      requiredCriteria.push('gestao-gente', 'gestao-resultados', 'evolucao-rocket-corp');
    }

    // Verificar se todos os critérios obrigatórios foram fornecidos
    const missingCriteria = requiredCriteria.filter((criterionId) => {
      const criterionData = dto[criterionId as keyof CreateSelfAssessmentDto];
      return (
        !criterionData ||
        typeof criterionData === 'string' ||
        !criterionData.score ||
        !criterionData.justification
      );
    });

    if (missingCriteria.length > 0) {
      throw new BadRequestException(
        `Critérios obrigatórios ausentes ou incompletos: ${missingCriteria.join(', ')}`,
      );
    }

    // Se não é gestor, verificar se não foram enviados critérios de gestão
    if (!isManager) {
      if (dto['gestao-gente'] || dto['gestao-resultados']) {
        throw new BadRequestException(
          'Apenas gestores podem avaliar critérios de gestão e liderança',
        );
      }
    }

    // Mapear os dados do DTO para o formato do banco
    const answers = requiredCriteria.map((criterionId) => {
      const criterionData = dto[criterionId as keyof CreateSelfAssessmentDto];
      if (typeof criterionData === 'string' || !criterionData) {
        throw new BadRequestException(`Dados inválidos para critério ${criterionId}`);
      }
      return {
        criterionId,
        score: criterionData.score,
        justification: this.encryptionService.encrypt(criterionData.justification),
      };
    });

    // Criar a autoavaliação
    const selfAssessment = await this.prisma.selfAssessment.create({
      data: {
        authorId: userId,
        cycle: dto.cycleId,
        status: EvaluationStatus.DRAFT,
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
   * Atualiza incrementalmente uma autoavaliação existente ou cria uma nova se não existir
   */
  async updateSelfAssessment(userId: string, dto: UpdateSelfAssessmentDto) {
    console.log('🔍 DEBUG - updateSelfAssessment iniciado');
    console.log('🔍 DEBUG - DTO recebido:', JSON.stringify(dto, null, 2));
    console.log('🔍 DEBUG - userId:', userId);

    // Determinar o ciclo a ser usado
    const cycleToUse =
      dto.cycleId || (await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS'])).name;

    console.log('🔍 DEBUG - cycleToUse:', cycleToUse);

    // Verificar se o usuário tem papel de gestor para validar critérios
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: true,
      },
    });

    if (!userWithRoles) {
      throw new NotFoundException('Usuário não encontrado');
    }

    console.log('🔍 DEBUG - userWithRoles:', {
      id: userWithRoles.id,
      businessUnit: userWithRoles.businessUnit,
      roleAssignments: userWithRoles.roleAssignments,
    });

    const isManager = userWithRoles.roleAssignments.some(
      (assignment) => assignment.role === 'MANAGER',
    );

    console.log('🔍 DEBUG - isManager:', isManager);

    // Buscar autoavaliação existente
    let existingAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: cycleToUse,
      },
      include: {
        answers: true,
      },
    });

    // Se não existir autoavaliação, criar uma nova em branco
    if (!existingAssessment) {
      // Buscar critérios dinamicamente do banco de dados
      const criteriaQuery = await this.prisma.criterion.findMany({
        where: {
          OR: [
            // Critérios base (aplicam para todos)
            { isBase: true },
            // Critérios específicos da businessUnit do usuário
            { businessUnit: userWithRoles.businessUnit },
          ],
        },
        select: {
          id: true,
          pillar: true,
        },
      });

      // Filtrar critérios baseado no papel do usuário
      const applicableCriteria = criteriaQuery.filter((criterion) => {
        // Critérios de gestão apenas para gestores
        if (criterion.pillar === 'MANAGEMENT') {
          return isManager;
        }
        // Todos os outros critérios são aplicáveis
        return true;
      });

      const emptyCriteriaData = applicableCriteria.map((criterion) => ({
        criterionId: criterion.id,
        score: 0,
        justification: '',
      }));

      existingAssessment = await this.prisma.selfAssessment.create({
        data: {
          authorId: userId,
          cycle: cycleToUse,
          status: EvaluationStatus.DRAFT,
          answers: {
            create: emptyCriteriaData,
          },
        },
        include: {
          answers: true,
        },
      });
    }

    // Validar se critérios de gestão estão sendo enviados apenas por gestores
    if (!isManager) {
      if (dto['gestao-gente'] || dto['gestao-resultados']) {
        throw new BadRequestException(
          'Apenas gestores podem avaliar critérios de gestão e liderança',
        );
      }
    }

    // Buscar critérios válidos dinamicamente do banco para validação
    const validCriteria = await this.prisma.criterion.findMany({
      where: {
        OR: [
          // Critérios base (aplicam para todos)
          { isBase: true },
          // Critérios específicos da businessUnit do usuário
          { businessUnit: userWithRoles.businessUnit },
        ],
      },
      select: {
        id: true,
        pillar: true,
        businessUnit: true,
        isBase: true,
      },
    });

    console.log('🔍 DEBUG - validCriteria encontrados:', validCriteria);

    // Filtrar critérios válidos baseado no papel do usuário
    const applicableCriteriaIds = validCriteria
      .filter((criterion) => {
        // Critérios de gestão apenas para gestores
        if (criterion.pillar === 'MANAGEMENT') {
          return isManager;
        }
        // Todos os outros critérios são aplicáveis
        return true;
      })
      .map((criterion) => criterion.id);

    console.log('🔍 DEBUG - applicableCriteriaIds:', applicableCriteriaIds);

    // Atualizar apenas os campos fornecidos
    const updates: any[] = [];
    console.log('🔍 DEBUG - Iniciando loop para processar critérios do DTO');

    for (const [criterionId, criterionData] of Object.entries(dto)) {
      console.log('🔍 DEBUG - Processando critério:', criterionId, criterionData);

      if (criterionId === 'cycleId' || !criterionData) {
        console.log('🔍 DEBUG - Critério ignorado (cycleId ou dados vazios):', criterionId);
        continue;
      }

      // Verificar se o critério é válido para este usuário
      if (!applicableCriteriaIds.includes(criterionId)) {
        console.log('🔍 DEBUG - Critério NÃO válido para este usuário:', criterionId);
        console.log('🔍 DEBUG - Critérios aplicáveis:', applicableCriteriaIds);
        throw new BadRequestException(
          `Critério '${criterionId}' não é válido para este usuário ou não existe`,
        );
      }

      console.log('🔍 DEBUG - Critério VÁLIDO:', criterionId);

      // Type assertion para o criterionData
      const data = criterionData as { score: number; justification: string };
      console.log('🔍 DEBUG - Dados do critério:', data);

      // Encontrar a resposta existente para este critério
      const existingAnswer = existingAssessment.answers.find((a) => a.criterionId === criterionId);
      console.log('🔍 DEBUG - Resposta existente encontrada:', !!existingAnswer);

      if (existingAnswer) {
        console.log('🔍 DEBUG - Atualizando resposta existente para:', criterionId);
        // Atualizar resposta existente
        updates.push(
          this.prisma.selfAssessmentAnswer.update({
            where: { id: existingAnswer.id },
            data: {
              score: data.score,
              justification: this.encryptionService.encrypt(data.justification),
            },
          }),
        );
      } else {
        console.log('🔍 DEBUG - Criando nova resposta para:', criterionId);
        // Criar nova resposta
        updates.push(
          this.prisma.selfAssessmentAnswer.create({
            data: {
              criterionId,
              score: data.score,
              justification: this.encryptionService.encrypt(data.justification),
              selfAssessmentId: existingAssessment.id,
            },
          }),
        );
      }
    }

    console.log('🔍 DEBUG - Total de updates preparados:', updates.length);

    // Executar todas as atualizações em uma transação
    if (updates.length > 0) {
      console.log('🔍 DEBUG - Executando transação com', updates.length, 'operações');
      await this.prisma.$transaction(updates);
      console.log('🔍 DEBUG - Transação executada com sucesso');
    } else {
      console.log('🔍 DEBUG - Nenhuma atualização para executar');
    }

    console.log('🔍 DEBUG - Retornando autoavaliação atualizada');
    // Retornar autoavaliação atualizada
    return this.prisma.selfAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: cycleToUse,
      },
      include: {
        answers: true,
      },
    });
  }

  /**
   * Cria uma avaliação de mentoring para o ciclo ativo
   */
  async createMentoringAssessment(
    userId: string,
    dto: Omit<CreateMentoringAssessmentDto, 'cycle'>,
  ) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

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

    // Criar a avaliação de mentoring para o ciclo ativo (com criptografia)
    const mentoringAssessment = await this.prisma.mentoringAssessment.create({
      data: {
        authorId: userId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        mentorId: dto.mentorId,
        score: dto.score,
        justification: this.encryptionService.encrypt(dto.justification),
      },
    });

    return mentoringAssessment;
  }

  /**
   * Cria um feedback de referência para o ciclo ativo
   */
  async createReferenceFeedback(userId: string, dto: Omit<CreateReferenceFeedbackDto, 'cycle'>) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

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

    // Criar o feedback de referência para o ciclo ativo (com criptografia)
    const referenceFeedback = await this.prisma.referenceFeedback.create({
      data: {
        authorId: userId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT, // Usando o enum aqui
        referencedUserId: dto.referencedUserId,
        topic: this.encryptionService.encrypt(dto.topic || ''), // Campo opcional
        justification: this.encryptionService.encrypt(dto.justification),
      },
    });

    return referenceFeedback;
  }

  /**
   * Cria uma avaliação de gestor para liderado no ciclo ativo
   */
  async createManagerAssessment(managerId: string, dto: Omit<CreateManagerAssessmentDto, 'cycle'>) {
    // Validar se existe um ciclo ativo na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['MANAGER_REVIEWS']);

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
      },
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
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              seniority: true,
              roles: true,
            },
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
      (acc, p: PillarProgressDto) => acc + p.completed,
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
      assessments360: assessments360.map((assessment) => ({
        ...assessment,
        evaluatedUserId: assessment.evaluatedUserId,
        evaluatedUserName: assessment.evaluatedUser.name,
        evaluatedUserEmail: assessment.evaluatedUser.email,
        evaluatedUserJobTitle: assessment.evaluatedUser.jobTitle,
        evaluatedUserSeniority: assessment.evaluatedUser.seniority,
        evaluatedUserRoles: JSON.parse(assessment.evaluatedUser.roles || '[]'),
      })),
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
        if (selfAssessment?.status === 'SUBMITTED')
          status = EvaluationStatus.SUBMITTED; // Usando o enum aqui
        else if (selfAssessment?.status === 'DRAFT') status = EvaluationStatus.DRAFT; // Usando o enum aqui

        return [
          p.id,
          {
            initials: p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            assessmentStatus: status,
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
          assessmentStatus: 'PENDING',
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
    const activeCycle = await this.cyclesService.validateActiveCyclePhase([
      'ASSESSMENTS',
      'MANAGER_REVIEWS',
      'EQUALIZATION',
    ]);

    // 2. Verificar se o subordinateId existe e está ativo
    const subordinate = await this.prisma.user.findUnique({
      where: { id: subordinateId, isActive: true },
    });

    if (!subordinate) {
      throw new NotFoundException('Subordinado não encontrado.');
    }

    // 3. Validar se o gestor logado tem permissão para visualizar o subordinado
    // Verificar se é gestor direto OU gestor de projeto
    const isDirectManager = subordinate.managerId === managerId;
    
    // Verificar se é gestor de projeto
    const isProjectManager = await this.projectsService.canManagerEvaluateUser(managerId, subordinateId);
    
    if (!isDirectManager && !isProjectManager) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar a autoavaliação deste usuário. Ele não é seu subordinado direto nem está em projetos onde você é gestor.',
      );
    }

    // 4. Buscar a autoavaliação do subordinado para o ciclo ativo (mesmo se não submetida)
    const selfAssessmentFromDb = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: subordinateId,
        cycle: activeCycle.name,
      },
      include: {
        answers: true, // Inclui as respostas detalhadas
      },
    });

    // Se não existe autoavaliação, criar uma estrutura vazia para mostrar o formato
    if (!selfAssessmentFromDb) {
      // Buscar critérios dinamicamente do banco de dados
      const criteriaQuery = await this.prisma.criterion.findMany({
        where: {
          OR: [
            // Critérios base (aplicam para todos)
            { isBase: true },
            // Critérios específicos da businessUnit do subordinado
            { businessUnit: subordinate.businessUnit },
          ],
        },
        select: {
          id: true,
          pillar: true,
        },
      });

      // Verificar se o subordinado tem papel de gestor para incluir critérios de gestão
      const subordinateWithRoles = await this.prisma.user.findUnique({
        where: { id: subordinateId },
        include: {
          roleAssignments: true,
        },
      });

      const isSubordinateManager = subordinateWithRoles?.roleAssignments.some(
        (assignment) => assignment.role === 'MANAGER',
      );

      // Filtrar critérios baseado no papel do subordinado
      const applicableCriteria = criteriaQuery.filter((criterion) => {
        // Critérios de gestão apenas para gestores
        if (criterion.pillar === 'MANAGEMENT') {
          return isSubordinateManager;
        }
        // Todos os outros critérios são aplicáveis
        return true;
      });

      // Criar respostas vazias para todos os critérios aplicáveis
      const emptyAnswers = applicableCriteria.map((criterion) => ({
        id: `empty-${criterion.id}`,
        selfAssessmentId: 'empty',
        criterionId: criterion.id,
        score: 0,
        justification: '',
      }));

      // Criar estrutura de autoavaliação vazia
      const emptySelfAssessment = {
        id: 'empty',
        authorId: subordinateId,
        cycle: activeCycle.name,
        status: EvaluationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
        answers: emptyAnswers,
      };

      // Mapear e retornar a autoavaliação vazia
      const selfAssessment: ISelfAssessment = {
        ...emptySelfAssessment,
        status: emptySelfAssessment.status as EvaluationStatus,
        createdAt: new Date(emptySelfAssessment.createdAt),
        updatedAt: new Date(emptySelfAssessment.updatedAt),
        submittedAt: emptySelfAssessment.submittedAt
          ? new Date(emptySelfAssessment.submittedAt)
          : undefined,
      } as ISelfAssessment;

      // Adicionar o progresso de preenchimento
      const completionStatus = this.calculateSelfAssessmentCompletionByPillar(selfAssessment);
      const totalCompleted = Object.values(completionStatus).reduce(
        (acc, p: PillarProgressDto) => acc + p.completed,
        0,
      );
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
    const totalCompleted = Object.values(completionStatus).reduce(
      (acc, p: PillarProgressDto) => acc + p.completed,
      0,
    );
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
    
    // Verificar se é gestor direto OU gestor de projeto
    const isDirectManager = subordinate.managerId === managerId;
    const isProjectManager = await this.projectsService.canManagerEvaluateUser(managerId, subordinateId);
    
    if (!isDirectManager && !isProjectManager) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar os dados deste usuário. Ele não é seu subordinado direto nem está em projetos onde você é gestor.',
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

  // Busca a avaliação de gestor para um subordinado específico em um ciclo
  async getManagerAssessmentForSubordinate(
    managerId: string,
    subordinateId: string,
    cycle: string,
  ) {
    // 1. Verificar se o gestor logado é o autor da avaliação
    // 2. Buscar a avaliação no banco de dados

    const managerAssessment = await this.prisma.managerAssessment.findUnique({
      where: {
        authorId_evaluatedUserId_cycle: {
          authorId: managerId,
          evaluatedUserId: subordinateId,
          cycle: cycle,
        },
      },
      include: {
        evaluatedUser: {
          select: { id: true, name: true, email: true, jobTitle: true, seniority: true },
        },
        answers: true,
      },
    });

    if (!managerAssessment) {
      throw new NotFoundException(
        `Avaliação do gestor para o subordinado ${subordinateId} no ciclo ${cycle} não encontrada.`,
      );
    }

    return managerAssessment;
  }

  // Histórico de notas por ciclos, pilares (BEHAVIOR, EXECUTION e MANAGEMENT) e inclui a nota final do comitê.
  async getPerformanceHistory(userId: string): Promise<PerformanceHistoryDto> {
    const [
      criteria,
      selfAssessments,
      managerAssessments,
      committeeAssessments,
      submitted360Assessments,
    ] = await Promise.all([
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
      this.prisma.assessment360.findMany({
        // Considerar apenas avaliações enviada
        where: { authorId: userId, status: 'SUBMITTED' },
      }),
    ]);

    // Mapeia critérioId para seu pilar
    const criteriaPillarMap = new Map<string, CriterionPillar>(
      criteria.map((c) => [c.id, c.pillar]),
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

    const totalAssessmentsSubmitted = selfAssessments.length + submitted360Assessments.length;

    return {
      performanceData,
      assessmentsSubmittedCount: totalAssessmentsSubmitted, // <-- Usamos a nova soma
    };
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

  /**
   * Coleta dados estruturados de todos os colaboradores para análise de equipe
   * @param managerId ID do gestor
   * @param cycle Ciclo de avaliação
   * @returns Dados estruturados da equipe com todas as avaliações
   */
  async getTeamEvaluationData(
    managerId: string,
    cycle: string,
  ): Promise<TeamEvaluationSummaryData> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(managerId);
    if (!isManager) {
      throw new ForbiddenException('Usuário não tem permissão para acessar dados da equipe.');
    }

    // Buscar todos os colaboradores que o gestor pode gerenciar
    const projectsWithSubordinates = await this.projectsService.getEvaluableSubordinates(managerId);

    const allSubordinateIds = new Set<string>();
    projectsWithSubordinates.forEach((project) => {
      project.subordinates.forEach((sub: { id: string }) => allSubordinateIds.add(sub.id));
    });

    const subordinateIds = Array.from(allSubordinateIds);

    if (subordinateIds.length === 0) {
      throw new NotFoundException('Nenhum colaborador encontrado para este gestor.');
    }

    // Buscar dados de todos os colaboradores
    const collaboratorsData = await Promise.all(
      subordinateIds.map(async (collaboratorId) => {
        const [user, assessments360, managerAssessments, committeeAssessments] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: collaboratorId },
            select: {
              id: true,
              name: true,
              jobTitle: true,
              seniority: true,
            },
          }),
          this.prisma.assessment360.findMany({
            where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
            include: {
              author: {
                select: { name: true },
              },
            },
          }),
          this.prisma.managerAssessment.findMany({
            where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
            include: {
              author: {
                select: { name: true },
              },
              answers: true,
            },
          }),
          this.prisma.committeeAssessment.findMany({
            where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
          }),
        ]);

        if (!user) return null;

        // Calcular média das avaliações
        const scores: number[] = [];

        // Adicionar notas das avaliações 360
        assessments360.forEach((assessment) => {
          scores.push(assessment.overallScore);
        });

        // Adicionar médias das avaliações de gestor
        managerAssessments.forEach((assessment) => {
          if (assessment.answers.length > 0) {
            const managerAvg =
              assessment.answers.reduce((sum, ans) => sum + ans.score, 0) /
              assessment.answers.length;
            scores.push(managerAvg);
          }
        });

        // Usar nota do comitê se disponível, senão calcular média das outras avaliações
        let averageScore = 0;
        let committeeScore: number | undefined;

        if (committeeAssessments.length > 0) {
          committeeScore = committeeAssessments[0].finalScore;
          averageScore = committeeScore;
        } else if (scores.length > 0) {
          averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }

        return {
          collaboratorId: user.id,
          collaboratorName: user.name,
          jobTitle: user.jobTitle,
          seniority: user.seniority,
          averageScore,
          committeeScore,
          assessments360: assessments360.map((assessment) => ({
            authorName: assessment.author.name,
            overallScore: assessment.overallScore,
            strengths: assessment.strengths,
            improvements: assessment.improvements,
          })),
          managerAssessments: managerAssessments.map((assessment) => ({
            authorName: assessment.author.name,
            answers: assessment.answers.map((answer) => ({
              criterionId: answer.criterionId,
              score: answer.score,
              justification: answer.justification,
            })),
          })),
        };
      }),
    );

    // Filtrar colaboradores nulos e calcular estatísticas da equipe
    const validCollaborators = collaboratorsData.filter(Boolean) as TeamCollaboratorData[];

    const teamAverageScore =
      validCollaborators.length > 0
        ? validCollaborators.reduce((sum, collab) => sum + collab.averageScore, 0) /
          validCollaborators.length
        : 0;

    const highPerformers = validCollaborators.filter((collab) => collab.averageScore >= 4.5).length;
    const lowPerformers = validCollaborators.filter((collab) => collab.averageScore <= 2.5).length;

    return {
      cycle,
      teamAverageScore,
      totalCollaborators: validCollaborators.length,
      collaborators: validCollaborators,
      highPerformers,
      lowPerformers,
    };
  }

  /**
   * Coleta dados de notas finais dos colaboradores organizados por pilar
   * @param managerId ID do gestor
   * @param cycle Ciclo de avaliação
   * @returns Dados de notas finais da equipe por pilar
   */
  async getTeamScoreAnalysisData(managerId: string, cycle: string): Promise<TeamScoreAnalysisData> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(managerId);
    if (!isManager) {
      throw new ForbiddenException('Usuário não tem permissão para acessar dados da equipe.');
    }

    // Buscar todos os colaboradores que o gestor pode gerenciar
    const projectsWithSubordinates = await this.projectsService.getEvaluableSubordinates(managerId);

    const allSubordinateIds = new Set<string>();
    projectsWithSubordinates.forEach((project) => {
      project.subordinates.forEach((sub: { id: string }) => allSubordinateIds.add(sub.id));
    });

    const subordinateIds = Array.from(allSubordinateIds);

    if (subordinateIds.length === 0) {
      throw new NotFoundException('Nenhum colaborador encontrado para este gestor.');
    }

    // Buscar critérios para mapear pilares
    const criteria = await this.prisma.criterion.findMany();
    const criteriaPillarMap = new Map<string, CriterionPillar>(
      criteria.map((c) => [c.id, c.pillar]),
    );

    // Buscar dados de todos os colaboradores
    const collaboratorsData = await Promise.all(
      subordinateIds.map(async (collaboratorId) => {
        const [user, managerAssessments, committeeAssessments] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: collaboratorId },
            select: {
              id: true,
              name: true,
            },
          }),
          this.prisma.managerAssessment.findMany({
            where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
            include: {
              answers: true,
            },
          }),
          this.prisma.committeeAssessment.findMany({
            where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
          }),
        ]);

        if (!user) return null;

        // Calcular médias por pilar das avaliações de gestor
        let behaviorScore: number | undefined;
        let executionScore: number | undefined;
        let finalScore: number | undefined;
        let hasCommitteeScore = false;

        // Priorizar nota do comitê
        if (committeeAssessments.length > 0) {
          finalScore = committeeAssessments[0].finalScore;
          hasCommitteeScore = true;
        } else if (managerAssessments.length > 0) {
          // Calcular médias por pilar das avaliações de gestor
          const pillarScores = {
            [CriterionPillar.BEHAVIOR]: { total: 0, count: 0 },
            [CriterionPillar.EXECUTION]: { total: 0, count: 0 },
          };

          managerAssessments.forEach((assessment) => {
            assessment.answers.forEach((answer) => {
              const pillar = criteriaPillarMap.get(answer.criterionId);
              if (pillar && pillarScores[pillar]) {
                pillarScores[pillar].total += answer.score;
                pillarScores[pillar].count++;
              }
            });
          });

          behaviorScore =
            pillarScores.BEHAVIOR.count > 0
              ? pillarScores.BEHAVIOR.total / pillarScores.BEHAVIOR.count
              : undefined;

          executionScore =
            pillarScores.EXECUTION.count > 0
              ? pillarScores.EXECUTION.total / pillarScores.EXECUTION.count
              : undefined;

          // Calcular média final se não houver nota do comitê
          const allScores: number[] = [];
          if (behaviorScore) allScores.push(behaviorScore);
          if (executionScore) allScores.push(executionScore);

          if (allScores.length > 0) {
            finalScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
          }
        }

        return {
          collaboratorId: user.id,
          collaboratorName: user.name,
          finalScore,
          behaviorScore,
          executionScore,
          hasCommitteeScore,
        };
      }),
    );

    // Filtrar colaboradores nulos
    const validCollaborators = collaboratorsData.filter(Boolean) as CollaboratorScoreData[];

    // Calcular estatísticas da equipe
    const scoresWithFinal = validCollaborators.filter((c) => c.finalScore !== undefined);
    const teamAverageScore =
      scoresWithFinal.length > 0
        ? scoresWithFinal.reduce((sum, collab) => sum + (collab.finalScore || 0), 0) /
          scoresWithFinal.length
        : 0;

    const behaviorScores = validCollaborators.filter((c) => c.behaviorScore !== undefined);
    const behaviorAverage =
      behaviorScores.length > 0
        ? behaviorScores.reduce((sum, collab) => sum + (collab.behaviorScore || 0), 0) /
          behaviorScores.length
        : undefined;

    const executionScores = validCollaborators.filter((c) => c.executionScore !== undefined);
    const executionAverage =
      executionScores.length > 0
        ? executionScores.reduce((sum, collab) => sum + (collab.executionScore || 0), 0) /
          executionScores.length
        : undefined;

    const highPerformers = validCollaborators.filter(
      (collab) => (collab.finalScore || 0) >= 4.5,
    ).length;
    const criticalPerformers = validCollaborators.filter(
      (collab) => (collab.finalScore || 0) <= 2.5,
    ).length;

    return {
      cycle,
      totalCollaborators: validCollaborators.length,
      teamAverageScore,
      behaviorAverage,
      executionAverage,
      highPerformers,
      criticalPerformers,
      collaborators: validCollaborators,
    };
  }

  async findOrCreateTeamAnalyses(managerId: string, cycle: string): Promise<ManagerTeamSummary> {
    // Passo 1: Tenta buscar um resumo já existente no banco de dados
    const existingSummary = await this.prisma.managerTeamSummary.findUnique({
      where: {
        managerId_cycle: {
          managerId,
          cycle,
        },
      },
    });

    // retorna imediatamente se encontrou(leitura rápida)
    if (existingSummary) {
      console.log('Resumo encontrado no cache do banco. Retornando rapidamente.');
      return existingSummary;
    }

    console.log('Resumo não encontrado. Gerando uma nova análise...');

    const teamScoreData = await this.getTeamScoreAnalysisData(managerId, cycle);
    const teamEvaluationData = await this.getTeamEvaluationData(managerId, cycle);

    // Chama a IA para gerar os dois resumos
    const [scoreAnalysisSummary, feedbackAnalysisSummary] = await Promise.all([
      this.genAiService.getTeamScoreAnalysis(teamScoreData),
      this.genAiService.getTeamEvaluationSummary(teamEvaluationData),
    ]);

    // Monta o objeto completo para salvar no banco de dados
    const newSummaryData = {
      managerId,
      cycle,
      scoreAnalysisSummary,
      feedbackAnalysisSummary,
      totalCollaborators: teamScoreData.totalCollaborators,
      teamAverageScore: teamScoreData.teamAverageScore,
      highPerformers: teamScoreData.highPerformers,
      lowPerformers: teamEvaluationData.lowPerformers,
      behaviorAverage: teamScoreData.behaviorAverage,
      executionAverage: teamScoreData.executionAverage,
      criticalPerformers: teamScoreData.criticalPerformers,
    };

    // Salva o novo resumo no banco de dados
    const createdSummary = await this.prisma.managerTeamSummary.create({
      data: newSummaryData,
    });

    return createdSummary;
  }

  /**
   * Coleta métricas consolidadas para a página de brutal facts
   * @param managerId ID do gestor
   * @param cycle Ciclo de avaliação atual
   * @returns Métricas consolidadas incluindo comparação com ciclo anterior
   */
  async getBrutalFactsMetrics(managerId: string, cycle: string): Promise<BrutalFactsMetricsDto> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(managerId);
    if (!isManager) {
      throw new ForbiddenException('Usuário não tem permissão para acessar dados da equipe.');
    }

    // Buscar todos os colaboradores que o gestor pode gerenciar
    const projectsWithSubordinates = await this.projectsService.getEvaluableSubordinates(managerId);

    const allSubordinateIds = new Set<string>();
    projectsWithSubordinates.forEach((project) => {
      project.subordinates.forEach((sub: any) => allSubordinateIds.add(sub.id));
    });

    const subordinateIds = Array.from(allSubordinateIds);

    if (subordinateIds.length === 0) {
      throw new NotFoundException('Nenhum colaborador encontrado para este gestor.');
    }

    // Calcular ciclo anterior (assumindo formato "YYYY.N")
    const [year, period] = cycle.split('.');
    const periodNum = parseInt(period);
    const previousCycle = periodNum > 1 ? `${year}.${periodNum - 1}` : `${parseInt(year) - 1}.2`; // Se for primeiro período do ano, vai para último do ano anterior

    // Buscar dados do ciclo atual e anterior em paralelo
    const [currentCycleData, previousCycleData, collaboratorsEvaluatedCount] = await Promise.all([
      this.getTeamMetricsForCycle(subordinateIds, cycle, managerId),
      this.getTeamMetricsForCycle(subordinateIds, previousCycle, managerId),
      this.prisma.managerAssessment.count({
        where: {
          authorId: managerId,
          cycle,
          status: 'SUBMITTED',
        },
      }),
    ]);

    // Calcular melhoria de desempenho
    const performanceImprovement =
      currentCycleData.overallScoreAverage && previousCycleData.overallScoreAverage
        ? parseFloat(
            (currentCycleData.overallScoreAverage - previousCycleData.overallScoreAverage).toFixed(
              2,
            ),
          )
        : null;

    return {
      cycle,
      overallScoreAverage: currentCycleData.overallScoreAverage,
      performanceImprovement,
      collaboratorsEvaluatedCount,
      teamPerformance: {
        selfAssessmentTeamAverage: currentCycleData.selfAssessmentTeamAverage,
        managerAssessmentTeamAverage: currentCycleData.managerAssessmentTeamAverage,
        finalScoreTeamAverage: currentCycleData.finalScoreTeamAverage,
      },
      collaboratorsMetrics: currentCycleData.collaboratorsMetrics,
    };
  }

  /**
   * Método auxiliar para buscar métricas de um ciclo específico
   */
  private async getTeamMetricsForCycle(subordinateIds: string[], cycle: string, managerId: string) {
    // Buscar dados de todos os colaboradores para o ciclo
    const collaboratorsData = await Promise.all(
      subordinateIds.map(async (collaboratorId) => {
        const [user, selfAssessments, assessments360, managerAssessments, committeeAssessments] =
          await Promise.all([
            this.prisma.user.findUnique({
              where: { id: collaboratorId },
              select: {
                id: true,
                name: true,
                jobTitle: true,
                seniority: true,
              },
            }),
            this.prisma.selfAssessment.findMany({
              where: { authorId: collaboratorId, cycle, status: 'SUBMITTED' },
              include: { answers: true },
            }),
            this.prisma.assessment360.findMany({
              where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
            }),
            this.prisma.managerAssessment.findMany({
              where: {
                evaluatedUserId: collaboratorId,
                cycle,
                status: 'SUBMITTED',
                authorId: managerId,
              },
              include: { answers: true },
            }),
            this.prisma.committeeAssessment.findMany({
              where: { evaluatedUserId: collaboratorId, cycle, status: 'SUBMITTED' },
            }),
          ]);

        if (!user) return null;

        // Calcular médias
        const selfAssessmentAverage =
          selfAssessments.length > 0 && selfAssessments[0].answers.length > 0
            ? selfAssessments[0].answers.reduce((sum, ans) => sum + ans.score, 0) /
              selfAssessments[0].answers.length
            : null;

        const assessment360Average =
          assessments360.length > 0
            ? assessments360.reduce((sum, assessment) => sum + assessment.overallScore, 0) /
              assessments360.length
            : null;

        const managerAssessmentAverage =
          managerAssessments.length > 0 && managerAssessments[0].answers.length > 0
            ? managerAssessments[0].answers.reduce((sum, ans) => sum + ans.score, 0) /
              managerAssessments[0].answers.length
            : null;

        const finalScore =
          committeeAssessments.length > 0 ? committeeAssessments[0].finalScore : null;

        return {
          collaboratorId: user.id,
          collaboratorName: user.name,
          jobTitle: user.jobTitle,
          seniority: user.seniority,
          selfAssessmentAverage: selfAssessmentAverage
            ? parseFloat(selfAssessmentAverage.toFixed(2))
            : null,
          assessment360Average: assessment360Average
            ? parseFloat(assessment360Average.toFixed(2))
            : null,
          managerAssessmentAverage: managerAssessmentAverage
            ? parseFloat(managerAssessmentAverage.toFixed(2))
            : null,
          finalScore: finalScore ? parseFloat(finalScore.toFixed(2)) : null,
        };
      }),
    );

    const validCollaborators = collaboratorsData.filter(Boolean) as Array<{
      collaboratorId: string;
      collaboratorName: string;
      jobTitle: string;
      seniority: string;
      selfAssessmentAverage: number | null;
      assessment360Average: number | null;
      managerAssessmentAverage: number | null;
      finalScore: number | null;
    }>;

    // Calcular médias do time
    const overallScores = validCollaborators
      .map((c) => c.assessment360Average)
      .filter((score) => score !== null);

    const selfAssessmentScores = validCollaborators
      .map((c) => c.selfAssessmentAverage)
      .filter((score) => score !== null);

    const managerAssessmentScores = validCollaborators
      .map((c) => c.managerAssessmentAverage)
      .filter((score) => score !== null);

    const finalScores = validCollaborators
      .map((c) => c.finalScore)
      .filter((score) => score !== null);

    return {
      overallScoreAverage:
        overallScores.length > 0
          ? parseFloat(
              (overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length).toFixed(
                2,
              ),
            )
          : null,
      selfAssessmentTeamAverage:
        selfAssessmentScores.length > 0
          ? parseFloat(
              (
                selfAssessmentScores.reduce((sum, score) => sum + score, 0) /
                selfAssessmentScores.length
              ).toFixed(2),
            )
          : null,
      managerAssessmentTeamAverage:
        managerAssessmentScores.length > 0
          ? parseFloat(
              (
                managerAssessmentScores.reduce((sum, score) => sum + score, 0) /
                managerAssessmentScores.length
              ).toFixed(2),
            )
          : null,
      finalScoreTeamAverage:
        finalScores.length > 0
          ? parseFloat(
              (finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length).toFixed(2),
            )
          : null,
      collaboratorsMetrics: validCollaborators,
    };
  }

  /**
   * Obtém performance histórica da equipe por ciclo
   * @param managerId ID do gestor
   * @returns Dados históricos das médias por ciclo
   */
  async getTeamHistoricalPerformance(
    managerId: string,
  ): Promise<TeamHistoricalPerformanceResponseDto> {
    // Verificar se o usuário é gestor
    const isManager = await this.projectsService.isManager(managerId);
    if (!isManager) {
      throw new ForbiddenException('Apenas gestores podem acessar dados históricos da equipe.');
    }

    // Buscar todos os colaboradores que o gestor pode gerenciar
    const projectsWithSubordinates = await this.projectsService.getEvaluableSubordinates(managerId);

    const allSubordinateIds = new Set<string>();
    projectsWithSubordinates.forEach((project) => {
      (project as any).subordinates.forEach((sub: any) => allSubordinateIds.add(sub.id));
    });

    const subordinateIds = Array.from(allSubordinateIds);

    if (subordinateIds.length === 0) {
      throw new NotFoundException('Nenhum colaborador encontrado para este gestor.');
    }

    // Buscar todos os ciclos únicos que têm avaliações
    const allCycles = await this.getAllDistinctCycles();

    // Calcular performance para cada ciclo
    const performanceByCycle: TeamPerformanceByCycleDto[] = await Promise.all(
      allCycles.map(async (cycle) => {
        return await this.calculateTeamPerformanceForCycle(subordinateIds, cycle);
      }),
    );

    // Filtrar ciclos que têm dados e ordenar por ciclo (mais recente primeiro)
    const validPerformanceByCycle = performanceByCycle
      .filter((perf) => perf.totalCollaborators > 0)
      .sort((a, b) => b.cycle.localeCompare(a.cycle));

    return {
      managerId,
      performanceByCycle: validPerformanceByCycle,
      totalCycles: validPerformanceByCycle.length,
    };
  }

  // Em src/evaluations/evaluations.service.ts

  async getProjectEvaluations(projectId: string): Promise<any> {
    // O tipo de retorno agora é um objeto
    const evaluationsPath = path.join(process.cwd(), 'src', 'data', 'evaluations.json');

    try {
      const fileContent = fs.readFileSync(evaluationsPath, 'utf-8');
      const evaluationsData = JSON.parse(fileContent);

      const projectData = evaluationsData.projetos[0]?.[projectId];

      if (!projectData) {
        throw new NotFoundException(`Dados para o projeto com ID '${projectId}' não encontrados.`);
      }

      // **AQUI ESTÁ A CORREÇÃO**
      // Retornamos o objeto completo com todos os dados do projeto.
      return {
        // Adicionando um nome formatado para uma melhor experiência no frontend
        projectName: projectId
          .replace('projeto-', '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        ...projectData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.projectLogger.error('Erro ao ler ou analisar o arquivo evaluations.json', error);
      throw new Error('Não foi possível carregar os dados de avaliação do projeto.');
    }
  }

  /**
   * Busca todos os ciclos únicos que têm avaliações no sistema
   */
  private async getAllDistinctCycles(): Promise<string[]> {
    const [selfCycles, managerCycles, committeeCycles, assessment360Cycles] = await Promise.all([
      this.prisma.selfAssessment.findMany({
        select: { cycle: true },
        distinct: ['cycle'],
        where: { status: 'SUBMITTED' },
      }),
      this.prisma.managerAssessment.findMany({
        select: { cycle: true },
        distinct: ['cycle'],
        where: { status: 'SUBMITTED' },
      }),
      this.prisma.committeeAssessment.findMany({
        select: { cycle: true },
        distinct: ['cycle'],
        where: { status: 'SUBMITTED' },
      }),
      this.prisma.assessment360.findMany({
        select: { cycle: true },
        distinct: ['cycle'],
        where: { status: 'SUBMITTED' },
      }),
    ]);

    // Combinar todos os ciclos únicos
    const allCyclesSet = new Set<string>();
    selfCycles.forEach((c) => allCyclesSet.add(c.cycle));
    managerCycles.forEach((c) => allCyclesSet.add(c.cycle));
    committeeCycles.forEach((c) => allCyclesSet.add(c.cycle));
    assessment360Cycles.forEach((c) => allCyclesSet.add(c.cycle));

    return Array.from(allCyclesSet);
  }

  /**
   * Calcula as médias de performance da equipe para um ciclo específico
   */
  private async calculateTeamPerformanceForCycle(
    subordinateIds: string[],
    cycle: string,
  ): Promise<TeamPerformanceByCycleDto> {
    // Buscar autoavaliações
    const selfAssessments = await this.prisma.selfAssessment.findMany({
      where: {
        authorId: { in: subordinateIds },
        cycle,
        status: 'SUBMITTED',
      },
      include: {
        answers: true,
      },
    });

    // Buscar avaliações 360 recebidas pelos subordinados
    const received360Assessments = await this.prisma.assessment360.findMany({
      where: {
        evaluatedUserId: { in: subordinateIds },
        cycle,
        status: 'SUBMITTED',
      },
    });

    // Buscar avaliações do comitê para os subordinados
    const committeeAssessments = await this.prisma.committeeAssessment.findMany({
      where: {
        evaluatedUserId: { in: subordinateIds },
        cycle,
        status: 'SUBMITTED',
      },
    });

    // Calcular médias das autoavaliações
    const selfAssessmentScores = selfAssessments
      .map((assessment) => {
        if (assessment.answers.length === 0) return null;
        const averageScore =
          assessment.answers.reduce((sum, answer) => sum + answer.score, 0) /
          assessment.answers.length;
        return {
          collaboratorId: assessment.authorId,
          score: averageScore,
        };
      })
      .filter((item) => item !== null);

    // Calcular médias das avaliações 360 recebidas
    const received360Scores = received360Assessments.map((assessment) => ({
      collaboratorId: assessment.evaluatedUserId,
      score: assessment.overallScore,
    }));

    // Calcular overall score usando apenas finalScore do comitê
    const committeeScores = committeeAssessments.map((assessment) => ({
      collaboratorId: assessment.evaluatedUserId,
      score: assessment.finalScore,
    }));

    // Agrupar por colaborador
    const collaboratorMap = new Map<
      string,
      { selfScore?: number; received360Score?: number; committeeScore?: number }
    >();

    // Adicionar scores de autoavaliação
    selfAssessmentScores.forEach((item) => {
      if (!collaboratorMap.has(item.collaboratorId)) {
        collaboratorMap.set(item.collaboratorId, {});
      }
      collaboratorMap.get(item.collaboratorId)!.selfScore = item.score;
    });

    // Adicionar scores de 360 recebidas
    received360Scores.forEach((item) => {
      if (!collaboratorMap.has(item.collaboratorId)) {
        collaboratorMap.set(item.collaboratorId, {});
      }
      collaboratorMap.get(item.collaboratorId)!.received360Score = item.score;
    });

    // Adicionar scores do comitê
    committeeScores.forEach((item) => {
      if (!collaboratorMap.has(item.collaboratorId)) {
        collaboratorMap.set(item.collaboratorId, {});
      }
      collaboratorMap.get(item.collaboratorId)!.committeeScore = item.score;
    });

    // Calcular médias finais
    const finalSelfScores: number[] = [];
    const finalReceived360Scores: number[] = [];
    const finalCommitteeScores: number[] = [];

    for (const [, scores] of collaboratorMap.entries()) {
      if (scores.selfScore !== undefined) {
        finalSelfScores.push(scores.selfScore);
      }
      if (scores.received360Score !== undefined) {
        finalReceived360Scores.push(scores.received360Score);
      }
      if (scores.committeeScore !== undefined) {
        finalCommitteeScores.push(scores.committeeScore);
      }
    }

    return {
      cycle,
      averageOverallScore:
        finalCommitteeScores.length > 0
          ? Number(
              (
                finalCommitteeScores.reduce((sum, score) => sum + score, 0) /
                finalCommitteeScores.length
              ).toFixed(2),
            )
          : null,
      averageSelfAssessment:
        finalSelfScores.length > 0
          ? Number(
              (
                finalSelfScores.reduce((sum, score) => sum + score, 0) / finalSelfScores.length
              ).toFixed(2),
            )
          : null,
      averageReceived360:
        finalReceived360Scores.length > 0
          ? Number(
              (
                finalReceived360Scores.reduce((sum, score) => sum + score, 0) /
                finalReceived360Scores.length
              ).toFixed(2),
            )
          : null,
      totalCollaborators: collaboratorMap.size,
    };
  }

  /**
   * Cria uma avaliação 360 graus
   */
  async create360Assessment(authorId: string, dto: Create360AssessmentDto) {
    // Validar se o ciclo fornecido existe e está na fase correta
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

    // Verificar se o usuário avaliado existe
    const evaluatedUser = await this.prisma.user.findUnique({
      where: { id: dto.evaluatedUserId },
    });

    if (!evaluatedUser) {
      throw new NotFoundException('Usuário avaliado não encontrado');
    }

    // Verificar se o autor e o avaliado são a mesma pessoa
    if (authorId === dto.evaluatedUserId) {
      throw new BadRequestException('Você não pode se autoavaliar usando avaliação 360');
    }

    // Verificar se já existe uma avaliação 360 para este par de usuários no ciclo atual
    const existingAssessment = await this.prisma.assessment360.findFirst({
      where: {
        authorId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma avaliação 360 para este usuário no ciclo ${activeCycle.name}`,
      );
    }

    // Verificar se o autor e o avaliado trabalham no mesmo projeto
    const authorProjects = await this.prisma.userProjectAssignment.findMany({
      where: { userId: authorId },
      include: { project: true },
    });

    const evaluatedUserProjects = await this.prisma.userProjectAssignment.findMany({
      where: { userId: dto.evaluatedUserId },
      include: { project: true },
    });

    const authorProjectIds = authorProjects.map((ap) => ap.projectId);
    const evaluatedUserProjectIds = evaluatedUserProjects.map((eup) => eup.projectId);

    const commonProjects = authorProjectIds.filter((id) => evaluatedUserProjectIds.includes(id));

    if (commonProjects.length === 0) {
      throw new ForbiddenException(
        'Você só pode avaliar colegas de trabalho (mesmo projeto) ou seu gestor direto',
      );
    }

    // Criar a avaliação 360
    const assessment = await this.prisma.assessment360.create({
      data: {
        authorId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
        overallScore: dto.overallScore,
        strengths: dto.strengths,
        improvements: dto.improvements,
        motivationToWorkAgain: dto.workAgainMotivation,
        status: EvaluationStatus.DRAFT,
      },
      include: {
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

    return {
      id: assessment.id,
      evaluatedUser: assessment.evaluatedUser,
      overallScore: assessment.overallScore,
      strengths: assessment.strengths,
      improvements: assessment.improvements,
      motivationToWorkAgain: assessment.motivationToWorkAgain,
      status: assessment.status,
      cycle: assessment.cycle,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };
  }

  /**
   * Busca uma avaliação 360 específica
   */
  async get360Assessment(authorId: string, evaluatedUserId: string) {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

    // Buscar a avaliação 360
    const assessment = await this.prisma.assessment360.findFirst({
      where: {
        authorId,
        evaluatedUserId,
        cycle: activeCycle.name,
      },
      include: {
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

    if (!assessment) {
      throw new NotFoundException('Avaliação 360 não encontrada');
    }

    return {
      id: assessment.id,
      evaluatedUser: assessment.evaluatedUser,
      overallScore: assessment.overallScore,
      strengths: assessment.strengths,
      improvements: assessment.improvements,
      motivationToWorkAgain: assessment.motivationToWorkAgain,
      status: assessment.status,
      cycle: assessment.cycle,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };
  }

  /**
   * Retorna a autoavaliação existente para o ciclo atual ativo formatada para o frontend
   */
  async getSelfAssessmentForFrontend(userId: string) {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.getActiveCycle();

    // Verificar se o usuário tem papel de gestor para determinar critérios obrigatórios
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: true,
      },
    });

    if (!userWithRoles) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isManager = userWithRoles.roleAssignments.some(
      (assignment) => assignment.role === 'MANAGER',
    );

    // Buscar critérios válidos dinamicamente do banco
    const validCriteria = await this.prisma.criterion.findMany({
      where: {
        OR: [
          // Critérios base (aplicam para todos)
          { isBase: true },
          // Critérios específicos da businessUnit do usuário
          { businessUnit: userWithRoles.businessUnit },
        ],
      },
      select: {
        id: true,
        pillar: true,
        businessUnit: true,
        isBase: true,
      },
    });

    // Filtrar critérios válidos baseado no papel do usuário
    const applicableCriteriaIds = validCriteria
      .filter((criterion) => {
        // Critérios de gestão apenas para gestores
        if (criterion.pillar === 'MANAGEMENT') {
          return isManager;
        }
        // Todos os outros critérios são aplicáveis
        return true;
      })
      .map((criterion) => criterion.id);

    // Buscar a autoavaliação do usuário para o ciclo ativo
    const selfAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: activeCycle?.name,
      },
      include: {
        answers: true,
      },
    });

    // Se não existir autoavaliação, retornar null
    if (!selfAssessment) {
      return null;
    }

    // Criar objeto de resposta formatado
    const formattedResponse: Record<string, { score: number; justification: string }> = {};

    // Para cada critério aplicável, buscar a resposta correspondente
    for (const criterionId of applicableCriteriaIds) {
      const answer = selfAssessment.answers.find((a) => a.criterionId === criterionId);

      if (answer) {
        formattedResponse[criterionId] = {
          score: answer.score,
          justification: this.encryptionService.decrypt(answer.justification),
        };
      } else {
        // Se não há resposta para o critério, retornar valores padrão
        formattedResponse[criterionId] = {
          score: 0,
          justification: '',
        };
      }
    }

    return formattedResponse;
  }

  /**
   * Atualiza uma avaliação 360 graus
   */
  async update360Assessment(authorId: string, dto: Update360AssessmentDto) {
    const { evaluatedUserId, cycleId, ...updateData } = dto;

    // Buscar avaliação existente
    let existingAssessment = await this.prisma.assessment360.findFirst({
      where: {
        authorId,
        evaluatedUserId,
        cycle: cycleId,
      },
      include: {
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

    // Se não existir, criar uma nova avaliação em branco
    if (!existingAssessment) {
      existingAssessment = await this.prisma.assessment360.create({
        data: {
          authorId,
          evaluatedUserId,
          cycle: cycleId,
          status: EvaluationStatus.DRAFT,
          overallScore: 0,
          strengths: '',
          improvements: '',
        },
        include: {
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
    }

    // Atualizar a avaliação com os novos dados
    const updatedAssessment = await this.prisma.assessment360.update({
      where: {
        id: existingAssessment.id,
      },
      data: updateData,
      include: {
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

    return {
      id: updatedAssessment.id,
      evaluatedUser: updatedAssessment.evaluatedUser,
      overallScore: updatedAssessment.overallScore,
      strengths: updatedAssessment.strengths,
      improvements: updatedAssessment.improvements,
      motivationToWorkAgain: updatedAssessment.motivationToWorkAgain,
      status: updatedAssessment.status,
      cycle: updatedAssessment.cycle,
      createdAt: updatedAssessment.createdAt,
      updatedAt: updatedAssessment.updatedAt,
    };
  }

  async updateMentoringAssessment(authorId: string, updateDto: UpdateMentoringAssessmentDto) {
    const { mentorId, cycleId, ...updateData } = updateDto;

    // Buscar avaliação existente
    let existingAssessment = await this.prisma.mentoringAssessment.findFirst({
      where: {
        authorId,
        mentorId,
        cycle: cycleId,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            seniority: true,
            roles: true,
          },
        },
      },
    });

    // Se não existir, criar uma nova avaliação em branco
    if (!existingAssessment) {
      existingAssessment = await this.prisma.mentoringAssessment.create({
        data: {
          authorId,
          mentorId,
          cycle: cycleId,
          status: EvaluationStatus.DRAFT,
          score: 0,
          justification: '',
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              seniority: true,
              roles: true,
            },
          },
        },
      });
    }

    // Atualizar a avaliação com os novos dados
    const updatedAssessment = await this.prisma.mentoringAssessment.update({
      where: {
        id: existingAssessment.id,
      },
      data: updateData,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            seniority: true,
            roles: true,
          },
        },
      },
    });

    // Formatar os dados para retorno
    return {
      mentorId: updatedAssessment.mentorId,
      mentorName: updatedAssessment.mentor.name,
      mentorEmail: updatedAssessment.mentor.email,
      mentorJobTitle: updatedAssessment.mentor.jobTitle,
      mentorSeniority: updatedAssessment.mentor.seniority,
      score: updatedAssessment.score,
      justification: updatedAssessment.justification,
      status: updatedAssessment.status,
      cycle: updatedAssessment.cycle,
    };
  }

  async getMentoringAssessment(authorId: string, mentorId: string) {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']); // SO ASS?

    // Buscar avaliação existente
    const assessment = await this.prisma.mentoringAssessment.findFirst({
      where: {
        authorId,
        mentorId,
        cycle: activeCycle.name,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            seniority: true,
            roles: true,
          },
        },
      },
    });

    if (!assessment) {
      return null;
    }

    return {
      id: assessment.id,
      score: assessment.score,
      justification: assessment.justification,
      status: assessment.status,
      cycle: assessment.cycle,
      mentor: assessment.mentor,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };
  }

  /**
   * Gera iniciais a partir do nome completo
   */
  private generateInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map((name) => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Retorna todos os colaboradores do(s) projeto(s) do usuário (exceto ele mesmo),
   * incluindo a avaliação 360 existente (se houver) para o ciclo ativo.
   */
  async getAvailable360Collaborators(userId: string) {
    // Buscar ciclo ativo
    const activeCycle = await this.cyclesService.getActiveCycle();

    // Buscar todos os projetos do usuário
    const userProjects = await this.prisma.userProjectAssignment.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = userProjects.map((up) => up.projectId);
    if (projectIds.length === 0) return [];

    // Buscar todos os colaboradores desses projetos (exceto o próprio usuário)
    const collaborators = await this.prisma.userProjectAssignment.findMany({
      where: {
        projectId: { in: projectIds },
        userId: { not: userId },
      },
      include: {
        user: true,
      },
    });

    // Remover duplicados (um colaborador pode estar em mais de um projeto)
    const uniqueCollaboratorsMap = new Map();
    for (const c of collaborators) {
      uniqueCollaboratorsMap.set(c.userId, c.user);
    }
    const uniqueCollaborators = Array.from(uniqueCollaboratorsMap.values());

    // Buscar avaliações 360 já feitas pelo usuário logado para o ciclo ativo
    const assessments = await this.prisma.assessment360.findMany({
      where: {
        authorId: userId,
        evaluatedUserId: { in: uniqueCollaborators.map((c) => c.id) },
        cycle: activeCycle?.name,
      },
    });
    const assessmentsMap = new Map();
    for (const a of assessments) {
      assessmentsMap.set(a.evaluatedUserId, a);
    }

    // Montar resposta
    return uniqueCollaborators.map((c) => {
      const a = assessmentsMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        role: c.jobTitle,
        initials: this.generateInitials(c.name),
        rating: a ? a.overallScore : null,
        strengths: a ? a.strengths : null,
        improvements: a ? a.improvements : null,
        workAgainMotivation: a ? a.motivationToWorkAgain : null,
      };
    });
  }

  /**
   * Atualiza/cria avaliações 360 em lote para o ciclo ativo
   */
  async update360AssessmentsBatch(
    userId: string,
    dtos: Array<{
      id: string;
      rating: number;
      strengths: string;
      improvements: string;
      workAgainMotivation?: WorkAgainMotivation | null;
    }>,
  ): Promise<any[]> {
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);
    const results: any[] = [];
    for (const dto of dtos) {
      // O workAgainMotivation já vem como enum do DTO
      const motivation = dto.workAgainMotivation;

      let assessment = await this.prisma.assessment360.findFirst({
        where: {
          authorId: userId,
          evaluatedUserId: dto.id,
          cycle: activeCycle.name,
        },
      });
      if (!assessment) {
        assessment = await this.prisma.assessment360.create({
          data: {
            authorId: userId,
            evaluatedUserId: dto.id,
            cycle: activeCycle.name,
            overallScore: dto.rating,
            strengths: dto.strengths,
            improvements: dto.improvements,
            motivationToWorkAgain: motivation,
            status: EvaluationStatus.DRAFT,
          },
        });
      } else {
        assessment = await this.prisma.assessment360.update({
          where: { id: assessment.id },
          data: {
            overallScore: dto.rating,
            strengths: dto.strengths,
            improvements: dto.improvements,
            motivationToWorkAgain: motivation,
          },
        });
      }
      results.push(assessment);
    }
    return results;
  }

  /**
   * Retorna os dados do mentor designado e sua avaliação de mentoring existente
   */
  async getDesignatedMentorAssessment(userId: string) {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.getActiveCycle();

    // Buscar o usuário para obter o mentorId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mentorId: true },
    });

    if (!user || !user.mentorId) {
      throw new NotFoundException('Usuário não possui mentor designado');
    }

    // Buscar dados do mentor
    const mentor = await this.prisma.user.findUnique({
      where: { id: user.mentorId },
      select: {
        id: true,
        name: true,
        jobTitle: true,
      },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor designado não encontrado');
    }

    // Buscar avaliação de mentoring existente
    const assessment = await this.prisma.mentoringAssessment.findFirst({
      where: {
        authorId: userId,
        mentorId: user.mentorId,
        cycle: activeCycle?.name,
      },
    });

    return {
      id: mentor.id,
      mentorName: mentor.name,
      mentorRole: mentor.jobTitle,
      mentorInitials: this.generateInitials(mentor.name),
      rating: assessment ? assessment.score : null,
      justification: assessment ? assessment.justification : null,
    };
  }

  /**
   * Atualiza ou cria uma avaliação de mentoring para o mentor designado
   */
  async updateDesignatedMentorAssessment(userId: string, dto: UpdateDesignatedMentorAssessmentDto) {
    console.log('DTO recebido:', dto);
    console.log('Tipo do DTO:', typeof dto);
    console.log('Rating:', dto?.rating);
    console.log('Justification:', dto?.justification);

    // Validar se o dto existe e tem os campos necessários
    if (!dto) {
      throw new BadRequestException('Dados da avaliação são obrigatórios');
    }

    if (typeof dto.rating !== 'number' || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating deve ser um número entre 1 e 5');
    }

    if (!dto.justification || typeof dto.justification !== 'string') {
      throw new BadRequestException('Justificativa é obrigatória');
    }

    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

    // Buscar o usuário para obter o mentorId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mentorId: true },
    });

    if (!user || !user.mentorId) {
      throw new NotFoundException('Usuário não possui mentor designado');
    }

    // Buscar avaliação existente
    let assessment = await this.prisma.mentoringAssessment.findFirst({
      where: {
        authorId: userId,
        mentorId: user.mentorId,
        cycle: activeCycle.name,
      },
    });

    if (!assessment) {
      // Criar nova avaliação
      assessment = await this.prisma.mentoringAssessment.create({
        data: {
          authorId: userId,
          mentorId: user.mentorId,
          cycle: activeCycle.name,
          score: dto.rating,
          justification: dto.justification,
          status: EvaluationStatus.DRAFT,
        },
      });
    } else {
      // Atualizar avaliação existente
      assessment = await this.prisma.mentoringAssessment.update({
        where: { id: assessment.id },
        data: {
          score: dto.rating,
          justification: dto.justification,
        },
      });
    }

    return assessment;
  }

  /**
   * Retorna todos os feedbacks de referência dados pelo usuário no ciclo ativo
   */
  async getReferenceFeedbacks(userId: string) {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.getActiveCycle();

    // Buscar todos os feedbacks de referência do usuário no ciclo ativo
    const referenceFeedbacks = await this.prisma.referenceFeedback.findMany({
      where: {
        authorId: userId,
        cycle: activeCycle?.name,
      },
      include: {
        referencedUser: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
          },
        },
      },
    });

    // Formatar a resposta com dados descriptografados
    return referenceFeedbacks.map((feedback) => ({
      id: feedback.referencedUserId, // Usar o ID do usuário referenciado, não do feedback
      referenceName: feedback.referencedUser.name,
      referenceRole: feedback.referencedUser.jobTitle,
      referenceInitials: this.generateInitials(feedback.referencedUser.name),
      justification: this.encryptionService.decrypt(feedback.justification),
    }));
  }

  /**
   * Remove todas as referências existentes e recria conforme o array enviado. Operação atômica.
   */
  async updateReferenceFeedbacksBatch(
    userId: string,
    references: Array<{
      id: string;
      referenceName: string;
      referenceRole: string;
      referenceInitials: string;
      justification: string;
    }>,
  ) {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.validateActiveCyclePhase(['ASSESSMENTS']);

    // Validar se todos os usuários referenciados existem
    const referencedUserIds = references.map((ref) => ref.id);
    const existingUsers = await this.prisma.user.findMany({
      where: {
        id: { in: referencedUserIds },
      },
      select: {
        id: true,
        name: true,
        jobTitle: true,
      },
    });

    if (existingUsers.length !== referencedUserIds.length) {
      const existingIds = existingUsers.map((u) => u.id);
      const missingIds = referencedUserIds.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(`Usuários não encontrados: ${missingIds.join(', ')}`);
    }

    // Verificar se não está tentando referenciar a si mesmo
    if (referencedUserIds.includes(userId)) {
      throw new BadRequestException('Não é possível referenciar a si mesmo');
    }

    // Operação atômica: deletar todos os feedbacks existentes e criar os novos
    return await this.prisma.$transaction(async (prisma) => {
      // Deletar todos os feedbacks de referência existentes do usuário no ciclo ativo
      await prisma.referenceFeedback.deleteMany({
        where: {
          authorId: userId,
          cycle: activeCycle.name,
        },
      });

      // Criar os novos feedbacks de referência
      const newFeedbacks = await Promise.all(
        references.map(async (ref) => {
          return prisma.referenceFeedback.create({
            data: {
              authorId: userId,
              referencedUserId: ref.id, // ID do usuário referenciado
              cycle: activeCycle.name,
              topic: this.encryptionService.encrypt(''), // Campo opcional vazio
              justification: this.encryptionService.encrypt(ref.justification),
              status: EvaluationStatus.DRAFT,
            },
            include: {
              referencedUser: {
                select: {
                  id: true,
                  name: true,
                  jobTitle: true,
                },
              },
            },
          });
        }),
      );

      // Retornar os feedbacks formatados
      return newFeedbacks.map((feedback) => ({
        id: feedback.id,
        referenceName: feedback.referencedUser.name,
        referenceRole: feedback.referencedUser.jobTitle,
        referenceInitials: this.generateInitials(feedback.referencedUser.name),
        justification: this.encryptionService.decrypt(feedback.justification),
      }));
    });
  }

  /**
   * Retorna todos os colaboradores disponíveis para seleção como referência (exceto o próprio usuário)
   */
  async getAvailableCollaborators(
    userId: string,
  ): Promise<{ id: string; name: string; email: string }[]> {
    // Buscar todos os usuários ativos, exceto o próprio
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    return users;
  }

  /**
   * Retorna informações do mentorado para o mentor autenticado
   */
  async getMenteeInfo(mentorId: string, menteeId: string): Promise<MenteeInfoDto> {
    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.validateActiveCyclePhase([
      'ASSESSMENTS',
      'MANAGER_REVIEWS',
      'EQUALIZATION',
    ]);

    // Verificar se o mentorado existe e está ativo
    const mentee = await this.prisma.user.findUnique({
      where: { id: menteeId, isActive: true },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        seniority: true,
        mentorId: true,
      },
    });

    if (!mentee) {
      throw new NotFoundException('Mentorado não encontrado');
    }

    // Verificar se o usuário autenticado é realmente o mentor do mentorado
    if (mentee.mentorId !== mentorId) {
      throw new ForbiddenException('Você não é o mentor deste usuário');
    }

    // Buscar a autoavaliação do mentorado no ciclo atual
    const [selfAssessment, received360Assessments] = await Promise.all([
      this.prisma.selfAssessment.findFirst({
        where: {
          authorId: menteeId,
          cycle: activeCycle.name,
        },
        include: {
          answers: true,
        },
      }),
      // Buscar avaliações 360 recebidas pelo mentorado
      this.prisma.assessment360.findMany({
        where: {
          evaluatedUserId: menteeId,
          cycle: activeCycle.name,
          status: EvaluationStatus.SUBMITTED,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              jobTitle: true,
              seniority: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let formattedSelfAssessment: Record<string, { score: number; justification: string }> | null =
      null;
    let selfAssessmentStatus: 'DRAFT' | 'SUBMITTED' | 'NOT_STARTED' = 'NOT_STARTED';

    if (selfAssessment) {
      // Formatar autoavaliação no padrão do frontend
      formattedSelfAssessment = {};

      for (const answer of selfAssessment.answers) {
        formattedSelfAssessment[answer.criterionId] = {
          score: answer.score,
          justification: answer.justification,
        };
      }

      selfAssessmentStatus = selfAssessment.status as 'DRAFT' | 'SUBMITTED';
    }

    // Mapear as avaliações 360 recebidas para o formato do DTO
    const mappedReceived360Assessments = received360Assessments.map((assessment) => ({
      id: assessment.id,
      overallScore: assessment.overallScore,
      strengths: assessment.strengths,
      improvements: assessment.improvements,
      motivationToWorkAgain: assessment.motivationToWorkAgain,
      status: assessment.status,
      author: {
        id: assessment.author.id,
        name: assessment.author.name,
        jobTitle: assessment.author.jobTitle,
        seniority: assessment.author.seniority,
      },
      createdAt: assessment.createdAt,
      submittedAt: assessment.submittedAt,
    }));

    return {
      id: mentee.id,
      name: mentee.name,
      jobTitle: mentee.jobTitle,
      seniority: mentee.seniority,
      selfAssessment: formattedSelfAssessment,
      selfAssessmentStatus,
      cycle: activeCycle.name,
      received360Assessments: mappedReceived360Assessments,
    };
  }
}
