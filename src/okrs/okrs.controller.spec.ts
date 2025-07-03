import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OKRStatus, ObjectiveStatus, KeyResultStatus, KeyResultType } from '@prisma/client';

import { OKRsController } from './okrs.controller';
import { OKRsService } from './okrs.service';
import {
  CreateOKRDto,
  UpdateOKRDto,
  CreateObjectiveDto,
  UpdateObjectiveDto,
  CreateKeyResultDto,
  UpdateKeyResultDto,
  OKRResponseDto,
  OKRSummaryDto,
  ObjectiveResponseDto,
  KeyResultResponseDto,
} from './dto';

describe('OKRsController', () => {
  let controller: OKRsController;
  let service: jest.Mocked<OKRsService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash',
    roles: ['colaborador'],
    jobTitle: 'Developer',
    seniority: 'JUNIOR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    projectAssignments: [],
    directReports: [],
    mentorId: null,
    mentor: null,
  } as any;

  const mockOKRResponse: OKRResponseDto = {
    id: 'okr-1',
    userId: 'user-1',
    title: 'Test OKR',
    description: 'Test Description',
    quarter: 'Q3',
    year: 2025,
    status: OKRStatus.ACTIVE,
    overallProgress: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    objectives: [],
  };

  const mockOKRSummary: OKRSummaryDto = {
    id: 'okr-1',
    title: 'Test OKR',
    quarter: 'Q3',
    year: 2025,
    status: OKRStatus.ACTIVE,
    overallProgress: 50,
    objectivesCount: 2,
    completedObjectives: 1,
    updatedAt: new Date(),
  };

  const mockObjectiveResponse: ObjectiveResponseDto = {
    id: 'obj-1',
    okrId: 'okr-1',
    title: 'Test Objective',
    description: 'Test Description',
    status: ObjectiveStatus.IN_PROGRESS,
    progress: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    keyResults: [],
  };

  const mockKeyResultResponse: KeyResultResponseDto = {
    id: 'kr-1',
    objectiveId: 'obj-1',
    title: 'Test Key Result',
    description: 'Test Description',
    type: KeyResultType.NUMBER,
    targetValue: 100,
    currentValue: 50,
    unit: 'items',
    status: KeyResultStatus.IN_PROGRESS,
    progress: 50,
    formattedCurrentValue: '50 items',
    formattedTargetValue: '100 items',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockOKRsService = {
      createOKR: jest.fn(),
      getUserOKRs: jest.fn(),
      getOKRById: jest.fn(),
      updateOKR: jest.fn(),
      deleteOKR: jest.fn(),
      createObjective: jest.fn(),
      getObjectiveById: jest.fn(),
      updateObjective: jest.fn(),
      deleteObjective: jest.fn(),
      createKeyResult: jest.fn(),
      getKeyResultById: jest.fn(),
      updateKeyResult: jest.fn(),
      deleteKeyResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OKRsController],
      providers: [
        {
          provide: OKRsService,
          useValue: mockOKRsService,
        },
      ],
    }).compile();

    controller = module.get<OKRsController>(OKRsController);
    service = module.get(OKRsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOKR', () => {
    const createOKRDto: CreateOKRDto = {
      title: 'Test OKR',
      description: 'Test Description',
      quarter: 'Q3',
      year: 2025,
      objectives: [],
    };

    it('should create OKR successfully', async () => {
      service.createOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.createOKR(mockUser, createOKRDto);

      expect(result).toEqual(mockOKRResponse);
      expect(service.createOKR).toHaveBeenCalledWith(mockUser.id, createOKRDto);
    });

    it('should propagate service errors', async () => {
      const error = new ConflictException('OKR already exists');
      service.createOKR.mockRejectedValue(error);

      await expect(controller.createOKR(mockUser, createOKRDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserOKRs', () => {
    it('should return user OKRs successfully', async () => {
      const mockOKRs = [mockOKRSummary];
      service.getUserOKRs.mockResolvedValue(mockOKRs);

      const result = await controller.getUserOKRs(mockUser);

      expect(result).toEqual(mockOKRs);
      expect(service.getUserOKRs).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when user has no OKRs', async () => {
      service.getUserOKRs.mockResolvedValue([]);

      const result = await controller.getUserOKRs(mockUser);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      service.getUserOKRs.mockRejectedValue(error);

      await expect(controller.getUserOKRs(mockUser)).rejects.toThrow('Database error');
    });
  });

  describe('getOKRById', () => {
    it('should return OKR by ID successfully', async () => {
      service.getOKRById.mockResolvedValue(mockOKRResponse);

      const result = await controller.getOKRById('okr-1');

      expect(result).toEqual(mockOKRResponse);
      expect(service.getOKRById).toHaveBeenCalledWith('okr-1');
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('OKR not found');
      service.getOKRById.mockRejectedValue(error);

      await expect(controller.getOKRById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOKR', () => {
    const updateOKRDto: UpdateOKRDto = {
      title: 'Updated OKR',
      description: 'Updated Description',
    };

    it('should update OKR successfully', async () => {
      service.updateOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.updateOKR('okr-1', mockUser, updateOKRDto);

      expect(result).toEqual(mockOKRResponse);
      expect(service.updateOKR).toHaveBeenCalledWith('okr-1', mockUser.id, updateOKRDto);
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('OKR not found');
      service.updateOKR.mockRejectedValue(error);

      await expect(controller.updateOKR('nonexistent', mockUser, updateOKRDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ConflictException', async () => {
      const error = new ConflictException('Quarter conflict');
      service.updateOKR.mockRejectedValue(error);

      await expect(controller.updateOKR('okr-1', mockUser, updateOKRDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteOKR', () => {
    it('should delete OKR successfully', async () => {
      service.deleteOKR.mockResolvedValue(undefined);

      const result = await controller.deleteOKR('okr-1', mockUser);

      expect(result).toBeUndefined();
      expect(service.deleteOKR).toHaveBeenCalledWith('okr-1', mockUser.id);
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('OKR not found');
      service.deleteOKR.mockRejectedValue(error);

      await expect(controller.deleteOKR('nonexistent', mockUser)).rejects.toThrow(
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
      service.createObjective.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.createObjective('okr-1', createObjectiveDto);

      expect(result).toEqual(mockObjectiveResponse);
      expect(service.createObjective).toHaveBeenCalledWith('okr-1', createObjectiveDto);
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('OKR not found');
      service.createObjective.mockRejectedValue(error);

      await expect(controller.createObjective('nonexistent', createObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getObjectiveById', () => {
    it('should return objective by ID successfully', async () => {
      service.getObjectiveById.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.getObjectiveById('obj-1');

      expect(result).toEqual(mockObjectiveResponse);
      expect(service.getObjectiveById).toHaveBeenCalledWith('obj-1');
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Objective not found');
      service.getObjectiveById.mockRejectedValue(error);

      await expect(controller.getObjectiveById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateObjective', () => {
    const updateObjectiveDto: UpdateObjectiveDto = {
      title: 'Updated Objective',
      description: 'Updated Description',
    };

    it('should update objective successfully', async () => {
      service.updateObjective.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.updateObjective('obj-1', updateObjectiveDto);

      expect(result).toEqual(mockObjectiveResponse);
      expect(service.updateObjective).toHaveBeenCalledWith('obj-1', updateObjectiveDto);
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Objective not found');
      service.updateObjective.mockRejectedValue(error);

      await expect(controller.updateObjective('nonexistent', updateObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteObjective', () => {
    it('should delete objective successfully', async () => {
      service.deleteObjective.mockResolvedValue(undefined);

      const result = await controller.deleteObjective('obj-1');

      expect(result).toBeUndefined();
      expect(service.deleteObjective).toHaveBeenCalledWith('obj-1');
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Objective not found');
      service.deleteObjective.mockRejectedValue(error);

      await expect(controller.deleteObjective('nonexistent')).rejects.toThrow(NotFoundException);
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
      service.createKeyResult.mockResolvedValue(mockKeyResultResponse);

      const result = await controller.createKeyResult('obj-1', createKeyResultDto);

      expect(result).toEqual(mockKeyResultResponse);
      expect(service.createKeyResult).toHaveBeenCalledWith('obj-1', createKeyResultDto);
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Objective not found');
      service.createKeyResult.mockRejectedValue(error);

      await expect(controller.createKeyResult('nonexistent', createKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ConflictException', async () => {
      const error = new ConflictException('Key result with same title exists');
      service.createKeyResult.mockRejectedValue(error);

      await expect(controller.createKeyResult('obj-1', createKeyResultDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getKeyResultById', () => {
    it('should return key result by ID successfully', async () => {
      service.getKeyResultById.mockResolvedValue(mockKeyResultResponse);

      const result = await controller.getKeyResultById('kr-1');

      expect(result).toEqual(mockKeyResultResponse);
      expect(service.getKeyResultById).toHaveBeenCalledWith('kr-1');
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Key result not found');
      service.getKeyResultById.mockRejectedValue(error);

      await expect(controller.getKeyResultById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateKeyResult', () => {
    const updateKeyResultDto: UpdateKeyResultDto = {
      title: 'Updated Key Result',
      description: 'Updated Description',
      currentValue: 75,
    };

    it('should update key result successfully', async () => {
      service.updateKeyResult.mockResolvedValue(mockKeyResultResponse);

      const result = await controller.updateKeyResult('kr-1', updateKeyResultDto);

      expect(result).toEqual(mockKeyResultResponse);
      expect(service.updateKeyResult).toHaveBeenCalledWith('kr-1', updateKeyResultDto);
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Key result not found');
      service.updateKeyResult.mockRejectedValue(error);

      await expect(controller.updateKeyResult('nonexistent', updateKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteKeyResult', () => {
    it('should delete key result successfully', async () => {
      service.deleteKeyResult.mockResolvedValue(undefined);

      const result = await controller.deleteKeyResult('kr-1');

      expect(result).toBeUndefined();
      expect(service.deleteKeyResult).toHaveBeenCalledWith('kr-1');
    });

    it('should propagate NotFoundException', async () => {
      const error = new NotFoundException('Key result not found');
      service.deleteKeyResult.mockRejectedValue(error);

      await expect(controller.deleteKeyResult('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty objectives array', async () => {
      const createOKRDto = {
        title: 'Test OKR',
        description: 'Test Description',
        quarter: 'Q3',
        year: 2025,
        objectives: [],
      };

      service.createOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.createOKR(mockUser, createOKRDto);

      expect(result).toEqual(mockOKRResponse);
    });

    it('should handle empty key results array', async () => {
      const createObjectiveDto = {
        title: 'Test Objective',
        description: 'Test Description',
        keyResults: [],
      };

      service.createObjective.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.createObjective('okr-1', createObjectiveDto);

      expect(result).toEqual(mockObjectiveResponse);
    });

    it('should handle partial update DTOs', async () => {
      const partialUpdateOKRDto = { title: 'Updated Title' };
      service.updateOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.updateOKR('okr-1', mockUser, partialUpdateOKRDto);

      expect(result).toEqual(mockOKRResponse);
    });
  });
}); 