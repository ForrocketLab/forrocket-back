import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { CyclesService } from '../cycles/cycles.service';
import {
  CreateClimateAssessmentDto,
  UpdateClimateAssessmentDto,
  ClimateAssessmentConfigDto,
  ClimateAssessmentConfigResponseDto,
} from '../assessments/dto';
import { ClimateSentimentAnalysisData, ClimateSentimentAnalysisResponseDto } from '../assessments/dto/climate-sentiment-analysis.dto';
import { UserRole } from '@prisma/client';
import { GenAiService } from '../../gen-ai/gen-ai.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClimateService {
  private readonly logger = new Logger(ClimateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly cyclesService: CyclesService,
    private readonly genAiService: GenAiService,
  ) {}

  /**
   * Verifica se o usuário tem permissão para acessar avaliações de clima
   * (apenas colaboradores e mentores sem papéis de liderança)
   */
  private async validateUserPermission(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se tem pelo menos um dos papéis elegíveis
    const eligibleRoles: UserRole[] = [UserRole.COLLABORATOR, UserRole.MENTOR];
    const leadershipRoles: UserRole[] = [UserRole.MANAGER, UserRole.LEADER, UserRole.RH, UserRole.ADMIN, UserRole.COMMITTEE];
    
    // Verificar papéis na nova estrutura (roleAssignments)
    const userRolesFromAssignments: UserRole[] = user.roleAssignments.map(ra => ra.role);
    
    // Verificar papéis no campo roles (estrutura antiga - JSON string)
    let userRolesFromField: UserRole[] = [];
    try {
      if (user.roles && typeof user.roles === 'string') {
        const parsedRoles = JSON.parse(user.roles);
        if (Array.isArray(parsedRoles)) {
          userRolesFromField = parsedRoles.map(role => role.toUpperCase() as UserRole);
        }
      }
    } catch (error) {
      this.logger.warn(`Erro ao fazer parse dos roles do usuário ${userId}:`, error);
    }
    
    // Combinar ambos os arrays de papéis
    const allUserRoles = [...userRolesFromAssignments, ...userRolesFromField];
    
    // Deve ter pelo menos um papel elegível
    const hasEligibleRole = allUserRoles.some(role => eligibleRoles.includes(role));
    
    // NÃO deve ter nenhum papel de liderança
    const hasLeadershipRole = allUserRoles.some(role => leadershipRoles.includes(role));
    
    if (!hasEligibleRole || hasLeadershipRole) {
      throw new ForbiddenException('Apenas colaboradores e mentores (sem papéis de liderança) podem acessar avaliações de clima organizacional');
    }
  }

  /**
   * Verifica se o usuário tem permissão de RH para configurar avaliações de clima
   */
  private async validateRHPermission(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userRoles = user.roleAssignments.map(ra => ra.role);
    const hasRHPermission = userRoles.includes(UserRole.RH) || userRoles.includes(UserRole.ADMIN);
    
    if (!hasRHPermission) {
      throw new ForbiddenException('Apenas RH pode configurar avaliações de clima organizacional');
    }
  }

  /**
   * Verifica se a avaliação de clima está ativa para o ciclo atual
   */
  private async validateClimateAssessmentActive(): Promise<void> {
    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    const config = await this.prisma.climateAssessmentConfig.findUnique({
      where: { cycle: activeCycle.name },
    });

    if (!config || !config.isActive) {
      throw new BadRequestException('Avaliação de clima organizacional não está ativa para este ciclo');
    }
  }

  /**
   * Cria uma avaliação de clima organizacional
   */
  async createClimateAssessment(userId: string, dto: CreateClimateAssessmentDto) {
    // Validar permissões do usuário
    await this.validateUserPermission(userId);

    // Verificar se a avaliação de clima está ativa
    await this.validateClimateAssessmentActive();

    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Verificar se já existe uma avaliação para este usuário e ciclo
    const existingAssessment = await this.prisma.climateAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: activeCycle.name,
      },
    });

    if (existingAssessment) {
      throw new BadRequestException(
        `Já existe uma avaliação de clima para o ciclo ativo ${activeCycle.name}`,
      );
    }

    // Mapear os dados do DTO para o formato do banco (com criptografia das justificativas)
    const answers = [
      {
        criterionId: 'relacionamento-lideranca',
        score: dto.relacionamentoLiderancaScore,
        justification: this.encryptionService.encrypt(dto.relacionamentoLiderancaJustification),
      },
      {
        criterionId: 'relacionamento-colegas',
        score: dto.relacionamentoColegasScore,
        justification: this.encryptionService.encrypt(dto.relacionamentoColegasJustification),
      },
      {
        criterionId: 'reconhecimento-valorizacao',
        score: dto.reconhecimentoValorizacaoScore,
        justification: this.encryptionService.encrypt(dto.reconhecimentoValorizacaoJustification),
      },
      {
        criterionId: 'carga-trabalho-equilibrio',
        score: dto.cargaTrabalhoEquilibrioScore,
        justification: this.encryptionService.encrypt(dto.cargaTrabalhoEquilibrioJustification),
      },
    ];

    try {
      // Criar a avaliação
      const assessment = await this.prisma.climateAssessment.create({
        data: {
          authorId: userId,
          cycle: activeCycle.name,
          status: 'DRAFT',
          answers: {
            create: answers,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          answers: true,
        },
      });

      return assessment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma avaliação de clima organizacional existente
   */
  async updateClimateAssessment(userId: string, dto: UpdateClimateAssessmentDto) {
    // Validar permissões do usuário
    await this.validateUserPermission(userId);

    // Verificar se a avaliação de clima está ativa
    await this.validateClimateAssessmentActive();

    // Validar se existe um ciclo ativo
    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Buscar avaliação existente
    const existingAssessment = await this.prisma.climateAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: activeCycle.name,
      },
      include: {
        answers: true,
      },
    });

    if (!existingAssessment) {
      throw new NotFoundException('Avaliação de clima não encontrada');
    }

    if (existingAssessment.status === 'SUBMITTED') {
      throw new BadRequestException('Não é possível editar uma avaliação já submetida');
    }

    // Mapear atualizações
    const updates: any = {};

    if (dto.relacionamentoLiderancaScore !== undefined) {
      updates['relacionamento-lideranca'] = {
        score: dto.relacionamentoLiderancaScore,
        justification: dto.relacionamentoLiderancaJustification 
          ? this.encryptionService.encrypt(dto.relacionamentoLiderancaJustification)
          : undefined,
      };
    }

    if (dto.relacionamentoColegasScore !== undefined) {
      updates['relacionamento-colegas'] = {
        score: dto.relacionamentoColegasScore,
        justification: dto.relacionamentoColegasJustification
          ? this.encryptionService.encrypt(dto.relacionamentoColegasJustification)
          : undefined,
      };
    }

    if (dto.reconhecimentoValorizacaoScore !== undefined) {
      updates['reconhecimento-valorizacao'] = {
        score: dto.reconhecimentoValorizacaoScore,
        justification: dto.reconhecimentoValorizacaoJustification
          ? this.encryptionService.encrypt(dto.reconhecimentoValorizacaoJustification)
          : undefined,
      };
    }

    if (dto.cargaTrabalhoEquilibrioScore !== undefined) {
      updates['carga-trabalho-equilibrio'] = {
        score: dto.cargaTrabalhoEquilibrioScore,
        justification: dto.cargaTrabalhoEquilibrioJustification
          ? this.encryptionService.encrypt(dto.cargaTrabalhoEquilibrioJustification)
          : undefined,
      };
    }

    // Atualizar respostas
    for (const [criterionId, updateUntyped] of Object.entries(updates)) {
      const update = updateUntyped as { score: number; justification?: string };
      await this.prisma.climateAssessmentAnswer.upsert({
        where: {
          climateAssessmentId_criterionId: {
            climateAssessmentId: existingAssessment.id,
            criterionId,
          },
        },
        update: {
          score: update.score,
          ...(update.justification !== undefined ? { justification: update.justification } : {}),
        },
        create: {
          climateAssessmentId: existingAssessment.id,
          criterionId,
          score: update.score,
          justification: update.justification || '',
        },
      });
    }

    // Buscar avaliação atualizada
    const updatedAssessment = await this.prisma.climateAssessment.findUnique({
      where: { id: existingAssessment.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: true,
      },
    });

    this.logger.log(`Avaliação de clima atualizada: ${existingAssessment.id} para usuário ${userId}`);

    return updatedAssessment;
  }

  /**
   * Busca a avaliação de clima do usuário para o ciclo ativo
   */
  async getClimateAssessment(userId: string) {
    // Validar permissões do usuário
    await this.validateUserPermission(userId);

    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    const assessment = await this.prisma.climateAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: activeCycle.name,
      },
      include: {
        answers: true,
      },
    });

    if (!assessment) {
      return null;
    }

    // Descriptografar justificativas
    const decryptedAnswers = assessment.answers.map(answer => ({
      ...answer,
      justification: this.encryptionService.decrypt(answer.justification),
    }));

    return {
      ...assessment,
      answers: decryptedAnswers,
    };
  }

  /**
   * Submete uma avaliação de clima organizacional
   */
  async submitClimateAssessment(userId: string) {
    // Validar permissões do usuário
    await this.validateUserPermission(userId);

    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    const assessment = await this.prisma.climateAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: activeCycle.name,
      },
      include: {
        answers: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Avaliação de clima não encontrada');
    }

    if (assessment.status === 'SUBMITTED') {
      throw new BadRequestException('Avaliação já foi submetida');
    }

    // Verificar se todos os critérios foram preenchidos
    const requiredCriteria = [
      'relacionamento-lideranca',
      'relacionamento-colegas',
      'reconhecimento-valorizacao',
      'carga-trabalho-equilibrio',
    ];

    const answeredCriteria = assessment.answers.map(a => a.criterionId);
    const missingCriteria = requiredCriteria.filter(c => !answeredCriteria.includes(c));

    if (missingCriteria.length > 0) {
      throw new BadRequestException(
        `Critérios obrigatórios não preenchidos: ${missingCriteria.join(', ')}`,
      );
    }

    // Verificar se todas as justificativas foram preenchidas
    const emptyJustifications = assessment.answers.filter(
      a => !a.justification || a.justification.trim() === '',
    );

    if (emptyJustifications.length > 0) {
      throw new BadRequestException('Todas as justificativas são obrigatórias');
    }

    // Submeter a avaliação
    const submittedAssessment = await this.prisma.climateAssessment.update({
      where: { id: assessment.id },
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
        answers: true,
      },
    });

    this.logger.log(`Avaliação de clima submetida: ${assessment.id} por usuário ${userId}`);

    return submittedAssessment;
  }

  /**
   * Configura a avaliação de clima organizacional (apenas RH)
   */
  async configureClimateAssessment(userId: string, dto: ClimateAssessmentConfigDto): Promise<ClimateAssessmentConfigResponseDto> {
    // Validar permissões de RH
    await this.validateRHPermission(userId);

    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }

    // Buscar ou criar configuração
    let config = await this.prisma.climateAssessmentConfig.findUnique({
      where: { cycle: activeCycle.name },
      include: {
        activatedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (config) {
      // Atualizar configuração existente
      config = await this.prisma.climateAssessmentConfig.update({
        where: { id: config.id },
        data: {
          isActive: dto.isActive,
          ...(dto.isActive ? {} : { deactivatedAt: new Date() }),
        },
        include: {
          activatedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // Criar nova configuração
      config = await this.prisma.climateAssessmentConfig.create({
        data: {
          cycle: activeCycle.name,
          isActive: dto.isActive,
          activatedBy: userId,
        },
        include: {
          activatedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    this.logger.log(`Configuração de clima ${dto.isActive ? 'ativada' : 'desativada'} para ciclo ${activeCycle.name} por usuário ${userId}`);

    if (!config.activatedAt) {
      throw new Error('Configuração de clima sem data de ativação.');
    }
    return {
      id: config.id,
      cycle: config.cycle,
      isActive: config.isActive,
      activatedBy: config.activatedBy,
      activatedByUserName: config.activatedByUser.name,
      activatedAt: config.activatedAt.toISOString(),
      deactivatedAt: config.deactivatedAt ? config.deactivatedAt.toISOString() : undefined,
    };
  }

  /**
   * Busca a configuração atual da avaliação de clima
   */
  async getClimateAssessmentConfig(): Promise<ClimateAssessmentConfigResponseDto | null> {
    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      return null;
    }

    const config = await this.prisma.climateAssessmentConfig.findUnique({
      where: { cycle: activeCycle.name },
      include: {
        activatedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!config) {
      return null;
    }

    if (!config.activatedAt) {
      throw new Error('Configuração de clima sem data de ativação.');
    }
    return {
      id: config.id,
      cycle: config.cycle,
      isActive: config.isActive,
      activatedBy: config.activatedBy,
      activatedByUserName: config.activatedByUser.name,
      activatedAt: config.activatedAt.toISOString(),
      deactivatedAt: config.deactivatedAt ? config.deactivatedAt.toISOString() : undefined,
    };
  }

  /**
   * Lista apenas os ciclos que possuem configuração de clima organizacional
   */
  async getClimateCycles() {
    const configs = await this.prisma.climateAssessmentConfig.findMany({
      orderBy: { activatedAt: 'desc' },
      select: { cycle: true },
    });
    // Remover duplicados e ordenar
    const uniqueCycles = Array.from(new Set(configs.map(c => c.cycle)));
    return uniqueCycles;
  }

  /**
   * Busca estatísticas da avaliação de clima (apenas RH), podendo receber ciclo específico
   */
  async getClimateAssessmentStats(userId: string, cycle?: string) {
    this.logger.log(`Buscando estatísticas de clima para usuário ${userId} e ciclo ${cycle || 'ativo'}`);
    await this.validateRHPermission(userId);

    let targetCycle = cycle;
    if (!targetCycle) {
      const activeCycle = await this.cyclesService.getActiveCycle();
      if (!activeCycle) {
        throw new BadRequestException('Não há ciclo ativo');
      }
      targetCycle = activeCycle.name;
    }

    this.logger.log(`Ciclo alvo: ${targetCycle}`);

    // Verificar se existe configuração (pode estar inativa)
    const config = await this.prisma.climateAssessmentConfig.findUnique({
      where: { cycle: targetCycle },
    });

    this.logger.log(`Configuração encontrada: ${config ? 'sim' : 'não'}, ativa: ${config?.isActive}`);

    // Se não há configuração, retornar estatísticas vazias
    if (!config) {
      this.logger.log('Retornando estatísticas vazias - sem configuração');
      return {
        cycle: targetCycle,
        totalAssessments: 0,
        submittedAssessments: 0,
        draftAssessments: 0,
        eligibleUsers: 0,
        completionRate: 0,
        criteriaStats: {
          'relacionamento-lideranca': { total: 0, count: 0, average: 0 },
          'relacionamento-colegas': { total: 0, count: 0, average: 0 },
          'reconhecimento-valorizacao': { total: 0, count: 0, average: 0 },
          'carga-trabalho-equilibrio': { total: 0, count: 0, average: 0 },
        },
      };
    }

    // Buscar todas as avaliações do ciclo
    const assessments = await this.prisma.climateAssessment.findMany({
      where: { cycle: targetCycle },
      include: {
        answers: true,
        author: {
          select: { id: true, name: true, businessUnit: true },
        },
      },
    });

    // Calcular estatísticas
    const totalAssessments = assessments.length;
    const submittedAssessments = assessments.filter(a => a.status === 'SUBMITTED').length;
    const draftAssessments = assessments.filter(a => a.status === 'DRAFT').length;

    // Calcular médias por critério
    const criteriaStats = {
      'relacionamento-lideranca': { total: 0, count: 0, average: 0 },
      'relacionamento-colegas': { total: 0, count: 0, average: 0 },
      'reconhecimento-valorizacao': { total: 0, count: 0, average: 0 },
      'carga-trabalho-equilibrio': { total: 0, count: 0, average: 0 },
    };
    assessments.forEach(assessment => {
      assessment.answers.forEach(answer => {
        if (criteriaStats[answer.criterionId]) {
          criteriaStats[answer.criterionId].total += answer.score;
          criteriaStats[answer.criterionId].count += 1;
        }
      });
    });
    Object.keys(criteriaStats).forEach(criterionId => {
      const stats = criteriaStats[criterionId];
      stats.average = stats.count > 0 ? stats.total / stats.count : 0;
    });

    // Buscar todos os usuários elegíveis (ativos, com APENAS papel de COLLABORATOR ou MENTOR)
    const eligibleRoles: UserRole[] = [UserRole.COLLABORATOR, UserRole.MENTOR];
    const leadershipRoles: UserRole[] = [UserRole.MANAGER, UserRole.LEADER, UserRole.RH, UserRole.ADMIN, UserRole.COMMITTEE];
    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        roleAssignments: { some: { role: { in: eligibleRoles } } },
        NOT: { roleAssignments: { some: { role: { in: leadershipRoles } } } },
      },
      select: { id: true },
    });
    const totalEligibleUsers = eligibleUsers.length;
    const participationRate = totalEligibleUsers > 0 ? (submittedAssessments / totalEligibleUsers) * 100 : 0;

    return {
      cycle: targetCycle,
      totalAssessments,
      submittedAssessments,
      draftAssessments,
      eligibleUsers: totalEligibleUsers,
      completionRate: participationRate,
      criteriaStats,
    };
  }

  /**
   * Busca análise de sentimento de clima organizacional para o ciclo informado ou ativo
   */
  async getClimateSentimentAnalysis(userId: string, cycle?: string): Promise<ClimateSentimentAnalysisResponseDto | null> {
    await this.validateRHPermission(userId);
    let targetCycle = cycle;
    if (!targetCycle) {
      const activeCycle = await this.cyclesService.getActiveCycle();
      if (!activeCycle) return null;
      targetCycle = activeCycle.name;
    }
    const existing = await this.prisma.climateSentimentAnalysis.findUnique({
      where: { cycle: targetCycle },
    });
    if (!existing) return null;
    return {
      sentimentAnalysis: existing.sentimentAnalysis,
      improvementTips: existing.improvementTips,
      strengths: existing.strengths,
      areasOfConcern: existing.areasOfConcern,
      overallSentimentScore: existing.overallSentimentScore,
      cycle: existing.cycle,
      totalAssessments: existing.totalAssessments,
      generatedAt: existing.createdAt.toISOString(),
    };
  }

  /**
   * Gera e salva análise de sentimento da avaliação de clima organizacional (apenas RH)
   */
  async generateClimateSentimentAnalysis(userId: string): Promise<ClimateSentimentAnalysisResponseDto> {
    // Validar permissões de RH
    await this.validateRHPermission(userId);
    const activeCycle = await this.cyclesService.getActiveCycle();
    if (!activeCycle) {
      throw new BadRequestException('Não há ciclo ativo');
    }
    // Verificar se já existe análise
    const existing = await this.prisma.climateSentimentAnalysis.findUnique({
      where: { cycle: activeCycle.name },
    });
    if (existing) {
      throw new BadRequestException('A análise de sentimento já foi gerada para este ciclo.');
    }
    // Buscar todas as avaliações submetidas do ciclo
    const assessments = await this.prisma.climateAssessment.findMany({
      where: {
        cycle: activeCycle.name,
        status: 'SUBMITTED',
      },
      include: {
        answers: true,
      },
    });
    if (assessments.length === 0) {
      throw new BadRequestException('Não há avaliações submetidas para análise');
    }
    // Mapear critérios
    const criteriaMapping = {
      'relacionamento-lideranca': 'Relacionamento com a Liderança',
      'relacionamento-colegas': 'Relacionamento com Colegas',
      'reconhecimento-valorizacao': 'Reconhecimento e Valorização',
      'carga-trabalho-equilibrio': 'Carga de Trabalho e Equilíbrio',
    };
    // Preparar dados para análise
    const criteriaData = Object.entries(criteriaMapping).map(([criterionId, criterionName]) => {
      const answers = assessments.flatMap(assessment => 
        assessment.answers.filter(answer => answer.criterionId === criterionId)
      );
      const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
      const averageScore = answers.length > 0 ? totalScore / answers.length : 0;
      // Descriptografar justificativas
      const justifications = answers.map(answer => 
        this.encryptionService.decrypt(answer.justification)
      );
      return {
        id: criterionId,
        name: criterionName,
        averageScore,
        totalResponses: answers.length,
        justifications,
      };
    });
    // Preparar dados para o GenAI
    const climateData: ClimateSentimentAnalysisData = {
      cycle: activeCycle.name,
      totalAssessments: assessments.length,
      criteria: criteriaData,
    };
    // Gerar análise de sentimento com GPT-4o
    const analysisResult = await this.genAiService.getClimateSentimentAnalysis(climateData);
    const analysis = JSON.parse(analysisResult);
    // Salvar no banco
    const saved = await this.prisma.climateSentimentAnalysis.create({
      data: {
        cycle: activeCycle.name,
        sentimentAnalysis: analysis.sentimentAnalysis,
        improvementTips: analysis.improvementTips,
        strengths: analysis.strengths,
        areasOfConcern: analysis.areasOfConcern,
        overallSentimentScore: analysis.overallSentimentScore,
        totalAssessments: assessments.length,
      },
    });
    return {
      sentimentAnalysis: saved.sentimentAnalysis,
      improvementTips: saved.improvementTips,
      strengths: saved.strengths,
      areasOfConcern: saved.areasOfConcern,
      overallSentimentScore: saved.overallSentimentScore,
      cycle: saved.cycle,
      totalAssessments: saved.totalAssessments,
      generatedAt: saved.createdAt.toISOString(),
    };
  }
} 