import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CommitteeService } from './committee.service';
import { PrismaService } from '../../database/prisma.service';
import { CyclesService } from '../cycles/cycles.service';
import {
  CreateCommitteeAssessmentDto,
  UpdateCommitteeAssessmentDto,
} from './dto/committee-assessment.dto';

describe('CommitteeService', () => {
  let service: CommitteeService;
  let prismaService: any;
  let cyclesService: any;

  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    jobTitle: 'Desenvolvedor Full Stack',
    seniority: 'Pleno',
    careerTrack: 'Tech',
    businessUnit: 'Engineering',
    isActive: true,
    roles: '["colaborador"]',
  };

  const mockCommitteeMember = {
    id: 'committee-1',
    name: 'Ana Souza',
    email: 'ana.souza@rocketcorp.com',
    roles: '["comite"]',
  };

  const mockActiveCycle = {
    id: 'cycle-1',
    name: 'Q1 2024',
    status: 'OPEN',
    phase: 'EQUALIZATION',
  };

  const mockCommitteeAssessment = {
    id: 'assessment-1',
    authorId: 'committee-1',
    evaluatedUserId: 'user-1',
    cycle: 'Q1 2024',
    finalScore: 4,
    justification: 'Justificativa detalhada',
    observations: 'Observações adicionais',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    submittedAt: null,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      committeeAssessment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      selfAssessment: {
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      assessment360: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      managerAssessment: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      mentoringAssessment: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      referenceFeedback: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      genAISummary: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockCyclesService = {
      validateActiveCyclePhase: jest.fn(),
      getActiveCycleWithPhase: jest.fn(),
      getActiveCycle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitteeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CyclesService, useValue: mockCyclesService },
      ],
    }).compile();

    service = module.get<CommitteeService>(CommitteeService);
    prismaService = module.get(PrismaService);
    cyclesService = module.get(CyclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCommitteeMember', () => {
    it('deve aceitar usuário com role comite', () => {
      expect(() => {
        (service as any).validateCommitteeMember('["comite"]');
      }).not.toThrow();
    });

    it('deve aceitar usuário com role COMMITTEE', () => {
      expect(() => {
        (service as any).validateCommitteeMember('["COMMITTEE"]');
      }).not.toThrow();
    });

    it('deve lançar ForbiddenException para usuário sem role de comitê', () => {
      expect(() => {
        (service as any).validateCommitteeMember('["colaborador"]');
      }).toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException para roles vazias', () => {
      expect(() => {
        (service as any).validateCommitteeMember('[]');
      }).toThrow(ForbiddenException);
    });

    it('deve lidar com array de roles ao invés de string', () => {
      expect(() => {
        (service as any).validateCommitteeMember(['comite']);
      }).not.toThrow();
    });
  });

  describe('getCollaboratorsForEqualization', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(undefined);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve retornar colaboradores para equalização', async () => {
      const mockCollaborators = [mockUser];
      const mockCommitteeAssessments = [];

      prismaService.user.findMany.mockResolvedValue(mockCollaborators);
      prismaService.committeeAssessment.findMany.mockResolvedValue(mockCommitteeAssessments);

      const result = await service.getCollaboratorsForEqualization();

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('EQUALIZATION');
      expect(result.cycle).toBe('Q1 2024');
      expect(result.collaborators).toHaveLength(1);
      expect(result.collaborators[0].hasCommitteeAssessment).toBe(false);
      expect(result.summary.totalCollaborators).toBe(1);
      expect(result.summary.pendingEqualization).toBe(1);
    });

    it('deve mapear corretamente colaboradores com avaliações existentes', async () => {
      const mockCollaborators = [mockUser];
      const mockCommitteeAssessments = [
        {
          ...mockCommitteeAssessment,
          evaluatedUserId: 'user-1',
          author: mockCommitteeMember,
        },
      ];

      prismaService.user.findMany.mockResolvedValue(mockCollaborators);
      prismaService.committeeAssessment.findMany.mockResolvedValue(mockCommitteeAssessments);

      const result = await service.getCollaboratorsForEqualization();

      expect(result.collaborators[0].hasCommitteeAssessment).toBe(true);
      expect(result.collaborators[0].committeeAssessment).toBeDefined();
      expect(result.summary.withCommitteeAssessment).toBe(1);
      expect(result.summary.pendingEqualization).toBe(0);
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.getCollaboratorsForEqualization()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCollaboratorEvaluationSummary', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(undefined);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve retornar resumo completo de avaliações do colaborador', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.selfAssessment.findFirst.mockResolvedValue(null);
      prismaService.assessment360.findMany.mockResolvedValue([]);
      prismaService.managerAssessment.findMany.mockResolvedValue([]);
      prismaService.mentoringAssessment.findMany.mockResolvedValue([]);
      prismaService.referenceFeedback.findMany.mockResolvedValue([]);
      prismaService.committeeAssessment.findFirst.mockResolvedValue(null);

      const result = await service.getCollaboratorEvaluationSummary('user-1');

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('EQUALIZATION');
      expect(result.collaborator).toEqual(mockUser);
      expect(result.cycle).toBe('Q1 2024');
      expect(result.summary.totalAssessmentsReceived).toBe(0);
      expect(result.summary.hasCommitteeAssessment).toBe(false);
    });

    it('deve lançar NotFoundException quando colaborador não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getCollaboratorEvaluationSummary('invalid-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.getCollaboratorEvaluationSummary('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createCommitteeAssessment', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(undefined);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve criar avaliação de comitê com sucesso', async () => {
      const mockAssessment = {
        ...mockCommitteeAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        justification: 'Avaliação baseada no conjunto de avaliações recebidas.',
        observations: 'Colaborador com bom desempenho geral.',
      };
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      prismaService.user.findMany.mockResolvedValue([mockUser]);
      prismaService.committeeAssessment.findFirst.mockResolvedValue(null);
      prismaService.committeeAssessment.create.mockResolvedValue(mockAssessment);

      const result = await service.createCommitteeAssessment('committee-1', {
        evaluatedUserId: 'user-1',
        finalScore: 4,
        justification: 'Avaliação baseada no conjunto de avaliações recebidas.',
        observations: 'Colaborador com bom desempenho geral.',
      });

      expect(result).toEqual(mockAssessment);
      expect(prismaService.committeeAssessment.create).toHaveBeenCalledWith({
        data: {
          authorId: 'committee-1',
          evaluatedUserId: 'user-1',
          cycle: 'Q1 2024',
          finalScore: 4,
          justification: 'Avaliação baseada no conjunto de avaliações recebidas.',
          observations: 'Colaborador com bom desempenho geral.',
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
        include: {
          author: { select: { email: true, name: true, id: true } },
          evaluatedUser: { select: { email: true, name: true, id: true, jobTitle: true, seniority: true } },
        },
      });
    });

    it('deve lançar NotFoundException quando autor não existe', async () => {
      const createDto: CreateCommitteeAssessmentDto = {
        evaluatedUserId: 'user-1',
        finalScore: 4,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createCommitteeAssessment('invalid-user', createDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não é membro do comitê', async () => {
      const createDto: CreateCommitteeAssessmentDto = {
        evaluatedUserId: 'user-1',
        finalScore: 4,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.createCommitteeAssessment('user-1', createDto)).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException quando colaborador não existe', async () => {
      const createDto: CreateCommitteeAssessmentDto = {
        evaluatedUserId: 'invalid-user',
        finalScore: 4,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(mockCommitteeMember)
        .mockResolvedValueOnce(null);

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando já existe avaliação para o colaborador', async () => {
      const createDto: CreateCommitteeAssessmentDto = {
        evaluatedUserId: 'user-1',
        finalScore: 4,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      prismaService.committeeAssessment.findFirst.mockResolvedValue(mockCommitteeAssessment);

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      const createDto: CreateCommitteeAssessmentDto = {
        evaluatedUserId: 'user-1',
        finalScore: 4,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCommitteeAssessment', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(undefined);
    });

    it('deve atualizar avaliação de comitê com sucesso', async () => {
      const updateDto: UpdateCommitteeAssessmentDto = {
        finalScore: 5,
        justification: 'Avaliação ajustada após revisão.',
        observations: 'Excelente performance em todos os critérios.',
      };

      const updatedAssessment = { ...mockCommitteeAssessment, ...updateDto };

      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      prismaService.committeeAssessment.update.mockResolvedValue(updatedAssessment);

      const result = await service.updateCommitteeAssessment('assessment-1', 'committee-1', updateDto);

      expect(result).toEqual(updatedAssessment);
      expect(prismaService.committeeAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: expect.objectContaining(updateDto),
        include: {
          author: { select: { id: true, name: true, email: true } },
          evaluatedUser: { select: { id: true, name: true, email: true, jobTitle: true, seniority: true } },
        },
      });
    });

    it('deve lançar NotFoundException quando avaliação não existe', async () => {
      const updateDto: UpdateCommitteeAssessmentDto = {
        finalScore: 5,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.committeeAssessment.findUnique.mockResolvedValue(null);

      await expect(service.updateCommitteeAssessment('invalid-id', 'committee-1', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não é membro do comitê', async () => {
      const updateDto: UpdateCommitteeAssessmentDto = {
        finalScore: 5,
        justification: 'Justificativa',
        observations: 'Observações',
      };

      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.updateCommitteeAssessment('assessment-1', 'user-1', updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitCommitteeAssessment', () => {
    it('deve submeter avaliação de comitê com sucesso', async () => {
      const submittedAssessment = { ...mockCommitteeAssessment, status: 'SUBMITTED', submittedAt: new Date() };

      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      prismaService.committeeAssessment.update.mockResolvedValue(submittedAssessment);

      const result = await service.submitCommitteeAssessment('assessment-1', 'committee-1');

      expect(result).toEqual(submittedAssessment);
      expect(prismaService.committeeAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
          evaluatedUser: { select: { id: true, name: true, email: true, jobTitle: true, seniority: true } },
        },
      });
    });

    it('deve lançar NotFoundException quando avaliação não existe', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(null);

      await expect(service.submitCommitteeAssessment('invalid-id', 'committee-1')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando avaliação já foi submetida', async () => {
      const submittedAssessment = { ...mockCommitteeAssessment, status: 'SUBMITTED' };

      prismaService.committeeAssessment.findUnique.mockResolvedValue(submittedAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);

      await expect(service.submitCommitteeAssessment('assessment-1', 'committee-1')).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ForbiddenException quando usuário não é membro do comitê', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.submitCommitteeAssessment('assessment-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCommitteeMetrics', () => {
    beforeEach(() => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve retornar métricas do comitê', async () => {
      const mockMetrics = {
        cycle: 'Q1 2024',
        phase: 'EQUALIZATION',
        deadlines: {
          assessment: undefined,
          manager: undefined,
          equalization: undefined,
          daysRemaining: null,
        },
        metrics: {
          totalCollaborators: 50,
          counts: {
            selfAssessments: 42,
            assessments360: 60,
            managerAssessments: 45,
            committeeAssessments: 30,
          },
          selfAssessmentCompletion: 84,
          assessment360Completion: 120,
          managerAssessmentCompletion: 90,
          committeeAssessmentCompletion: 60,
        },
      };
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
      prismaService.user.count.mockResolvedValue(50);
      prismaService.selfAssessment.count.mockResolvedValue(42);
      prismaService.assessment360.count.mockResolvedValue(60);
      prismaService.managerAssessment.count.mockResolvedValue(45);
      prismaService.committeeAssessment.count.mockResolvedValue(30);

      const result = await service.getCommitteeMetrics();

      expect(result).toEqual(mockMetrics);
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.getCommitteeMetrics()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCommitteeAssessmentsByCycle', () => {
    beforeEach(() => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve retornar avaliações de comitê do ciclo ativo', async () => {
      const mockAssessments = [mockCommitteeAssessment];
      const expectedResult = {
        cycle: 'Q1 2024',
        phase: 'EQUALIZATION',
        assessments: mockAssessments,
        summary: {
          total: 1,
          draft: 1,
          submitted: 0,
        },
      };

      prismaService.committeeAssessment.findMany.mockResolvedValue(mockAssessments);

      const result = await service.getCommitteeAssessmentsByCycle();

      expect(result).toEqual(expectedResult);
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.getCommitteeAssessmentsByCycle()).rejects.toThrow(BadRequestException);
    });

    it('deve calcular corretamente o resumo de status', async () => {
      const mockAssessments = [
        { ...mockCommitteeAssessment, status: 'DRAFT' },
        { ...mockCommitteeAssessment, id: 'assessment-2', status: 'SUBMITTED' },
      ];

      prismaService.committeeAssessment.findMany.mockResolvedValue(mockAssessments);

      const result = await service.getCommitteeAssessmentsByCycle();

      expect(result.summary.total).toBe(2);
      expect(result.summary.draft).toBe(1);
      expect(result.summary.submitted).toBe(1);
      expect(result.summary.submitted).toBe(1);
    });
  });

  describe('exportCollaboratorEvaluationData', () => {
    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(undefined);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve exportar dados de avaliação do colaborador', async () => {
      cyclesService.getActiveCycle.mockResolvedValue(mockActiveCycle);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.selfAssessment.findFirst.mockResolvedValue(null);
      prismaService.assessment360.findMany.mockResolvedValue([]);
      prismaService.managerAssessment.findMany.mockResolvedValue([]);
      prismaService.mentoringAssessment.findMany.mockResolvedValue([]);
      prismaService.referenceFeedback.findMany.mockResolvedValue([]);
      // Não retorna committeeAssessment, para simular equalização não concluída
      prismaService.committeeAssessment.findFirst.mockResolvedValue(null);

      await expect(service.exportCollaboratorEvaluationData('user-1')).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException quando colaborador não existe', async () => {
      cyclesService.getActiveCycle.mockResolvedValue(mockActiveCycle);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.exportCollaboratorEvaluationData('invalid-user')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando não há ciclo ativo', async () => {
      cyclesService.getActiveCycle.mockResolvedValue(null);

      await expect(service.exportCollaboratorEvaluationData('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('GenAI Methods', () => {
    it('deve salvar resumo GenAI com sucesso', async () => {
      const summary = 'Resumo gerado por IA';
      const expectedResult = {
        id: 'summary-1',
        cycle: 'Q1 2024',
        summary,
        collaboratorName: 'João Silva',
        jobTitle: 'Desenvolvedor',
        averageScore: 4.5,
        totalEvaluations: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.genAISummary.create.mockResolvedValue(expectedResult);

      const result = await service.saveGenAISummary(
        'user-1',
        'Q1 2024',
        summary,
        'João Silva',
        'Desenvolvedor',
        4.5,
        5
      );

      expect(result).toEqual(expectedResult);
    });

    it('deve obter resumo GenAI com sucesso', async () => {
      const mockSummary = {
        id: 'summary-1',
        cycle: 'Q1 2024',
        summary: 'Resumo gerado por IA',
        collaboratorName: 'João Silva',
        jobTitle: 'Desenvolvedor',
        averageScore: 4.5,
        totalEvaluations: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.genAISummary.findUnique.mockResolvedValue(mockSummary);

      const result = await service.getGenAISummary({
        collaboratorId: 'user-1',
        cycle: 'Q1 2024',
      });

      expect(result).toEqual(mockSummary);
    });

    it('deve listar resumos GenAI por ciclo', async () => {
      const mockSummaries = [
        {
          id: 'summary-1',
          cycle: 'Q1 2024',
          summary: 'Resumo 1',
          collaboratorName: 'João Silva',
          jobTitle: 'Desenvolvedor',
          averageScore: 4.5,
          totalEvaluations: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.genAISummary.findMany.mockResolvedValue(mockSummaries);

      const result = await service.listGenAISummariesByCycle('Q1 2024');

      expect(result).toEqual(mockSummaries);
    });

    it('deve verificar se resumo GenAI existe', async () => {
      prismaService.genAISummary.findUnique.mockResolvedValue({ id: 'summary-1' });

      const result = await service.checkGenAISummaryExists('user-1', 'Q1 2024');

      expect(result).toBe(true);
    });

    it('deve retornar false quando resumo GenAI não existe', async () => {
      prismaService.genAISummary.findUnique.mockResolvedValue(null);

      const result = await service.checkGenAISummaryExists('user-1', 'Q1 2024');

      expect(result).toBe(false);
    });
  });
});
