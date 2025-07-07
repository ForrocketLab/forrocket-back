import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OKRStatus, ObjectiveStatus, KeyResultStatus, KeyResultType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { OKRsService } from './okrs.service';
import {
  CreateOKRDto,
  UpdateOKRDto,
  CreateObjectiveDto,
  UpdateObjectiveDto,
  CreateKeyResultDto,
  UpdateKeyResultDto,
} from './dto';

describe('OKRsService', () => {
  let service: OKRsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOKR = {
    id: 'okr-1',
    userId: 'user-1',
    title: 'Test OKR',
    description: 'Test Description',
    quarter: '2025-Q3',
    year: 2025,
    status: OKRStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    objectives: [],
  };

  const mockObjective = {
    id: 'obj-1',
    okrId: 'okr-1',
    title: 'Test Objective',
    description: 'Test Objective Description',
    status: ObjectiveStatus.NOT_STARTED,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    keyResults: [],
  };

  const mockKeyResult = {
    id: 'kr-1',
    objectiveId: 'obj-1',
    title: 'Test Key Result',
    description: 'Test Key Result Description',
    type: KeyResultType.NUMBER,
    targetValue: 100,
    currentValue: 50,
    unit: 'items',
    status: KeyResultStatus.IN_PROGRESS,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      oKR: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      objective: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      keyResult: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OKRsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OKRsService>(OKRsService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOKR', () => {
    const createOKRDto: CreateOKRDto = {
      title: 'Test OKR',
      description: 'Test Description',
      quarter: '2025-Q3',
      year: 2025,
      objectives: [],
    };

    it('should create OKR successfully', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.oKR.create as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);

      const result = await service.createOKR('user-1', createOKRDto);

      expect(result).toBeDefined();
      expect(prismaService.oKR.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: createOKRDto.title,
          description: createOKRDto.description,
          quarter: createOKRDto.quarter,
          year: createOKRDto.year,
          status: OKRStatus.ACTIVE,
        },
        include: {
          objectives: {
            include: {
              keyResults: true,
            },
          },
        },
      });
    });

    it('should throw ConflictException when OKR already exists for same quarter/year', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(mockOKR);

      await expect(service.createOKR('user-1', createOKRDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for invalid year', async () => {
      const invalidDto = { ...createOKRDto, year: 2024 };

      await expect(service.createOKR('user-1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

          it('should throw BadRequestException for invalid quarter in 2025', async () => {
        const invalidDto = { ...createOKRDto, quarter: '2025-Q1', year: 2025 };

        await expect(service.createOKR('user-1', invalidDto)).rejects.toThrow(
          BadRequestException,
        );
      });
  });

  describe('getUserOKRs', () => {
    it('should return user OKRs successfully', async () => {
      const mockOKRs = [mockOKR];
      (prismaService.oKR.findMany as jest.Mock).mockResolvedValue(mockOKRs);

      const result = await service.getUserOKRs('user-1');

      expect(result).toBeDefined();
      expect(prismaService.oKR.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          objectives: {
            include: {
              keyResults: true,
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { quarter: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });

    it('should return empty array when user has no OKRs', async () => {
      (prismaService.oKR.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserOKRs('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOKRById', () => {
    it('should return OKR by ID successfully', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);

      const result = await service.getOKRById('okr-1');

      expect(result).toBeDefined();
      expect(prismaService.oKR.findUnique).toHaveBeenCalledWith({
        where: { id: 'okr-1' },
        include: {
          objectives: {
            include: {
              keyResults: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    it('should throw NotFoundException when OKR not found', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getOKRById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOKR', () => {
    const updateOKRDto: UpdateOKRDto = {
      title: 'Updated OKR',
      description: 'Updated Description',
    };

    it('should update OKR successfully', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.update as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);

      const result = await service.updateOKR('okr-1', 'user-1', updateOKRDto);

      expect(result).toBeDefined();
      expect(prismaService.oKR.update).toHaveBeenCalledWith({
        where: { id: 'okr-1' },
        data: updateOKRDto,
      });
    });

    it('should throw NotFoundException when OKR not found', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.updateOKR('nonexistent', 'user-1', updateOKRDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteOKR', () => {
    it('should delete OKR successfully', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.delete as jest.Mock).mockResolvedValue(mockOKR);

      await service.deleteOKR('okr-1', 'user-1');

      expect(prismaService.oKR.delete).toHaveBeenCalledWith({
        where: { id: 'okr-1' },
      });
    });

    it('should throw NotFoundException when OKR not found', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteOKR('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createObjective', () => {
    const createObjectiveDto: CreateObjectiveDto = {
      title: 'Test Objective',
      description: 'Test Description',
      keyResults: [],
    };

    it('should create objective successfully', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.objective.create as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);

      const result = await service.createObjective('okr-1', createObjectiveDto);

      expect(result).toBeDefined();
      expect(prismaService.objective.create).toHaveBeenCalledWith({
        data: {
          okrId: 'okr-1',
          title: createObjectiveDto.title,
          description: createObjectiveDto.description,
          status: ObjectiveStatus.NOT_STARTED,
          progress: 0,
        },
        include: {
          keyResults: true,
        },
      });
    });

    it('should throw NotFoundException when OKR not found', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createObjective('nonexistent', createObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getObjectiveById', () => {
    it('should return objective by ID successfully', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);

      const result = await service.getObjectiveById('obj-1');

      expect(result).toBeDefined();
      expect(prismaService.objective.findUnique).toHaveBeenCalledWith({
        where: { id: 'obj-1' },
        include: {
          keyResults: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    it('should throw NotFoundException when objective not found', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getObjectiveById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createKeyResult', () => {
    const createKeyResultDto: CreateKeyResultDto = {
      title: 'Test Key Result',
      description: 'Test Description',
      type: KeyResultType.NUMBER,
      targetValue: 100,
      currentValue: 50,
      unit: 'items',
    };

    it('should create key result successfully', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.keyResult.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.keyResult.create as jest.Mock).mockResolvedValue(mockKeyResult);

      const result = await service.createKeyResult('obj-1', createKeyResultDto);

      expect(result).toBeDefined();
      expect(prismaService.keyResult.create).toHaveBeenCalledWith({
        data: {
          objectiveId: 'obj-1',
          title: createKeyResultDto.title.trim(),
          description: createKeyResultDto.description,
          type: createKeyResultDto.type,
          targetValue: createKeyResultDto.targetValue,
          currentValue: createKeyResultDto.currentValue,
          unit: createKeyResultDto.unit,
          status: KeyResultStatus.IN_PROGRESS,
        },
      });
    });

    it('should throw NotFoundException when objective not found', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createKeyResult('nonexistent', createKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when key result with same title exists', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.keyResult.findFirst as jest.Mock).mockResolvedValue(mockKeyResult);

      await expect(service.createKeyResult('obj-1', createKeyResultDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getKeyResultById', () => {
    it('should return key result by ID successfully', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(mockKeyResult);

      const result = await service.getKeyResultById('kr-1');

      expect(result).toBeDefined();
      expect(prismaService.keyResult.findUnique).toHaveBeenCalledWith({
        where: { id: 'kr-1' },
      });
    });

    it('should throw NotFoundException when key result not found', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getKeyResultById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Private methods', () => {
    describe('validateQuarterPeriod', () => {
      it('should allow valid periods', () => {
        expect(() => service['validateQuarterPeriod']('2025-Q3', 2025)).not.toThrow();
        expect(() => service['validateQuarterPeriod']('2025-Q4', 2025)).not.toThrow();
        expect(() => service['validateQuarterPeriod']('2026-Q1', 2026)).not.toThrow();
      });

      it('should throw BadRequestException for years before 2025', () => {
        expect(() => service['validateQuarterPeriod']('Q3', 2024)).toThrow(BadRequestException);
      });

      it('should throw BadRequestException for invalid quarters in 2025', () => {
        expect(() => service['validateQuarterPeriod']('2025-Q1', 2025)).toThrow(BadRequestException);
        expect(() => service['validateQuarterPeriod']('2025-Q2', 2025)).toThrow(BadRequestException);
      });
    });

    describe('calculateKeyResultProgress', () => {
      it('should calculate progress correctly', () => {
        const keyResult = { currentValue: 50, targetValue: 100 };
        expect(service['calculateKeyResultProgress'](keyResult)).toBe(50);
      });

      it('should return 0 when targetValue is 0', () => {
        const keyResult = { currentValue: 50, targetValue: 0 };
        expect(service['calculateKeyResultProgress'](keyResult)).toBe(0);
      });

      it('should cap progress at 100', () => {
        const keyResult = { currentValue: 150, targetValue: 100 };
        expect(service['calculateKeyResultProgress'](keyResult)).toBe(100);
      });

      it('should cap progress at 0 for negative values', () => {
        const keyResult = { currentValue: -10, targetValue: 100 };
        expect(service['calculateKeyResultProgress'](keyResult)).toBe(0);
      });
    });

    describe('formatValue', () => {
      it('should format percentage values', () => {
        expect(service['formatValue'](75, KeyResultType.PERCENTAGE)).toBe('75%');
      });

      it('should format binary values', () => {
        expect(service['formatValue'](1, KeyResultType.BINARY, undefined, 1)).toBe('Sim');
        expect(service['formatValue'](0, KeyResultType.BINARY, undefined, 1)).toBe('Não');
      });

      it('should format numeric values with unit', () => {
        expect(service['formatValue'](100, KeyResultType.NUMBER, 'items')).toBe('100 items');
      });

      it('should format numeric values without unit', () => {
        expect(service['formatValue'](100, KeyResultType.NUMBER)).toBe('100');
      });
    });
  });
}); 