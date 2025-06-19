import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CyclesService } from '../cycles/cycles.service';
import {
  CreateCommitteeAssessmentDto,
  UpdateCommitteeAssessmentDto,
} from './dto/committee-assessment.dto';

@Injectable()
export class CommitteeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cyclesService: CyclesService,
  ) {}

  /**
   * Valida se o usuário é membro do comitê
   */
  private validateCommitteeMember(userRoles: string): void {
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

    return {
      cycle: activeCycle.name,
      collaborator,
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
        status: 'DRAFT',
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

    // Verificar se a avaliação ainda pode ser editada
    if (assessment.status === 'SUBMITTED') {
      throw new BadRequestException('Não é possível editar uma avaliação já submetida');
    }

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
}
