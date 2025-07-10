import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CyclesService } from '../cycles/cycles.service';
import {
  CreateCommitteeAssessmentDto,
  UpdateCommitteeAssessmentDto,
} from './dto/committee-assessment.dto';
import { 
  CollaboratorSummaryResponseDto,
  GetCollaboratorSummaryRequestDto 
} from '../../gen-ai/dto/collaborator-summary.dto';
import { DateSerializer } from '../../common/utils/date-serializer.util';

@Injectable()
export class CommitteeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cyclesService: CyclesService,
  ) {}

  /**
   * Valida se o usuário é membro do comitê
   */
  private validateCommitteeMember(userRoles: string | string[]): void {
    const parsedRoles = Array.isArray(userRoles) ? userRoles : JSON.parse(userRoles || '[]');
    const isCommittee = parsedRoles.includes('comite') || parsedRoles.includes('COMMITTEE');

    if (!isCommittee) {
      throw new ForbiddenException(
        'Apenas membros do comitê podem realizar avaliações de equalização',
      );
    }
  }

  /**
   * Busca todos os colaboradores que precisam de equalização no ciclo ativo
   */
  async getCollaboratorsForEqualization() {
    // Validar que estamos na fase de equalização
    await this.cyclesService.validateActiveCyclePhase('EQUALIZATION');

    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();

    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Por enquanto, buscar apenas colaboradores ativos (simplificado)
    const collaborators = await this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: {
          contains: 'colaborador',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
      },
      orderBy: [{ businessUnit: 'asc' }, { name: 'asc' }],
    });

    // Buscar avaliações de comitê existentes
    const committeeAssessments = await this.prisma.committeeAssessment.findMany({
      where: {
        cycle: activeCycle.name,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Mapear colaboradores com status de avaliação de comitê
    const collaboratorsWithStatus = collaborators.map((collaborator) => {
      const assessment = committeeAssessments.find((a) => a.evaluatedUserId === collaborator.id);
      return {
        ...collaborator,
        hasCommitteeAssessment: !!assessment,
        committeeAssessment: assessment || null,
      };
    });

    return {
      cycle: activeCycle.name,
      phase: activeCycle.phase,
      collaborators: collaboratorsWithStatus,
      summary: {
        totalCollaborators: collaborators.length,
        withCommitteeAssessment: committeeAssessments.length,
        pendingEqualization: collaborators.length - committeeAssessments.length,
      },
    };
  }

  /**
   * Busca dados completos de um colaborador para equalização
   */
  async getCollaboratorEvaluationSummary(collaboratorId: string) {
    // Validar que estamos na fase de equalização
    await this.cyclesService.validateActiveCyclePhase('EQUALIZATION');

    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();

    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Buscar colaborador
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        seniority: true,
        careerTrack: true,
        businessUnit: true,
      },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Buscar todas as avaliações recebidas no ciclo
    const [
      selfAssessment,
      assessments360Received,
      managerAssessmentsReceived,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      committeeAssessment,
    ] = await Promise.all([
      // Autoavaliação
      this.prisma.selfAssessment.findFirst({
        where: {
          authorId: collaboratorId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: { answers: true },
      }),

      // Avaliações 360 recebidas
      this.prisma.assessment360.findMany({
        where: {
          evaluatedUserId: collaboratorId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de gestor recebidas
      this.prisma.managerAssessment.findMany({
        where: {
          evaluatedUserId: collaboratorId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
          answers: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliações de mentoring recebidas
      this.prisma.mentoringAssessment.findMany({
        where: {
          mentorId: collaboratorId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Feedbacks de referência recebidos
      this.prisma.referenceFeedback.findMany({
        where: {
          referencedUserId: collaboratorId,
          cycle: activeCycle.name,
          status: 'SUBMITTED',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, jobTitle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Avaliação de comitê existente
      this.prisma.committeeAssessment.findFirst({
        where: {
          evaluatedUserId: collaboratorId,
          cycle: activeCycle.name,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalAssessmentsReceived =
      (selfAssessment ? 1 : 0) +
      assessments360Received.length +
      managerAssessmentsReceived.length +
      mentoringAssessmentsReceived.length +
      referenceFeedbacksReceived.length;

    // Calcular médias das avaliações
    const calculateSelfAssessmentAverage = (assessment: any) => {
      if (!assessment?.answers?.length) return null;
      const total = assessment.answers.reduce((sum: number, answer: any) => sum + answer.score, 0);
      return Math.round((total / assessment.answers.length) * 10) / 10; // 1 casa decimal
    };

    const calculateAverage = (assessments: any[], scoreField: string) => {
      if (!assessments.length) return null;
      const total = assessments.reduce((sum, assessment) => sum + (assessment[scoreField] || 0), 0);
      return Math.round((total / assessments.length) * 10) / 10; // 1 casa decimal
    };

    const calculateManagerAssessmentAverage = (assessments: any[]) => {
      if (!assessments.length) return null;
      const allScores: number[] = [];
      
      assessments.forEach(assessment => {
        if (assessment.answers?.length) {
          assessment.answers.forEach((answer: any) => {
            allScores.push(answer.score);
          });
        }
      });
      
      if (allScores.length === 0) return null;
      const total = allScores.reduce((sum, score) => sum + score, 0);
      return Math.round((total / allScores.length) * 10) / 10; // 1 casa decimal
    };

    // Calcular médias
    const selfAssessmentAverage = calculateSelfAssessmentAverage(selfAssessment);
    const assessment360Average = calculateAverage(assessments360Received, 'overallScore');
    const managerAssessmentAverage = calculateManagerAssessmentAverage(managerAssessmentsReceived);
    const mentoringAverage = calculateAverage(mentoringAssessmentsReceived, 'score');

    // Gerar resumo personalizado
    const generateSummary = () => {
      const parts: string[] = [];
      if (selfAssessmentAverage) parts.push(`Autoavaliação: ${selfAssessmentAverage}`);
      if (assessment360Average) parts.push(`Avaliação 360: ${assessment360Average}`);
      if (managerAssessmentAverage) parts.push(`Avaliação Gestor: ${managerAssessmentAverage}`);
      if (mentoringAverage) parts.push(`Mentoring: ${mentoringAverage}`);
      
      if (parts.length === 0) return 'Aguardando avaliações para análise de equalização';
      
      return `Médias recebidas - ${parts.join(', ')}. Total de ${totalAssessmentsReceived} avaliações para análise.`;
    };

    return {
      cycle: activeCycle.name,
      collaborator,
      evaluationScores: {
        selfAssessment: selfAssessmentAverage,
        assessment360: assessment360Average,
        managerAssessment: managerAssessmentAverage,
        mentoring: mentoringAverage
      },
      customSummary: generateSummary(),
      selfAssessment,
      assessments360Received,
      managerAssessmentsReceived,
      mentoringAssessmentsReceived,
      referenceFeedbacksReceived,
      committeeAssessment,
      summary: {
        totalAssessmentsReceived,
        hasCommitteeAssessment: !!committeeAssessment,
        isEqualizationComplete: !!committeeAssessment && committeeAssessment.status === 'SUBMITTED',
      },
    };
  }

  /**
   * Cria uma nova avaliação de comitê
   */
  async createCommitteeAssessment(authorId: string, dto: CreateCommitteeAssessmentDto) {
    // Validar que o usuário é membro do comitê
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { roles: true },
    });

    if (!author) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.validateCommitteeMember(author.roles);

    // Validar que estamos na fase de equalização
    await this.cyclesService.validateActiveCyclePhase('EQUALIZATION');

    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();

    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Verificar se o colaborador existe
    const collaborator = await this.prisma.user.findUnique({
      where: { id: dto.evaluatedUserId, isActive: true },
    });

    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    // Verificar se já existe uma avaliação de comitê para este colaborador no ciclo ativo
    const existingAssessment = await this.prisma.committeeAssessment.findFirst({
      where: {
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma avaliação de comitê para este colaborador no ciclo ${activeCycle.name}`,
      );
    }

    // Criar a avaliação de comitê
    const committeeAssessment = await this.prisma.committeeAssessment.create({
      data: {
        authorId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: activeCycle.name,
        finalScore: dto.finalScore,
        justification: dto.justification,
        observations: dto.observations || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return committeeAssessment;
  }

  /**
   * Atualiza uma avaliação de comitê existente
   */
  async updateCommitteeAssessment(
    assessmentId: string,
    authorId: string,
    dto: UpdateCommitteeAssessmentDto,
  ) {
    // Validar que estamos na fase de equalização
    await this.cyclesService.validateActiveCyclePhase('EQUALIZATION');

    // Buscar a avaliação
    const assessment = await this.prisma.committeeAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException('Avaliação de comitê não encontrada');
    }

    // Verificar se o usuário é membro do comitê
    const currentUser = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { roles: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.validateCommitteeMember(currentUser.roles);

    // Permitir edição durante a fase de equalização, mesmo se já foi submetida
    // A verificação de fase já foi feita acima

    // Atualizar a avaliação
    const updatedAssessment = await this.prisma.committeeAssessment.update({
      where: { id: assessmentId },
      data: {
        ...(dto.finalScore !== undefined && { finalScore: dto.finalScore }),
        ...(dto.justification !== undefined && { justification: dto.justification }),
        ...(dto.observations !== undefined && { observations: dto.observations }),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return updatedAssessment;
  }

  /**
   * Submete uma avaliação de comitê
   */
  async submitCommitteeAssessment(assessmentId: string, authorId: string) {
    // Buscar a avaliação
    const assessment = await this.prisma.committeeAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException('Avaliação de comitê não encontrada');
    }

    // Verificar se o usuário é membro do comitê
    const currentUser = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { roles: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    this.validateCommitteeMember(currentUser.roles);

    // Verificar se a avaliação ainda não foi submetida
    if (assessment.status === 'SUBMITTED') {
      throw new BadRequestException('Esta avaliação já foi submetida');
    }

    // Submeter a avaliação
    const submittedAssessment = await this.prisma.committeeAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return submittedAssessment;
  }

  /**
   * Obtém métricas detalhadas do comitê
   */
  async getCommitteeMetrics() {
    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();
    
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Buscar todos os colaboradores ativos
    const totalCollaborators = await this.prisma.user.count({
      where: { 
        isActive: true, 
        roles: { contains: 'colaborador' } 
      }
    });

    // Métricas de autoavaliação
    const selfAssessmentCount = await this.prisma.selfAssessment.count({
      where: { 
        cycle: activeCycle.name, 
        status: 'SUBMITTED' 
      }
    });

    // Métricas de avaliação 360
    const assessment360Count = await this.prisma.assessment360.count({
      where: { 
        cycle: activeCycle.name, 
        status: 'SUBMITTED' 
      }
    });

    // Métricas de avaliação de gestor
    const managerAssessmentCount = await this.prisma.managerAssessment.count({
      where: { 
        cycle: activeCycle.name, 
        status: 'SUBMITTED' 
      }
    });

    // Métricas de comitê
    const committeeAssessmentCount = await this.prisma.committeeAssessment.count({
      where: { cycle: activeCycle.name }
    });

    // Calcular dias restantes
    const today = new Date();
    const daysRemaining = activeCycle.equalizationDeadline 
      ? Math.ceil((new Date(activeCycle.equalizationDeadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const result = {
      cycle: activeCycle.name,
      phase: activeCycle.phase,
      deadlines: {
        assessment: activeCycle.assessmentDeadline,
        manager: activeCycle.managerDeadline,
        equalization: activeCycle.equalizationDeadline,
        daysRemaining
      },
      metrics: {
        totalCollaborators,
        selfAssessmentCompletion: totalCollaborators > 0 ? Math.round((selfAssessmentCount / totalCollaborators) * 100) : 0,
        assessment360Completion: totalCollaborators > 0 ? Math.round((assessment360Count / totalCollaborators) * 100) : 0,
        managerAssessmentCompletion: totalCollaborators > 0 ? Math.round((managerAssessmentCount / totalCollaborators) * 100) : 0,
        committeeAssessmentCompletion: totalCollaborators > 0 ? Math.round((committeeAssessmentCount / totalCollaborators) * 100) : 0,
        counts: {
          selfAssessments: selfAssessmentCount,
          assessments360: assessment360Count,
          managerAssessments: managerAssessmentCount,
          committeeAssessments: committeeAssessmentCount
        }
      }
    };

    // Garantir que as datas sejam serializadas corretamente
    return DateSerializer.serializeObject(result, ['deadlines.assessment', 'deadlines.manager', 'deadlines.equalization']);
  }

  /**
   * Busca todas as avaliações de comitê do ciclo ativo
   */
  async getCommitteeAssessmentsByCycle() {
    const activeCycle = await this.cyclesService.getActiveCycleWithPhase();

    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    const assessments = await this.prisma.committeeAssessment.findMany({
      where: {
        cycle: activeCycle.name,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evaluatedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            seniority: true,
            businessUnit: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // DRAFT primeiro, depois SUBMITTED
        { evaluatedUser: { businessUnit: 'asc' } },
        { evaluatedUser: { name: 'asc' } },
      ],
    });

    return {
      cycle: activeCycle.name,
      phase: activeCycle.phase,
      assessments,
      summary: {
        total: assessments.length,
        draft: assessments.filter((a) => a.status === 'DRAFT').length,
        submitted: assessments.filter((a) => a.status === 'SUBMITTED').length,
      },
    };
  }

  /**
   * Export structured evaluation data for a collaborator (post-equalization)
   */
  async exportCollaboratorEvaluationData(collaboratorId: string) {
    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new NotFoundException('No active evaluation cycle found');
    }

    // Get complete collaborator summary
    const summary = await this.getCollaboratorEvaluationSummary(collaboratorId);
    
    // Check if equalization is complete (has committee assessment)
    if (!summary.committeeAssessment) {
      throw new ForbiddenException('Equalization not completed yet - no committee assessment found');
    }

    // Build structured export data
    const exportData = {
      collaborator: {
        id: summary.collaborator.id,
        name: summary.collaborator.name,
        email: summary.collaborator.email,
        jobTitle: summary.collaborator.jobTitle,
        seniority: summary.collaborator.seniority
      },
      cycle: summary.cycle,
      exportDate: new Date().toISOString(),
      evaluationData: {
        selfAssessment: summary.selfAssessment ? {
          id: summary.selfAssessment.id,
          submittedAt: summary.selfAssessment.submittedAt,
          answers: summary.selfAssessment.answers,
          totalCriteria: summary.selfAssessment.answers?.length || 0
        } : null,
        assessments360: summary.assessments360Received.map(assessment => ({
          id: assessment.id,
          author: {
            name: assessment.author.name,
            email: assessment.author.email,
            jobTitle: assessment.author.jobTitle
          },
          overallScore: assessment.overallScore,
          strengths: assessment.strengths,
          improvements: assessment.improvements,
          submittedAt: assessment.submittedAt
        })),
        managerAssessments: summary.managerAssessmentsReceived.map(assessment => ({
          id: assessment.id,
          author: {
            name: assessment.author.name,
            email: assessment.author.email,
            jobTitle: assessment.author.jobTitle
          },
          answers: assessment.answers,
          submittedAt: assessment.submittedAt,
          totalCriteria: assessment.answers?.length || 0
        })),
        mentoringAssessments: summary.mentoringAssessmentsReceived.map(assessment => ({
          id: assessment.id,
          author: {
            name: assessment.author.name,
            email: assessment.author.email,
            jobTitle: assessment.author.jobTitle
          },
          score: assessment.score,
          justification: assessment.justification,
          submittedAt: assessment.submittedAt
        })),
        referenceFeedbacks: summary.referenceFeedbacksReceived.map(feedback => ({
          id: feedback.id,
          author: {
            name: feedback.author.name,
            email: feedback.author.email,
            jobTitle: feedback.author.jobTitle
          },
          justification: feedback.justification,
          topic: feedback.topic,
          submittedAt: feedback.submittedAt
        })),
        committeeAssessment: {
          id: summary.committeeAssessment.id,
          author: {
            name: summary.committeeAssessment.author.name,
            email: summary.committeeAssessment.author.email
          },
          finalScore: summary.committeeAssessment.finalScore,
          justification: summary.committeeAssessment.justification,
          observations: summary.committeeAssessment.observations,
          submittedAt: summary.committeeAssessment.submittedAt
        }
      },
      consolidatedScores: {
        selfAssessment: summary.evaluationScores.selfAssessment,
        assessment360: summary.evaluationScores.assessment360,
        managerAssessment: summary.evaluationScores.managerAssessment,
        mentoring: summary.evaluationScores.mentoring,
        finalScore: summary.committeeAssessment.finalScore
      },
      summary: {
        totalAssessments: summary.summary.totalAssessmentsReceived,
        isEqualizationComplete: summary.summary.isEqualizationComplete,
        hasCommitteeAssessment: summary.summary.hasCommitteeAssessment,
        customSummary: summary.customSummary
      },
      metadata: {
        exportedBy: 'Committee Member', // Could be enhanced to include actual user info
        exportFormat: 'JSON',
        dataVersion: '1.0'
      }
    };

    return exportData;
  }

  /**
   * Salva um resumo GenAI para um colaborador
   */
  async saveGenAISummary(
    collaboratorId: string,
    cycle: string,
    summary: string,
    collaboratorName: string,
    jobTitle: string,
    averageScore: number,
    totalEvaluations: number,
  ): Promise<CollaboratorSummaryResponseDto> {
    // Verificar se já existe um resumo para este colaborador neste ciclo
    const existingSummary = await this.prisma.genAISummary.findUnique({
      where: {
        collaboratorId_cycle: {
          collaboratorId,
          cycle,
        },
      },
    });

    if (existingSummary) {
      throw new ConflictException(
        `Já existe um resumo para o colaborador no ciclo ${cycle}. Use uma nova versão de ciclo para gerar um novo resumo.`,
      );
    }

    // Criar novo resumo
    const genaiSummary = await this.prisma.genAISummary.create({
      data: {
        collaboratorId,
        cycle,
        summary,
        collaboratorName,
        jobTitle,
        averageScore,
        totalEvaluations,
      },
    });

    return {
      id: genaiSummary.id,
      summary: genaiSummary.summary,
      collaboratorName: genaiSummary.collaboratorName,
      jobTitle: genaiSummary.jobTitle,
      cycle: genaiSummary.cycle,
      averageScore: genaiSummary.averageScore,
      totalEvaluations: genaiSummary.totalEvaluations,
      createdAt: genaiSummary.createdAt,
      updatedAt: genaiSummary.updatedAt,
    };
  }

  /**
   * Busca um resumo GenAI existente
   */
  async getGenAISummary(dto: GetCollaboratorSummaryRequestDto): Promise<CollaboratorSummaryResponseDto> {
    const genaiSummary = await this.prisma.genAISummary.findUnique({
      where: {
        collaboratorId_cycle: {
          collaboratorId: dto.collaboratorId,
          cycle: dto.cycle,
        },
      },
    });

    if (!genaiSummary) {
      throw new NotFoundException(
        `Nenhum resumo encontrado para o colaborador no ciclo ${dto.cycle}`,
      );
    }

    return {
      id: genaiSummary.id,
      summary: genaiSummary.summary,
      collaboratorName: genaiSummary.collaboratorName,
      jobTitle: genaiSummary.jobTitle,
      cycle: genaiSummary.cycle,
      averageScore: genaiSummary.averageScore,
      totalEvaluations: genaiSummary.totalEvaluations,
      createdAt: genaiSummary.createdAt,
      updatedAt: genaiSummary.updatedAt,
    };
  }

  /**
   * Lista todos os resumos GenAI de um ciclo
   */
  async listGenAISummariesByCycle(cycle: string): Promise<CollaboratorSummaryResponseDto[]> {
    const summaries = await this.prisma.genAISummary.findMany({
      where: { cycle },
      orderBy: [
        { collaboratorName: 'asc' },
      ],
    });

    return summaries.map(summary => ({
      id: summary.id,
      summary: summary.summary,
      collaboratorName: summary.collaboratorName,
      jobTitle: summary.jobTitle,
      cycle: summary.cycle,
      averageScore: summary.averageScore,
      totalEvaluations: summary.totalEvaluations,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    }));
  }

  /**
   * Verifica se um resumo já existe para um colaborador/ciclo
   */
  async checkGenAISummaryExists(collaboratorId: string, cycle: string): Promise<boolean> {
    const summary = await this.prisma.genAISummary.findUnique({
      where: {
        collaboratorId_cycle: {
          collaboratorId,
          cycle,
        },
      },
    });

    return !!summary;
  }
}
