import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CyclesService } from './cycles.service';
import { PrismaService } from '../../database/prisma.service';

describe('CyclesService', () => {
  let service: CyclesService;
  let prismaService: any;

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

  const mockActiveCycle = {
    ...mockCycle,
    status: 'OPEN',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      evaluationCycle: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CyclesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CyclesService>(CyclesService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEvaluationCycles', () => {
    it('deve retornar todos os ciclos ordenados por data de criação', async () => {
      const mockCycles = [mockCycle, { ...mockCycle, id: 'cycle-2', name: 'Q2 2024' }];
      prismaService.evaluationCycle.findMany.mockResolvedValue(mockCycles);

      const result = await service.getEvaluationCycles();

      expect(prismaService.evaluationCycle.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockCycles);
    });
  });

  describe('getEvaluationCycleById', () => {
    it('deve retornar um ciclo específico por ID', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      const result = await service.getEvaluationCycleById('cycle-1');

      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
      });
      expect(result).toEqual(mockCycle);
    });
  });

  describe('getActiveCycle', () => {
    it('deve retornar o ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.getActiveCycle();

      expect(prismaService.evaluationCycle.findFirst).toHaveBeenCalledWith({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockActiveCycle);
    });

    it('deve retornar null quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      const result = await service.getActiveCycle();

      expect(result).toBeNull();
    });
  });

  describe('createEvaluationCycle', () => {
    const createCycleDto = {
      name: 'Q3 2024',
      startDate: '2024-07-01',
      endDate: '2024-09-30',
    };

    it('deve criar um novo ciclo com sucesso', async () => {
      const newCycle = { ...mockCycle, id: 'cycle-3', name: 'Q3 2024' };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);
      prismaService.evaluationCycle.create.mockResolvedValue(newCycle);

      const result = await service.createEvaluationCycle(createCycleDto);

      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { name: 'Q3 2024' },
      });
      expect(prismaService.evaluationCycle.create).toHaveBeenCalledWith({
        data: {
          name: 'Q3 2024',
          status: 'UPCOMING',
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-09-30'),
          assessmentDeadline: null,
          managerDeadline: null,
          equalizationDeadline: null,
        },
      });
      expect(result).toEqual(newCycle);
    });

    it('deve criar ciclo sem datas quando não fornecidas', async () => {
      const dtoSemDatas = { name: 'Q4 2024' };
      const newCycle = { ...mockCycle, name: 'Q4 2024', startDate: null, endDate: null };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);
      prismaService.evaluationCycle.create.mockResolvedValue(newCycle);

      const result = await service.createEvaluationCycle(dtoSemDatas);

      expect(prismaService.evaluationCycle.create).toHaveBeenCalledWith({
        data: {
          name: 'Q4 2024',
          status: 'UPCOMING',
          startDate: null,
          endDate: null,
          assessmentDeadline: null,
          managerDeadline: null,
          equalizationDeadline: null,
        },
      });
      expect(result).toEqual(newCycle);
    });

    it('deve lançar BadRequestException quando já existe ciclo com mesmo nome', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      await expect(service.createEvaluationCycle(createCycleDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { name: 'Q3 2024' },
      });
    });
  });

  describe('activateCycle', () => {
    const activateDto = {
      startDate: '2024-01-01',
      endDate: '2024-03-31',
    };

    it('deve ativar um ciclo com sucesso', async () => {
      const updatedCycle = { ...mockCycle, status: 'OPEN' };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          evaluationCycle: {
            updateMany: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedCycle),
          },
        });
      });

      const result = await service.activateCycle('cycle-1', activateDto);

      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
      });
      expect(result).toEqual(updatedCycle);
    });

    it('deve ativar ciclo sem alterar datas quando não fornecidas', async () => {
      const updatedCycle = { ...mockCycle, status: 'OPEN' };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          evaluationCycle: {
            updateMany: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedCycle),
          },
        });
      });

      const result = await service.activateCycle('cycle-1', {});

      expect(result).toEqual(updatedCycle);
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.activateCycle('cycle-inexistente', activateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando ciclo já está ativo', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockActiveCycle);

      await expect(service.activateCycle('cycle-1', activateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateCycleStatus', () => {
    it('deve atualizar status do ciclo para status simples', async () => {
      const updateDto = { status: 'CLOSED' as const };
      const updatedCycle = { ...mockCycle, status: 'CLOSED' };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.evaluationCycle.update.mockResolvedValue(updatedCycle);

      const result = await service.updateCycleStatus('cycle-1', updateDto);

      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
      });
      expect(prismaService.evaluationCycle.update).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
        data: { status: 'CLOSED' },
      });
      expect(result).toEqual(updatedCycle);
    });

    it('deve ativar ciclo usando transação quando mudando para OPEN', async () => {
      const updateDto = { status: 'OPEN' as const };
      const updatedCycle = { ...mockCycle, status: 'OPEN' };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          evaluationCycle: {
            updateMany: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedCycle),
          },
        });
      });

      const result = await service.updateCycleStatus('cycle-1', updateDto);

      expect(result).toEqual(updatedCycle);
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCycleStatus('cycle-inexistente', { status: 'CLOSED' as const }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateActiveCycleExists', () => {
    it('deve retornar informações do ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateActiveCycleExists();

      expect(result).toEqual({ id: 'cycle-1', name: 'Q1 2024' });
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      await expect(service.validateActiveCycleExists()).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateCycleIsActive', () => {
    it('deve retornar true quando ciclo está ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateCycleIsActive('Q1 2024');

      expect(result).toBe(true);
    });

    it('deve retornar false quando ciclo não está ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateCycleIsActive('Q2 2024');

      expect(result).toBe(false);
    });

    it('deve retornar false quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      const result = await service.validateCycleIsActive('Q1 2024');

      expect(result).toBe(false);
    });
  });

  describe('updateCyclePhase', () => {
    it('deve atualizar fase do ciclo com sucesso', async () => {
      const updateDto = { phase: 'MANAGER_REVIEWS' as const };
      const updatedCycle = { ...mockActiveCycle, phase: 'MANAGER_REVIEWS' };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockActiveCycle);
      prismaService.evaluationCycle.update.mockResolvedValue(updatedCycle);

      const result = await service.updateCyclePhase('cycle-1', updateDto);

      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
      });
      expect(prismaService.evaluationCycle.update).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
        data: { phase: 'MANAGER_REVIEWS' },
      });
      expect(result).toEqual(updatedCycle);
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCyclePhase('cycle-inexistente', { phase: 'MANAGER_REVIEWS' as const }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando ciclo não está ativo', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      await expect(
        service.updateCyclePhase('cycle-1', { phase: 'MANAGER_REVIEWS' as const }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para transição de fase inválida', async () => {
      const cycleNaFase2 = { ...mockActiveCycle, phase: 'MANAGER_REVIEWS' };
      prismaService.evaluationCycle.findUnique.mockResolvedValue(cycleNaFase2);

      await expect(
        service.updateCyclePhase('cycle-1', { phase: 'ASSESSMENTS' as const }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando tentar sair da fase EQUALIZATION', async () => {
      const cycleNaFase3 = { ...mockActiveCycle, phase: 'EQUALIZATION' };
      prismaService.evaluationCycle.findUnique.mockResolvedValue(cycleNaFase3);

      await expect(
        service.updateCyclePhase('cycle-1', { phase: 'ASSESSMENTS' as const }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateActiveCyclePhase', () => {
    it('deve retornar informações quando fase está correta', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateActiveCyclePhase('ASSESSMENTS');

      expect(result).toEqual({
        id: 'cycle-1',
        name: 'Q1 2024',
        phase: 'ASSESSMENTS',
      });
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      await expect(service.validateActiveCyclePhase('ASSESSMENTS')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando fase está incorreta', async () => {
      const cycleNaFase2 = { ...mockActiveCycle, phase: 'MANAGER_REVIEWS' };
      prismaService.evaluationCycle.findFirst.mockResolvedValue(cycleNaFase2);

      await expect(service.validateActiveCyclePhase('ASSESSMENTS')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getActiveCycleWithPhase', () => {
    it('deve retornar informações completas do ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.getActiveCycleWithPhase();

      expect(result).toEqual({
        id: 'cycle-1',
        name: 'Q1 2024',
        status: 'OPEN',
        phase: 'ASSESSMENTS',
        startDate: mockActiveCycle.startDate,
        endDate: mockActiveCycle.endDate,
      });
    });

    it('deve retornar null quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      const result = await service.getActiveCycleWithPhase();

      expect(result).toBeNull();
    });
  });
});
