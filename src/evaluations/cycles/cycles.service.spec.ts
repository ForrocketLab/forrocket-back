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
    name: 'Q1 2024',
    status: 'UPCOMING',
    phase: 'ASSESSMENTS',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    assessmentDeadline: new Date('2024-02-15'),
    managerDeadline: new Date('2024-03-15'),
    equalizationDeadline: new Date('2024-03-31'),
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
      prismaService.evaluationCycle.create.mockResolvedValue(mockCycle);

      const result = await service.createEvaluationCycle(createDto);

      expect(result).toEqual(mockCycle);
      expect(prismaService.evaluationCycle.findUnique).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(prismaService.evaluationCycle.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          status: 'UPCOMING',
          startDate: createDto.startDate ? new Date(createDto.startDate) : null,
          endDate: createDto.endDate ? new Date(createDto.endDate) : null,
          assessmentDeadline: createDto.assessmentDeadline ? new Date(createDto.assessmentDeadline) : null,
          managerDeadline: createDto.managerDeadline ? new Date(createDto.managerDeadline) : null,
          equalizationDeadline: createDto.equalizationDeadline ? new Date(createDto.equalizationDeadline) : null,
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

      await expect(service.activateCycle('invalid-id', activateDto)).rejects.toThrow(
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
    const updateDto: UpdateCycleStatusDto = {
      status: 'CLOSED',
    };

    it('deve atualizar status do ciclo', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);
      prismaService.evaluationCycle.update.mockResolvedValue({
        ...mockCycle,
        status: 'CLOSED',
      });

      const result = await service.updateCycleStatus('cycle-1', updateDto);

      expect(result.status).toBe('CLOSED');
      expect(prismaService.evaluationCycle.update).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
        data: { status: 'CLOSED' },
      });
    });

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

      await expect(service.updateCycleStatus('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCyclePhase', () => {
    const updateDto: UpdateCyclePhaseDto = {
      phase: 'MANAGER_REVIEWS',
    };

    it('deve atualizar fase do ciclo', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockActiveCycle);
      prismaService.evaluationCycle.update.mockResolvedValue({
        ...mockActiveCycle,
        phase: 'MANAGER_REVIEWS',
      });

      const result = await service.updateCyclePhase('cycle-1', updateDto);

      expect(result.phase).toBe('MANAGER_REVIEWS');
      expect(prismaService.evaluationCycle.update).toHaveBeenCalledWith({
        where: { id: 'cycle-1' },
        data: { phase: 'MANAGER_REVIEWS' },
      });
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.updateCyclePhase('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando ciclo não está ativo', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      await expect(service.updateCyclePhase('cycle-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando transição de fase é inválida', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockActiveCycle);

      await expect(
        service.updateCyclePhase('cycle-1', { phase: 'ASSESSMENTS' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateActiveCycleExists', () => {
    it('deve retornar dados do ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateActiveCycleExists();

      expect(result).toEqual({
        id: mockActiveCycle.id,
        name: mockActiveCycle.name,
      });
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      await expect(service.validateActiveCycleExists()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateCycleIsActive', () => {
    it('deve retornar true quando ciclo é ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateCycleIsActive('Q1 2024');

      expect(result).toBe(true);
    });

    it('deve retornar false quando ciclo não é ativo', async () => {
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

  describe('validateActiveCyclePhase', () => {
    it('deve retornar ciclo quando fase está correta', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.validateActiveCyclePhase('ASSESSMENTS');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockActiveCycle.id);
      expect(result.name).toBe(mockActiveCycle.name);
      expect(result.phase).toBe('ASSESSMENTS');
    });

    it('deve lançar BadRequestException quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      await expect(service.validateActiveCyclePhase('ASSESSMENTS')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando fase está incorreta', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      await expect(service.validateActiveCyclePhase('MANAGER_REVIEWS')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getActiveCycleWithPhase', () => {
    it('deve retornar ciclo ativo com fase', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);

      const result = await service.getActiveCycleWithPhase();

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(mockActiveCycle.id);
        expect(result.name).toBe(mockActiveCycle.name);
        expect(result.phase).toBe('ASSESSMENTS');
      }
    });

    it('deve retornar null quando não há ciclo ativo', async () => {
      prismaService.evaluationCycle.findFirst.mockResolvedValue(null);

      const result = await service.getActiveCycleWithPhase();

      expect(result).toBeNull();
    });
  });

  describe('getCycleDeadlinesInfo', () => {
    it('deve retornar informações de deadlines do ciclo', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(mockCycle);

      const result = await service.getCycleDeadlinesInfo('cycle-1');

      expect(result).toBeDefined();
      expect(result.cycle.id).toBe(mockCycle.id);
      expect(result.cycle.name).toBe(mockCycle.name);
    });

    it('deve lançar NotFoundException quando ciclo não existe', async () => {
      prismaService.evaluationCycle.findUnique.mockResolvedValue(null);

      await expect(service.getCycleDeadlinesInfo('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
