import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';

describe('CyclesController', () => {
  let controller: CyclesController;
  let cyclesService: jest.Mocked<CyclesService>;

  const mockUser = {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@rocketcorp.com',
    roles: ['admin'],
    toPublic: jest.fn(),
  };

  const mockCycle = {
    id: 'cycle-1',
    name: 'Q1 2024',
    status: 'UPCOMING',
    phase: 'ASSESSMENTS',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCyclesService = {
      getEvaluationCycles: jest.fn(),
      getEvaluationCycleById: jest.fn(),
      getActiveCycle: jest.fn(),
      getActiveCycleWithPhase: jest.fn(),
      createEvaluationCycle: jest.fn(),
      activateCycle: jest.fn(),
      updateCycleStatus: jest.fn(),
      updateCyclePhase: jest.fn(),
      getCycleDeadlinesInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CyclesController],
      providers: [
        {
          provide: CyclesService,
          useValue: mockCyclesService,
        },
      ],
    }).compile();

    controller = module.get<CyclesController>(CyclesController);
    cyclesService = module.get(CyclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCycles', () => {
    it('deve retornar todos os ciclos', async () => {
      const mockCycles = [mockCycle, { ...mockCycle, id: 'cycle-2', name: 'Q2 2024' }];
      (cyclesService.getEvaluationCycles as jest.Mock).mockResolvedValue(mockCycles);

      const result = await controller.getCycles();

      expect(cyclesService.getEvaluationCycles).toHaveBeenCalled();
      expect(result).toEqual(mockCycles);
    });
  });

  describe('getActiveCycle', () => {
    it('deve retornar o ciclo ativo', async () => {
      const activeCycle = { ...mockCycle, status: 'OPEN' };
      (cyclesService.getActiveCycleWithPhase as jest.Mock).mockResolvedValue(activeCycle);

      const result = await controller.getActiveCycle();

      expect(cyclesService.getActiveCycleWithPhase).toHaveBeenCalled();
      expect(result).toEqual(activeCycle);
    });
  });

  describe('createCycle', () => {
    const createCycleDto = {
      name: 'Q3 2024',
      startDate: '2024-07-01',
      endDate: '2024-09-30',
    };

    it('deve criar um novo ciclo com sucesso', async () => {
      const newCycle = { ...mockCycle, id: 'cycle-3', name: 'Q3 2024' };
      (cyclesService.createEvaluationCycle as jest.Mock).mockResolvedValue(newCycle);

      const result = await controller.createCycle(mockUser as any, createCycleDto as any);

      expect(cyclesService.createEvaluationCycle).toHaveBeenCalledWith(createCycleDto);
      expect(result).toEqual(newCycle);
    });

    it('deve propagar erro do service', async () => {
      (cyclesService.createEvaluationCycle as jest.Mock).mockRejectedValue(
        new BadRequestException('Já existe um ciclo com este nome'),
      );

      await expect(controller.createCycle(mockUser as any, createCycleDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não é admin', async () => {
      const nonAdminUser = { ...mockUser, roles: ['colaborador'] };

      await expect(
        controller.createCycle(nonAdminUser as any, createCycleDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.createCycle(nonAdminUser as any, createCycleDto as any),
      ).rejects.toThrow('Apenas administradores podem criar ciclos de avaliação');

      expect(cyclesService.createEvaluationCycle).not.toHaveBeenCalled();
    });
  });

  describe('activateCycle', () => {
    const activateDto = {
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      assessmentDeadline: '2024-02-15',
      managerDeadline: '2024-03-01',
      equalizationDeadline: '2024-03-15',
      autoSetEndDate: true,
    };

    it('deve ativar um ciclo com sucesso', async () => {
      const activatedCycle = { ...mockCycle, status: 'OPEN' };
      (cyclesService.activateCycle as jest.Mock).mockResolvedValue(activatedCycle);

      const result = await controller.activateCycle(mockUser as any, 'cycle-1', activateDto as any);

      expect(cyclesService.activateCycle).toHaveBeenCalledWith('cycle-1', activateDto);
      expect(result).toEqual(activatedCycle);
    });

    it('deve ativar ciclo com deadlines mínimas', async () => {
      const minimalDto = {
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };
      const activatedCycle = { ...mockCycle, status: 'OPEN' };
      (cyclesService.activateCycle as jest.Mock).mockResolvedValue(activatedCycle);

      const result = await controller.activateCycle(mockUser as any, 'cycle-1', minimalDto as any);

      expect(cyclesService.activateCycle).toHaveBeenCalledWith('cycle-1', minimalDto);
      expect(result).toEqual(activatedCycle);
    });

    it('deve propagar erro do service', async () => {
      (cyclesService.activateCycle as jest.Mock).mockRejectedValue(
        new NotFoundException('Ciclo não encontrado'),
      );

      await expect(
        controller.activateCycle(mockUser as any, 'cycle-1', activateDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não é admin', async () => {
      const nonAdminUser = { ...mockUser, roles: ['colaborador'] };

      await expect(
        controller.activateCycle(nonAdminUser as any, 'cycle-1', activateDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.activateCycle(nonAdminUser as any, 'cycle-1', activateDto as any),
      ).rejects.toThrow('Apenas administradores podem ativar ciclos de avaliação');

      expect(cyclesService.activateCycle).not.toHaveBeenCalled();
    });
  });

  describe('getCycleDeadlines', () => {
    const mockDeadlinesInfo = {
      cycle: {
        id: 'cycle-1',
        name: 'Q1 2024',
        status: 'OPEN',
        phase: 'ASSESSMENTS',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      },
      deadlines: [
        {
          phase: 'ASSESSMENTS',
          name: 'Avaliações (Autoavaliação, 360°, Mentoring, Reference)',
          deadline: new Date('2024-02-15'),
          daysUntil: 10,
          status: 'OK',
        },
      ],
      summary: {
        totalDeadlines: 1,
        overdueCount: 0,
        urgentCount: 0,
        okCount: 1,
      },
      inconsistencies: [],
      hasInconsistencies: false,
    };

    beforeEach(() => {
      (cyclesService.getCycleDeadlinesInfo as jest.Mock).mockResolvedValue(mockDeadlinesInfo);
    });

    it('deve retornar informações de deadlines com sucesso', async () => {
      const result = await controller.getCycleDeadlines('cycle-1');

      expect(cyclesService.getCycleDeadlinesInfo).toHaveBeenCalledWith('cycle-1');
      expect(result).toEqual(mockDeadlinesInfo);
    });

    it('deve propagar erro do service', async () => {
      (cyclesService.getCycleDeadlinesInfo as jest.Mock).mockRejectedValue(
        new NotFoundException('Ciclo não encontrado'),
      );

      await expect(controller.getCycleDeadlines('cycle-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCycleStatus', () => {
    const updateStatusDto = { status: 'CLOSED' as const };

    it('deve atualizar status do ciclo', async () => {
      const updatedCycle = { ...mockCycle, status: 'CLOSED' };
      (cyclesService.updateCycleStatus as jest.Mock).mockResolvedValue(updatedCycle);

      const result = await controller.updateCycleStatus(
        mockUser as any,
        'cycle-1',
        updateStatusDto as any,
      );

      expect(cyclesService.updateCycleStatus).toHaveBeenCalledWith('cycle-1', updateStatusDto);
      expect(result).toEqual(updatedCycle);
    });

    it('deve lançar ForbiddenException quando usuário não é admin', async () => {
      const nonAdminUser = { ...mockUser, roles: ['colaborador'] };

      await expect(
        controller.updateCycleStatus(nonAdminUser as any, 'cycle-1', updateStatusDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.updateCycleStatus(nonAdminUser as any, 'cycle-1', updateStatusDto as any),
      ).rejects.toThrow('Apenas administradores podem alterar status de ciclos');

      expect(cyclesService.updateCycleStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateCyclePhase', () => {
    const updatePhaseDto = { phase: 'MANAGER_REVIEWS' as const };

    it('deve atualizar fase do ciclo', async () => {
      const updatedCycle = { ...mockCycle, phase: 'MANAGER_REVIEWS' };
      (cyclesService.updateCyclePhase as jest.Mock).mockResolvedValue(updatedCycle);

      const result = await controller.updateCyclePhase(
        mockUser as any,
        'cycle-1',
        updatePhaseDto as any,
      );

      expect(cyclesService.updateCyclePhase).toHaveBeenCalledWith('cycle-1', updatePhaseDto);
      expect(result).toEqual(updatedCycle);
    });

    it('deve propagar erro de transição inválida', async () => {
      (cyclesService.updateCyclePhase as jest.Mock).mockRejectedValue(
        new BadRequestException('Transição de fase inválida'),
      );

      await expect(
        controller.updateCyclePhase(mockUser as any, 'cycle-1', updatePhaseDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ForbiddenException quando usuário não é admin', async () => {
      const nonAdminUser = { ...mockUser, roles: ['colaborador'] };

      await expect(
        controller.updateCyclePhase(nonAdminUser as any, 'cycle-1', updatePhaseDto as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.updateCyclePhase(nonAdminUser as any, 'cycle-1', updatePhaseDto as any),
      ).rejects.toThrow('Apenas administradores podem alterar fases de ciclos');

      expect(cyclesService.updateCyclePhase).not.toHaveBeenCalled();
    });
  });

  describe('getActivePhase', () => {
    it('deve retornar informações da fase ativa com sucesso', async () => {
      const activeCycle = {
        ...mockCycle,
        status: 'OPEN',
        phase: 'ASSESSMENTS' as const,
      };
      (cyclesService.getActiveCycleWithPhase as jest.Mock).mockResolvedValue(activeCycle);

      const result = await controller.getActivePhase();

      expect(cyclesService.getActiveCycleWithPhase).toHaveBeenCalled();
      expect(result).toEqual({
        cycleId: 'cycle-1',
        cycleName: 'Q1 2024',
        currentPhase: 'ASSESSMENTS',
        phaseDescription: 'Avaliações (Autoavaliação, 360, Mentoring, Reference)',
        allowedEvaluations: {
          selfAssessment: true,
          assessment360: true,
          mentoringAssessment: true,
          referenceFeedback: true,
          managerAssessment: false,
        },
        nextPhase: 'MANAGER_REVIEWS',
      });
    });

    it('deve lançar NotFoundException quando não há ciclo ativo', async () => {
      (cyclesService.getActiveCycleWithPhase as jest.Mock).mockResolvedValue(null);

      await expect(controller.getActivePhase()).rejects.toThrow(NotFoundException);
      await expect(controller.getActivePhase()).rejects.toThrow(
        'Nenhum ciclo de avaliação ativo encontrado',
      );
    });
  });
});
