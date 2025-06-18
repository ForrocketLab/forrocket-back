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
      },
      committeeAssessment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      selfAssessment: {
        findFirst: jest.fn(),
      },
      assessment360: {
        findMany: jest.fn(),
      },
      managerAssessment: {
        findMany: jest.fn(),
      },
      mentoringAssessment: {
        findMany: jest.fn(),
      },
      referenceFeedback: {
        findMany: jest.fn(),
      },
    };

    const mockCyclesService = {
      validateActiveCyclePhase: jest.fn(),
      getActiveCycleWithPhase: jest.fn(),
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
    const createDto: CreateCommitteeAssessmentDto = {
      evaluatedUserId: 'user-1',
      finalScore: 4,
      justification: 'Justificativa detalhada',
      observations: 'Observações adicionais',
    };

    beforeEach(() => {
      cyclesService.validateActiveCyclePhase.mockResolvedValue(undefined);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
    });

    it('deve criar avaliação de comitê com sucesso', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockCommitteeMember) // Para validar o autor
        .mockResolvedValueOnce(mockUser); // Para validar o colaborador
      prismaService.committeeAssessment.findFirst.mockResolvedValue(null);
      prismaService.committeeAssessment.create.mockResolvedValue({
        ...mockCommitteeAssessment,
        author: mockCommitteeMember,
        evaluatedUser: mockUser,
      });

      const result = await service.createCommitteeAssessment('committee-1', createDto);

      expect(cyclesService.validateActiveCyclePhase).toHaveBeenCalledWith('EQUALIZATION');
      expect(prismaService.committeeAssessment.create).toHaveBeenCalledWith({
        data: {
          authorId: 'committee-1',
          evaluatedUserId: 'user-1',
          cycle: 'Q1 2024',
          finalScore: 4,
          justification: 'Justificativa detalhada',
          observations: 'Observações adicionais',
          status: 'DRAFT',
        },
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
    });

    it('deve lançar NotFoundException quando autor não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createCommitteeAssessment('invalid-user', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não é membro do comitê', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockCommitteeMember,
        roles: '["colaborador"]',
      });

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar NotFoundException quando colaborador não existe', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockCommitteeMember)
        .mockResolvedValueOnce(null);

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando já existe avaliação para o colaborador', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockCommitteeMember)
        .mockResolvedValueOnce(mockUser);
      prismaService.committeeAssessment.findFirst.mockResolvedValue(mockCommitteeAssessment);

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.createCommitteeAssessment('committee-1', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateCommitteeAssessment', () => {
    const updateDto: UpdateCommitteeAssessmentDto = {
      finalScore: 5,
      justification: 'Justificativa atualizada',
    };

    it('deve atualizar avaliação de comitê com sucesso', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      prismaService.committeeAssessment.update.mockResolvedValue({
        ...mockCommitteeAssessment,
        ...updateDto,
        author: mockCommitteeMember,
        evaluatedUser: mockUser,
      });

      const result = await service.updateCommitteeAssessment(
        'assessment-1',
        'committee-1',
        updateDto,
      );

      expect(prismaService.committeeAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: {
          finalScore: 5,
          justification: 'Justificativa atualizada',
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
    });

    it('deve lançar NotFoundException quando avaliação não existe', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCommitteeAssessment('invalid-id', 'committee-1', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando avaliação já foi submetida', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue({
        ...mockCommitteeAssessment,
        status: 'SUBMITTED',
      });
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);

      await expect(
        service.updateCommitteeAssessment('assessment-1', 'committee-1', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ForbiddenException quando usuário não é membro do comitê', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockCommitteeMember,
        roles: '["colaborador"]',
      });

      await expect(
        service.updateCommitteeAssessment('assessment-1', 'committee-1', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitCommitteeAssessment', () => {
    it('deve submeter avaliação de comitê com sucesso', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);
      prismaService.committeeAssessment.update.mockResolvedValue({
        ...mockCommitteeAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        author: mockCommitteeMember,
        evaluatedUser: mockUser,
      });

      const result = await service.submitCommitteeAssessment('assessment-1', 'committee-1');

      expect(prismaService.committeeAssessment.update).toHaveBeenCalledWith({
        where: { id: 'assessment-1' },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result).toBeDefined();
    });

    it('deve lançar NotFoundException quando avaliação não existe', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(null);

      await expect(service.submitCommitteeAssessment('invalid-id', 'committee-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando avaliação já foi submetida', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue({
        ...mockCommitteeAssessment,
        status: 'SUBMITTED',
      });
      prismaService.user.findUnique.mockResolvedValue(mockCommitteeMember);

      await expect(
        service.submitCommitteeAssessment('assessment-1', 'committee-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ForbiddenException quando usuário não é membro do comitê', async () => {
      prismaService.committeeAssessment.findUnique.mockResolvedValue(mockCommitteeAssessment);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockCommitteeMember,
        roles: '["colaborador"]',
      });

      await expect(
        service.submitCommitteeAssessment('assessment-1', 'committee-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCommitteeAssessmentsByCycle', () => {
    it('deve retornar avaliações de comitê do ciclo ativo', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
      const mockAssessments = [
        {
          ...mockCommitteeAssessment,
          author: mockCommitteeMember,
          evaluatedUser: mockUser,
        },
      ];
      prismaService.committeeAssessment.findMany.mockResolvedValue(mockAssessments);

      const result = await service.getCommitteeAssessmentsByCycle();

      expect(result.cycle).toBe('Q1 2024');
      expect(result.assessments).toEqual(mockAssessments);
      expect(result.summary.total).toBe(1);
      expect(result.summary.draft).toBe(1);
      expect(result.summary.submitted).toBe(0);
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(null);

      await expect(service.getCommitteeAssessmentsByCycle()).rejects.toThrow(BadRequestException);
    });

    it('deve calcular corretamente o resumo de status', async () => {
      cyclesService.getActiveCycleWithPhase.mockResolvedValue(mockActiveCycle);
      const mockAssessments = [
        { ...mockCommitteeAssessment, status: 'DRAFT' },
        { ...mockCommitteeAssessment, status: 'SUBMITTED' },
        { ...mockCommitteeAssessment, status: 'SUBMITTED' },
      ];
      prismaService.committeeAssessment.findMany.mockResolvedValue(mockAssessments);

      const result = await service.getCommitteeAssessmentsByCycle();

      expect(result.summary.total).toBe(3);
      expect(result.summary.draft).toBe(1);
      expect(result.summary.submitted).toBe(2);
    });
  });
});
