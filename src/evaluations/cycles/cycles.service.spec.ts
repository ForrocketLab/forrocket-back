import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CyclesService } from './cycles.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateEvaluationCycleDto, ActivateCycleDto, UpdateCycleStatusDto, UpdateCyclePhaseDto } from './dto/evaluation-cycle.dto';

describe('CyclesService', () => {
  let service: CyclesService;
  let prismaService: any;

  const mockCycle = {
    id: 'cycle-1',
    name: 'Q2 2024',
    status: 'UPCOMING',
    startDate: '2024-04-01T00:00:00.000Z',
    endDate: '2024-06-30T00:00:00.000Z',
    assessmentDeadline: '2024-05-15T00:00:00.000Z',
    managerDeadline: '2024-06-15T00:00:00.000Z',
    equalizationDeadline: '2024-06-25T00:00:00.000Z',
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
    it('deve retornar todos os ciclos de avaliação', async () => {
      const mockCycles = [mockCycle];
      prismaService.evaluationCycle.findMany.mockResolvedValue(mockCycles);

      const result = await service.getEvaluationCycles();

      expect(result).toEqual(mockCycles);
      expect(prismaService.evaluationCycle.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getEvaluationCycleById', () => {
    it('deve retornar ciclo por ID', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      const result = await service.getEvaluationCycleById('cycle-1');

      expect(result).toEqual(mockCycle);
      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
      });
    });
  });

  describe('getActiveCycle', () => {
    it('deve retornar ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.getActiveCycle();

      expect(result).toEqual(mockActiveCycle);
      expect(prismaService.evaluationCycle.findFirst).toHaveBeenCalledWith({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve retornar null quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      const result = await service.getActiveCycle();

      expect(result).toBeNull();
    });
  });

  describe('createEvaluationCycle', () => {
    const createDto: CreateEvaluationCycleDto = {
      name: 'Q2 2024',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      assessmentDeadline: '2024-05-15',
      managerDeadline: '2024-06-15',
      equalizationDeadline: '2024-06-25',
    };

    it('deve criar ciclo com sucesso', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);
      prismaService.evaluationCycle.create.mockResolvedValue({
        ...mockCycle,
        name: createDto.name,
        startDate: '2024-04-01T00:00:00.000Z',
        endDate: '2024-06-30T00:00:00.000Z',
        assessmentDeadline: '2024-05-15T00:00:00.000Z',
        managerDeadline: '2024-06-15T00:00:00.000Z',
        equalizationDeadline: '2024-06-25T00:00:00.000Z',
      });

      const result = await service.createEvaluationCycle(createDto);

      expect(result).toBeDefined();
      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(prismaService.evaluationCycle.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          status: 'UPCOMING',
          startDate: expect.anything(),
          endDate: expect.anything(),
          assessmentDeadline: expect.anything(),
          managerDeadline: expect.anything(),
          equalizationDeadline: expect.anything(),
        },
      });
    });

    it('deve lançar BadRequestException quando nome já existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      await expect(service.createEvaluationCycle(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando datas são inconsistentes', async () => {
      const invalidDto = {
        ...createDto,
        startDate: '2024-06-01', // Data posterior ao endDate
        endDate: '2024-05-01',
      };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.createEvaluationCycle(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activateCycle', () => {
    const activateDto: ActivateCycleDto = {
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      assessmentDeadline: '2024-02-15',
      managerDeadline: '2024-03-15',
      equalizationDeadline: '2024-03-31',
      autoSetEndDate: true,
    };

    it('deve ativar ciclo com sucesso', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          evaluationCycle: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue(mockActiveCycle),
          },
        });
      });

      const result = await service.activateCycle('cycle-1', activateDto);

      expect(result).toEqual(mockActiveCycle);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.activateCycle('cycle-1', activateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCycleStatus', () => {
    it('deve ativar ciclo e desativar outros quando status é OPEN', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          evaluationCycle: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue(mockActiveCycle),
          },
        });
      });

      const result = await service.updateCycleStatus('cycle-1', { status: 'OPEN' });

      expect(result).toEqual(mockActiveCycle);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.updateCycleStatus('cycle-1', { status: 'OPEN' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCyclePhase', () => {
    const updateDto: UpdateCyclePhaseDto = {
      phase: 'MANAGER_REVIEWS',
    };

    it('deve atualizar fase do ciclo', async () => {
      // Mock ciclo ativo
      const activeCycle = {
        ...mockCycle,
        status: 'OPEN', // Garantir que o ciclo está ativo
        phase: 'ASSESSMENTS',
      };

      prismaService.evaluationCycle.findUnique.mockResolvedValue(activeCycle);
      prismaService.evaluationCycle.update.mockResolvedValue({
        ...activeCycle,
        phase: updateDto.phase,
      });

      const result = await service.updateCyclePhase('cycle-1', updateDto);

      expect(result).toBeDefined();
      expect(prismaService.evaluationCycle.update).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
        data: { phase: updateDto.phase },
      });
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.updateCyclePhase('cycle-1', { phase: 'EQUALIZATION' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
