import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EvaluationsService } from './evaluations.service';
import { PrismaService } from '../database/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CyclesService } from './cycles/cycles.service';

describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let prismaService: any;
  let projectsService: any;
  let cyclesService: any;

  // Mock data
  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao@forrocket.com',
    jobTitle: 'Desenvolvedor',
    seniority: 'SENIOR',
  };

  const mockEvaluatedUser = {
    id: 'user-2',
    name: 'Maria Santos',
    email: 'maria@forrocket.com',
    jobTitle: 'Designer',
    seniority: 'PLENO',
  };

  const mockActiveCycle = {
    id: 'cycle-1',
    name: '2024-Q1',
    phase: 'ASSESSMENTS' as const,
    status: 'OPEN',
  };

  const mockSelfAssessmentDto = {
    sentimentoDeDonoScore: 4,
    sentimentoDeDonoJustification: 'Demonstro responsabilidade pelos resultados',
    resilienciaAdversidadesScore: 4,
    resilienciaAdversidadesJustification: 'Mantenho-me firme diante de desafios',
    organizacaoTrabalhoScore: 5,
    organizacaoTrabalhoJustification: 'Mantenho organização pessoal',
    capacidadeAprenderScore: 5,
    capacidadeAprenderJustification: 'Demonstro curiosidade e busco conhecimento',
    teamPlayerScore: 5,
    teamPlayerJustification: 'Trabalho bem em equipe',
    entregarQualidadeScore: 4,
    entregarQualidadeJustification: 'Entrego trabalhos com alta qualidade',
    atenderPrazosScore: 4,
    atenderPrazosJustification: 'Cumpro prazos estabelecidos',
    fazerMaisMenosScore: 4,
    fazerMaisMenosJustification: 'Otimizo recursos',
    pensarForaCaixaScore: 3,
    pensarForaCaixaJustification: 'Demonstro criatividade',
    gestaoGenteScore: 3,
    gestaoGenteJustification: 'Desenvolvo pessoas',
    gestaoResultadosScore: 4,
    gestaoResultadosJustification: 'Foco na entrega de resultados',
    evolucaoRocketScore: 4,
    evolucaoRocketJustification: 'Contribuo para o crescimento da empresa',
  };

  const mock360AssessmentDto = {
    evaluatedUserId: 'user-2',
    overallScore: 4,
    strengths: 'Excelente comunicação e conhecimento técnico',
    improvements: 'Poderia ser mais proativo em reuniões',
  };

  const mockMentoringAssessmentDto = {
    mentorId: 'mentor-1',
    score: 5,
    justification: 'Excelente mentor, sempre disponível para ajudar',
  };

  const mockReferenceFeedbackDto = {
    referencedUserId: 'user-2',
    topic: 'Liderança',
    justification: 'Demonstra grande capacidade de liderança',
  };

  const mockManagerAssessmentDto = {
    evaluatedUserId: 'user-2',
    sentimentoDeDonoScore: 4,
    sentimentoDeDonoJustification: 'Funcionário responsável',
    resilienciaAdversidadesScore: 4,
    resilienciaAdversidadesJustification: 'Lida bem com pressão',
    organizacaoTrabalhoScore: 5,
    organizacaoTrabalhoJustification: 'Muito organizado',
    capacidadeAprenderScore: 5,
    capacidadeAprenderJustification: 'Aprende rapidamente',
    teamPlayerScore: 5,
    teamPlayerJustification: 'Colaborativo',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      selfAssessment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      assessment360: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      mentoringAssessment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      referenceFeedback: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      managerAssessment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      committeeAssessment: {
        findMany: jest.fn(),
      },
    };

    const mockProjectsService = {
      canEvaluateUserIn360: jest.fn(),
      canEvaluateUserInMentoring: jest.fn(),
      isManager: jest.fn(),
      canManagerEvaluateUser: jest.fn(),
    };

    const mockCyclesService = {
      validateActiveCyclePhase: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: CyclesService,
          useValue: mockCyclesService,
        },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
    prismaService = module.get(PrismaService);
    projectsService = module.get(ProjectsService);
    cyclesService = module.get(CyclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitAssessment', () => {
    it('deve submeter uma autoavaliação com sucesso', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        status: 'DRAFT',
      };

      const mockUpdatedAssessment = {
        ...mockAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      };

      prismaService.selfAssessment.findUnique.mockResolvedValue(mockAssessment);
      prismaService.selfAssessment.update.mockResolvedValue(mockUpdatedAssessment);

      const result = await service.submitAssessment('assessment-1', 'user-1', 'self');

      expect(prismaService.selfAssessment.findUnique).toHaveBeenCalledWith({
        where: { id: 'assessment-1', authorId: 'user-1' },
      });
      expect(prismaService.selfAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedAssessment);
    });

    it('deve submeter uma avaliação 360 com sucesso', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        status: 'DRAFT',
      };

      prismaService.assessment360.findUnique.mockResolvedValue(mockAssessment);
      prismaService.assessment360.update.mockResolvedValue({
        ...mockAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const result = await service.submitAssessment('assessment-1', 'user-1', '360');

      expect(prismaService.assessment360.findUnique).toHaveBeenCalledWith({
        where: { id: 'assessment-1', authorId: 'user-1' },
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('deve submeter uma avaliação de mentoring com sucesso', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        status: 'DRAFT',
      };

      prismaService.mentoringAssessment.findUnique.mockResolvedValue(mockAssessment);
      prismaService.mentoringAssessment.update.mockResolvedValue({
        ...mockAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const result = await service.submitAssessment('assessment-1', 'user-1', 'mentoring');

      expect(prismaService.mentoringAssessment.findUnique).toHaveBeenCalledWith({
        where: { id: 'assessment-1', authorId: 'user-1' },
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('deve submeter um feedback de referência com sucesso', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        status: 'DRAFT',
      };

      prismaService.referenceFeedback.findUnique.mockResolvedValue(mockAssessment);
      prismaService.referenceFeedback.update.mockResolvedValue({
        ...mockAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const result = await service.submitAssessment('assessment-1', 'user-1', 'reference');

      expect(prismaService.referenceFeedback.findUnique).toHaveBeenCalledWith({
        where: { id: 'assessment-1', authorId: 'user-1' },
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('deve lançar NotFoundException quando avaliação não for encontrada', async () => {
      prismaService.selfAssessment.findUnique.mockResolvedValue(null);

      await expect(service.submitAssessment('assessment-1', 'user-1', 'self')).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.selfAssessment.findUnique).toHaveBeenCalledWith({
        where: { id: 'assessment-1', authorId: 'user-1' },
      });
    });

    it('deve lançar BadRequestException quando avaliação já foi submetida', async () => {
      const mockSubmittedAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        status: 'SUBMITTED',
      };

      prismaService.selfAssessment.findUnique.mockResolvedValue(mockSubmittedAssessment);

      await expect(service.submitAssessment('assessment-1', 'user-1', 'self')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException para tipo de avaliação inválido', async () => {
      await expect(
        service.submitAssessment('assessment-1', 'user-1', 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSelfAssessment', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve criar autoavaliação com sucesso', async () => {
      const mockCreatedAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        cycle: '2024-Q1',
        status: 'DRAFT',
        answers: [],
      };

      prismaService.selfAssessment.findFirst.mockResolvedValue(null);
      prismaService.selfAssessment.create.mockResolvedValue(mockCreatedAssessment);

      const result = await service.createSelfAssessment('user-1', mockSelfAssessmentDto);

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('ASSESSMENTS');
      expect(prismaService.selfAssessment.findFirst).toHaveBeenCalledWith({
        where: {
          authorId: 'user-1',
          cycle: '2024-Q1',
        },
      });
      expect(prismaService.selfAssessment.create).toHaveBeenCalledWith({
        data: {
          authorId: 'user-1',
          cycle: '2024-Q1',
          status: 'DRAFT',
          answers: {
            create: expect.arrayContaining([
              expect.objectContaining({
                criterionId: 'sentimento-de-dono',
                score: 4,
                justification: 'Demonstro responsabilidade pelos resultados',
              }),
            ]),
          },
        },
        include: {
          answers: true,
        },
      });
      expect(result).toEqual(mockCreatedAssessment);
    });

    it('deve lançar BadRequestException quando já existe autoavaliação para o ciclo', async () => {
      const existingAssessment = {
        id: 'existing-1',
        authorId: 'user-1',
        cycle: '2024-Q1',
      };

      prismaService.selfAssessment.findFirst.mockResolvedValue(existingAssessment);

      await expect(service.createSelfAssessment('user-1', mockSelfAssessmentDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('ASSESSMENTS');
    });
  });

  describe('create360Assessment', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(mockActiveCycle);
      prismaService.user.findUnique.mockResolvedValue(mockEvaluatedUser);
      projectsService.canEvaluateUserIn360.mockResolvedValue(true);
    });

    it('deve criar avaliação 360 com sucesso', async () => {
      const mockCreated360 = {
        id: 'assessment-360-1',
        authorId: 'user-1',
        evaluatedUserId: 'user-2',
        cycle: '2024-Q1',
        status: 'DRAFT',
        overallScore: 4,
        strengths: 'Excelente comunicação',
        improvements: 'Ser mais proativo',
      };

      prismaService.assessment360.findFirst.mockResolvedValue(null);
      prismaService.assessment360.create.mockResolvedValue(mockCreated360);

      const result = await service.create360Assessment('user-1', mock360AssessmentDto);

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('ASSESSMENTS');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
      });
      expect(projectsService.canEvaluateUserIn360).toHaveBeenCalledWith('user-1', 'user-2');
      expect(prismaService.assessment360.create).toHaveBeenCalledWith({
        data: {
          authorId: 'user-1',
          cycle: '2024-Q1',
          status: 'DRAFT',
          evaluatedUserId: 'user-2',
          overallScore: 4,
          strengths: 'Excelente comunicação e conhecimento técnico',
          improvements: 'Poderia ser mais proativo em reuniões',
        },
      });
      expect(result).toEqual(mockCreated360);
    });

    it('deve lançar NotFoundException quando usuário avaliado não existir', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create360Assessment('user-1', mock360AssessmentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando tentar avaliar a si mesmo', async () => {
      const dtoSelfEvaluation = { ...mock360AssessmentDto, evaluatedUserId: 'user-1' };

      await expect(service.create360Assessment('user-1', dtoSelfEvaluation)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar ForbiddenException quando não puder avaliar o usuário', async () => {
      projectsService.canEvaluateUserIn360.mockResolvedValue(false);

      await expect(service.create360Assessment('user-1', mock360AssessmentDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar BadRequestException quando já existir avaliação 360 para o usuário no ciclo', async () => {
      const existingAssessment = {
        id: 'existing-360-1',
        authorId: 'user-1',
        evaluatedUserId: 'user-2',
        cycle: '2024-Q1',
      };

      prismaService.assessment360.findFirst.mockResolvedValue(existingAssessment);

      await expect(service.create360Assessment('user-1', mock360AssessmentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createMentoringAssessment', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(mockActiveCycle);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      projectsService.canEvaluateUserInMentoring.mockResolvedValue(true);
    });

    it('deve criar avaliação de mentoring com sucesso', async () => {
      const mockCreatedMentoring = {
        id: 'mentoring-1',
        authorId: 'user-1',
        mentorId: 'mentor-1',
        cycle: '2024-Q1',
        status: 'DRAFT',
        score: 5,
        justification: 'Excelente mentor',
      };

      prismaService.mentoringAssessment.findFirst.mockResolvedValue(null);
      prismaService.mentoringAssessment.create.mockResolvedValue(mockCreatedMentoring);

      const result = await service.createMentoringAssessment('user-1', mockMentoringAssessmentDto);

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('ASSESSMENTS');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'mentor-1' },
      });
      expect(projectsService.canEvaluateUserInMentoring).toHaveBeenCalledWith('user-1', 'mentor-1');
      expect(prismaService.mentoringAssessment.create).toHaveBeenCalledWith({
        data: {
          authorId: 'user-1',
          cycle: '2024-Q1',
          status: 'DRAFT',
          mentorId: 'mentor-1',
          score: 5,
          justification: 'Excelente mentor, sempre disponível para ajudar',
        },
      });
      expect(result).toEqual(mockCreatedMentoring);
    });

    it('deve lançar NotFoundException quando mentor não existir', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createMentoringAssessment('user-1', mockMentoringAssessmentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando não puder avaliar o mentor', async () => {
      projectsService.canEvaluateUserInMentoring.mockResolvedValue(false);

      await expect(
        service.createMentoringAssessment('user-1', mockMentoringAssessmentDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar BadRequestException quando já existir avaliação de mentoring para o mentor no ciclo', async () => {
      const existingAssessment = {
        id: 'existing-mentoring-1',
        authorId: 'user-1',
        mentorId: 'mentor-1',
        cycle: '2024-Q1',
      };

      prismaService.mentoringAssessment.findFirst.mockResolvedValue(existingAssessment);

      await expect(
        service.createMentoringAssessment('user-1', mockMentoringAssessmentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createReferenceFeedback', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(mockActiveCycle);
      prismaService.user.findUnique.mockResolvedValue(mockEvaluatedUser);
    });

    it('deve criar feedback de referência com sucesso', async () => {
      const mockCreatedReference = {
        id: 'reference-1',
        authorId: 'user-1',
        referencedUserId: 'user-2',
        cycle: '2024-Q1',
        status: 'DRAFT',
        topic: 'Liderança',
        justification: 'Demonstra grande capacidade de liderança',
      };

      prismaService.referenceFeedback.findFirst.mockResolvedValue(null);
      prismaService.referenceFeedback.create.mockResolvedValue(mockCreatedReference);

      const result = await service.createReferenceFeedback('user-1', mockReferenceFeedbackDto);

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('ASSESSMENTS');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
      });
      expect(prismaService.referenceFeedback.create).toHaveBeenCalledWith({
        data: {
          authorId: 'user-1',
          cycle: '2024-Q1',
          status: 'DRAFT',
          referencedUserId: 'user-2',
          topic: 'Liderança',
          justification: 'Demonstra grande capacidade de liderança',
        },
      });
      expect(result).toEqual(mockCreatedReference);
    });

    it('deve lançar NotFoundException quando usuário referenciado não existir', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createReferenceFeedback('user-1', mockReferenceFeedbackDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando tentar referenciar a si mesmo', async () => {
      const dtoSelfReference = { ...mockReferenceFeedbackDto, referencedUserId: 'user-1' };

      await expect(service.createReferenceFeedback('user-1', dtoSelfReference)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando já existir feedback de referência para o usuário no ciclo', async () => {
      const existingFeedback = {
        id: 'existing-reference-1',
        authorId: 'user-1',
        referencedUserId: 'user-2',
        cycle: '2024-Q1',
      };

      prismaService.referenceFeedback.findFirst.mockResolvedValue(existingFeedback);

      await expect(
        service.createReferenceFeedback('user-1', mockReferenceFeedbackDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createManagerAssessment', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue({
        ...mockActiveCycle,
        phase: 'MANAGER_REVIEWS' as const,
      });
      projectsService.isManager.mockResolvedValue(true);
      projectsService.canManagerEvaluateUser.mockResolvedValue(true);
    });

    it('deve criar avaliação de gestor com sucesso', async () => {
      const mockCreatedManagerAssessment = {
        id: 'manager-assessment-1',
        authorId: 'manager-1',
        evaluatedUserId: 'user-2',
        cycle: '2024-Q1',
        status: 'DRAFT',
        answers: [],
        evaluatedUser: mockEvaluatedUser,
      };

      prismaService.managerAssessment.findFirst.mockResolvedValue(null);
      prismaService.managerAssessment.create.mockResolvedValue(mockCreatedManagerAssessment);

      const result = await service.createManagerAssessment('manager-1', mockManagerAssessmentDto);

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('MANAGER_REVIEWS');
      expect(projectsService.isManager).toHaveBeenCalledWith('manager-1');
      expect(projectsService.canManagerEvaluateUser).toHaveBeenCalledWith('manager-1', 'user-2');
      expect(prismaService.managerAssessment.create).toHaveBeenCalledWith({
        data: {
          authorId: 'manager-1',
          evaluatedUserId: 'user-2',
          cycle: '2024-Q1',
          status: 'DRAFT',
          answers: {
            create: expect.arrayContaining([
              expect.objectContaining({
                criterionId: 'sentimento-de-dono',
                score: 4,
                justification: 'Funcionário responsável',
              }),
            ]),
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
      expect(result).toEqual(mockCreatedManagerAssessment);
    });

    it('deve lançar ForbiddenException quando usuário não for gestor', async () => {
      projectsService.isManager.mockResolvedValue(false);

      await expect(
        service.createManagerAssessment('user-1', mockManagerAssessmentDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException quando gestor não puder avaliar o usuário', async () => {
      projectsService.canManagerEvaluateUser.mockResolvedValue(false);

      await expect(
        service.createManagerAssessment('manager-1', mockManagerAssessmentDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar BadRequestException quando já existir avaliação para o liderado no ciclo', async () => {
      const existingAssessment = {
        id: 'existing-manager-1',
        authorId: 'manager-1',
        evaluatedUserId: 'user-2',
        cycle: '2024-Q1',
      };

      prismaService.managerAssessment.findFirst.mockResolvedValue(existingAssessment);

      await expect(
        service.createManagerAssessment('manager-1', mockManagerAssessmentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReceivedEvaluationsByCycle', () => {
    it('deve buscar todas as avaliações recebidas por um usuário', async () => {
      const mockReceivedData = {
        assessments360Received: [{ id: '360-1', authorId: 'user-1' }],
        mentoringAssessmentsReceived: [{ id: 'mentoring-1', authorId: 'user-1' }],
        referenceFeedbacksReceived: [{ id: 'reference-1', authorId: 'user-1' }],
        managerAssessmentsReceived: [{ id: 'manager-1', authorId: 'manager-1' }],
        committeeAssessmentsReceived: [{ id: 'committee-1', authorId: 'committee-1' }],
      };

      prismaService.assessment360.findMany.mockResolvedValue(
        mockReceivedData.assessments360Received,
      );
      prismaService.mentoringAssessment.findMany.mockResolvedValue(
        mockReceivedData.mentoringAssessmentsReceived,
      );
      prismaService.referenceFeedback.findMany.mockResolvedValue(
        mockReceivedData.referenceFeedbacksReceived,
      );
      prismaService.managerAssessment.findMany.mockResolvedValue(
        mockReceivedData.managerAssessmentsReceived,
      );
      prismaService.committeeAssessment.findMany.mockResolvedValue(
        mockReceivedData.committeeAssessmentsReceived,
      );

      const result = await service.getReceivedEvaluationsByCycle('user-2', '2024-Q1');

      expect(result.cycle).toBe('2024-Q1');
      expect(result.assessments360Received).toEqual(mockReceivedData.assessments360Received);
      expect(result.mentoringAssessmentsReceived).toEqual(
        mockReceivedData.mentoringAssessmentsReceived,
      );
      expect(result.referenceFeedbacksReceived).toEqual(
        mockReceivedData.referenceFeedbacksReceived,
      );
      expect(result.managerAssessmentsReceived).toEqual(
        mockReceivedData.managerAssessmentsReceived,
      );
      expect(result.committeeAssessmentsReceived).toEqual(
        mockReceivedData.committeeAssessmentsReceived,
      );
      expect(result.summary.totalReceivedCount).toBe(5);
    });
  });

  describe('getUserEvaluationsByCycle', () => {
    it('deve buscar todas as avaliações feitas por um usuário', async () => {
      const mockUserData = {
        selfAssessment: { id: 'self-1', authorId: 'user-1' },
        assessments360: [{ id: '360-1', authorId: 'user-1' }],
        mentoringAssessments: [{ id: 'mentoring-1', authorId: 'user-1' }],
        referenceFeedbacks: [{ id: 'reference-1', authorId: 'user-1' }],
        managerAssessments: [{ id: 'manager-1', authorId: 'user-1' }],
      };

      prismaService.selfAssessment.findFirst.mockResolvedValue(mockUserData.selfAssessment);
      prismaService.assessment360.findMany.mockResolvedValue(mockUserData.assessments360);
      prismaService.mentoringAssessment.findMany.mockResolvedValue(
        mockUserData.mentoringAssessments,
      );
      prismaService.referenceFeedback.findMany.mockResolvedValue(mockUserData.referenceFeedbacks);
      prismaService.managerAssessment.findMany.mockResolvedValue(mockUserData.managerAssessments);

      const result = await service.getUserEvaluationsByCycle('user-1', '2024-Q1');

      expect(result.cycle).toBe('2024-Q1');
      expect(result.selfAssessment).toEqual(mockUserData.selfAssessment);
      expect(result.assessments360).toEqual(mockUserData.assessments360);
      expect(result.mentoringAssessments).toEqual(mockUserData.mentoringAssessments);
      expect(result.referenceFeedbacks).toEqual(mockUserData.referenceFeedbacks);
      expect(result.managerAssessments).toEqual(mockUserData.managerAssessments);
      expect(result.summary.selfAssessmentCompleted).toBe(true);
      expect(result.summary.assessments360Count).toBe(1);
      expect(result.summary.mentoringAssessmentsCount).toBe(1);
      expect(result.summary.referenceFeedbacksCount).toBe(1);
      expect(result.summary.managerAssessmentsCount).toBe(1);
    });

    it('deve retornar dados vazios quando usuário não tiver avaliações', async () => {
      prismaService.selfAssessment.findFirst.mockResolvedValue(null);
      prismaService.assessment360.findMany.mockResolvedValue([]);
      prismaService.mentoringAssessment.findMany.mockResolvedValue([]);
      prismaService.referenceFeedback.findMany.mockResolvedValue([]);
      prismaService.managerAssessment.findMany.mockResolvedValue([]);

      const result = await service.getUserEvaluationsByCycle('user-1', '2024-Q1');

      expect(result.cycle).toBe('2024-Q1');
      expect(result.selfAssessment).toBeNull();
      expect(result.assessments360).toEqual([]);
      expect(result.summary.selfAssessmentCompleted).toBe(false);
      expect(result.summary.assessments360Count).toBe(0);
    });
  });
});
