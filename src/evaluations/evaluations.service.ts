import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateSelfAssessmentDto, 
  Create360AssessmentDto, 
  CreateMentoringAssessmentDto, 
  CreateReferenceFeedbackDto 
} from './dto';
import { isValidCriterionId } from '../models/criteria';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma autoavaliação com todos os 12 critérios
   */
  async createSelfAssessment(userId: string, dto: CreateSelfAssessmentDto) {
    // Verificar se já existe uma autoavaliação para este ciclo
    const existingAssessment = await this.prisma.selfAssessment.findFirst({
      where: {
        authorId: userId,
        cycle: dto.cycle
      }
    });

    if (existingAssessment) {
      throw new BadRequestException(`Já existe uma autoavaliação para o ciclo ${dto.cycle}`);
    }

    // Mapear os dados do DTO para o formato do banco
    const answers = [
      // Comportamento
      {
        criterionId: 'sentimento-de-dono',
        score: dto.sentimentoDeDonoScore,
        justification: dto.sentimentoDeDonoJustification
      },
      {
        criterionId: 'resiliencia-adversidades',
        score: dto.resilienciaAdversidadesScore,
        justification: dto.resilienciaAdversidadesJustification
      },
      {
        criterionId: 'organizacao-trabalho',
        score: dto.organizacaoTrabalhoScore,
        justification: dto.organizacaoTrabalhoJustification
      },
      {
        criterionId: 'capacidade-aprender',
        score: dto.capacidadeAprenderScore,
        justification: dto.capacidadeAprenderJustification
      },
      {
        criterionId: 'team-player',
        score: dto.teamPlayerScore,
        justification: dto.teamPlayerJustification
      },
      
      // Execução
      {
        criterionId: 'entregar-qualidade',
        score: dto.entregarQualidadeScore,
        justification: dto.entregarQualidadeJustification
      },
      {
        criterionId: 'atender-prazos',
        score: dto.atenderPrazosScore,
        justification: dto.atenderPrazosJustification
      },
      {
        criterionId: 'fazer-mais-menos',
        score: dto.fazerMaisMenosScore,
        justification: dto.fazerMaisMenosJustification
      },
      {
        criterionId: 'pensar-fora-caixa',
        score: dto.pensarForaCaixaScore,
        justification: dto.pensarForaCaixaJustification
      },
      
      // Gestão e Liderança
      {
        criterionId: 'gestao-gente',
        score: dto.gestaoGenteScore,
        justification: dto.gestaoGenteJustification
      },
      {
        criterionId: 'gestao-resultados',
        score: dto.gestaoResultadosScore,
        justification: dto.gestaoResultadosJustification
      },
      {
        criterionId: 'evolucao-rocket',
        score: dto.evolucaoRocketScore,
        justification: dto.evolucaoRocketJustification
      }
    ];

    // Criar a autoavaliação com todos os 12 critérios
    const selfAssessment = await this.prisma.selfAssessment.create({
      data: {
        authorId: userId,
        cycle: dto.cycle,
        status: 'DRAFT',
        answers: {
          create: answers
        }
      },
      include: {
        answers: true
      }
    });

    return selfAssessment;
  }

  /**
   * Cria uma avaliação 360
   */
  async create360Assessment(userId: string, dto: Create360AssessmentDto) {
    // Verificar se o usuário avaliado existe
    const evaluatedUser = await this.prisma.user.findUnique({
      where: { id: dto.evaluatedUserId }
    });

    if (!evaluatedUser) {
      throw new NotFoundException('Usuário avaliado não encontrado');
    }

    // Verificar se não está tentando avaliar a si mesmo
    if (userId === dto.evaluatedUserId) {
      throw new BadRequestException('Não é possível avaliar a si mesmo na avaliação 360');
    }

    // Verificar se já existe uma avaliação 360 para este usuário neste ciclo
    const existingAssessment = await this.prisma.assessment360.findFirst({
      where: {
        authorId: userId,
        evaluatedUserId: dto.evaluatedUserId,
        cycle: dto.cycle
      }
    });

    if (existingAssessment) {
      throw new BadRequestException(`Já existe uma avaliação 360 para este usuário no ciclo ${dto.cycle}`);
    }

    // Criar a avaliação 360
    const assessment360 = await this.prisma.assessment360.create({
      data: {
        authorId: userId,
        cycle: dto.cycle,
        status: 'DRAFT',
        evaluatedUserId: dto.evaluatedUserId,
        overallScore: dto.overallScore,
        strengths: dto.strengths,
        improvements: dto.improvements
      }
    });

    return assessment360;
  }

  /**
   * Cria uma avaliação de mentoring
   */
  async createMentoringAssessment(userId: string, dto: CreateMentoringAssessmentDto) {
    // Verificar se o mentor existe
    const mentor = await this.prisma.user.findUnique({
      where: { id: dto.mentorId }
    });

    if (!mentor) {
      throw new NotFoundException('Mentor não encontrado');
    }

    // Verificar se já existe uma avaliação de mentoring para este mentor neste ciclo
    const existingAssessment = await this.prisma.mentoringAssessment.findFirst({
      where: {
        authorId: userId,
        mentorId: dto.mentorId,
        cycle: dto.cycle
      }
    });

    if (existingAssessment) {
      throw new BadRequestException(`Já existe uma avaliação de mentoring para este mentor no ciclo ${dto.cycle}`);
    }

    // Criar a avaliação de mentoring
    const mentoringAssessment = await this.prisma.mentoringAssessment.create({
      data: {
        authorId: userId,
        cycle: dto.cycle,
        status: 'DRAFT',
        mentorId: dto.mentorId,
        score: dto.score,
        justification: dto.justification
      }
    });

    return mentoringAssessment;
  }

  /**
   * Cria um feedback de referência
   */
  async createReferenceFeedback(userId: string, dto: CreateReferenceFeedbackDto) {
    // Verificar se o usuário referenciado existe
    const referencedUser = await this.prisma.user.findUnique({
      where: { id: dto.referencedUserId }
    });

    if (!referencedUser) {
      throw new NotFoundException('Usuário referenciado não encontrado');
    }

    // Verificar se não está tentando referenciar a si mesmo
    if (userId === dto.referencedUserId) {
      throw new BadRequestException('Não é possível referenciar a si mesmo');
    }

    // Verificar se já existe um feedback de referência para este usuário neste ciclo
    const existingFeedback = await this.prisma.referenceFeedback.findFirst({
      where: {
        authorId: userId,
        referencedUserId: dto.referencedUserId,
        cycle: dto.cycle
      }
    });

    if (existingFeedback) {
      throw new BadRequestException(`Já existe um feedback de referência para este usuário no ciclo ${dto.cycle}`);
    }

    // Criar o feedback de referência
    const referenceFeedback = await this.prisma.referenceFeedback.create({
      data: {
        authorId: userId,
        cycle: dto.cycle,
        status: 'DRAFT',
        referencedUserId: dto.referencedUserId,
        justification: dto.justification
      }
    });

    return referenceFeedback;
  }

  /**
   * Busca todas as avaliações de um usuário para um ciclo específico
   */
  async getUserEvaluationsByCycle(userId: string, cycle: string) {
    const [selfAssessment, assessments360, mentoringAssessments, referenceFeedbacks] = await Promise.all([
      // Autoavaliação
      this.prisma.selfAssessment.findFirst({
        where: { authorId: userId, cycle },
        include: { answers: true }
      }),

      // Avaliações 360
      this.prisma.assessment360.findMany({
        where: { authorId: userId, cycle },
        include: {
          evaluatedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      }),

      // Avaliações de mentoring
      this.prisma.mentoringAssessment.findMany({
        where: { authorId: userId, cycle },
        include: {
          mentor: {
            select: { id: true, name: true, email: true }
          }
        }
      }),

      // Feedbacks de referência
      this.prisma.referenceFeedback.findMany({
        where: { authorId: userId, cycle },
        include: {
          referencedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      })
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
        referenceFeedbacksCount: referenceFeedbacks.length
      }
    };
  }
} 