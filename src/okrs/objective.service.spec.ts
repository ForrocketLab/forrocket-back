import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OKRStatus, ObjectiveStatus, KeyResultStatus, KeyResultType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { ObjectiveService } from './objective.service';
import { KeyResultService } from './key-result.service';
import { OkrService } from './okr.service'; 

import {
  CreateObjectiveDto,
  UpdateObjectiveDto,
  ObjectiveResponseDto,
} from './dto';

describe('ObjectiveService', () => {
  let service: ObjectiveService;
  let prismaService: jest.Mocked<PrismaService>;
  let keyResultService: jest.Mocked<KeyResultService>;
  let okrService: jest.Mocked<OkrService>;

  const mockOKR = {
    id: 'okr-1',
    userId: 'user-1',
    title: 'OKR de Teste',
    description: 'Descrição de Teste',
    quarter: '2025-Q3',
    year: 2025,
    status: OKRStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockObjective = {
    id: 'obj-1',
    okrId: 'okr-1',
    title: 'Objetivo de Teste',
    description: 'Descrição do Objetivo de Teste',
    status: ObjectiveStatus.NOT_STARTED,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    keyResults: [],
  };

  const mockKeyResult = { 
    id: 'kr-1',
    objectiveId: 'obj-1',
    title: 'Resultado-Chave de Teste',
    description: 'Descrição do Resultado-Chave de Teste',
    type: KeyResultType.NUMBER,
    targetValue: 100,
    currentValue: 50,
    unit: 'itens',
    status: KeyResultStatus.IN_PROGRESS,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 50, // Calculado (currentValue / targetValue) * 100
    formattedCurrentValue: '50 itens', // Formatação do currentValue
    formattedTargetValue: '100 itens', // Formatação do targetValue
  };

  beforeEach(async () => {
    const mockPrismaService = {
      oKR: {
        findUnique: jest.fn(),
      },
      objective: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      keyResult: {
        findMany: jest.fn(),
      },
    };

    const mockKeyResultService = {
      createKeyResult: jest.fn(),
      mapToKeyResultResponse: jest.fn().mockImplementation(kr => ({ 
        ...kr,
        progress: kr.progress || 0,
        formattedCurrentValue: kr.formattedCurrentValue || '',
        formattedTargetValue: kr.formattedTargetValue || '',
      })),
      calculateKeyResultProgress: jest.fn(), 
    };

    const mockOkrService = {
      updateOKRProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjectiveService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: KeyResultService, useValue: mockKeyResultService },
        { provide: OkrService, useValue: mockOkrService },
      ],
    }).compile();

    service = module.get<ObjectiveService>(ObjectiveService);
    prismaService = module.get(PrismaService);
    keyResultService = module.get(KeyResultService);
    okrService = module.get(OkrService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createObjective', () => {
    const createObjectiveDto: CreateObjectiveDto = {
      title: 'Objetivo de Teste',
      description: 'Descrição de Teste',
      keyResults: [],
    };

    it('deve criar um objetivo com sucesso sem resultados-chave', async () => {
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
      });
      expect(keyResultService.createKeyResult).not.toHaveBeenCalled();
      expect(okrService.updateOKRProgress).toHaveBeenCalledWith('okr-1');
    });

    it('deve criar um objetivo com sucesso com resultados-chave aninhados', async () => {
      const createObjectiveDtoWithKRs: CreateObjectiveDto = {
        title: 'Objetivo de Teste com RCs',
        description: 'Desc',
        keyResults: [{
          title: 'RC 1',
          description: 'Desc RC 1',
          type: KeyResultType.NUMBER,
          targetValue: 100,
          currentValue: 0,
          unit: 'unidades',
        }],
      };
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.objective.create as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue({
        ...mockObjective,
        keyResults: [mockKeyResult],
      });
      keyResultService.createKeyResult.mockResolvedValue(mockKeyResult);

      const result = await service.createObjective('okr-1', createObjectiveDtoWithKRs);

      expect(result).toBeDefined();
      expect(prismaService.objective.create).toHaveBeenCalledTimes(1);
      expect(keyResultService.createKeyResult).toHaveBeenCalledWith(
        mockObjective.id,
        createObjectiveDtoWithKRs.keyResults![0],
      );
      expect(okrService.updateOKRProgress).toHaveBeenCalledWith('okr-1');
    });

    it('deve lançar NotFoundException quando o OKR não for encontrado', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createObjective('naoexistente', createObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getObjectiveById', () => {
    it('deve retornar o objetivo por ID com sucesso', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue({
        ...mockObjective,
        keyResults: [mockKeyResult],
      });
      keyResultService.mapToKeyResultResponse.mockImplementation(kr => kr);

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
      expect(result).toEqual({
        ...mockObjective,
        keyResults: [mockKeyResult],
      });
    });

    it('deve lançar NotFoundException quando o objetivo não for encontrado', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getObjectiveById('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateObjective', () => {
    const updateObjectiveDto: UpdateObjectiveDto = {
      title: 'Objetivo Atualizado',
      description: 'Descrição Atualizada',
    };

    it('deve atualizar o objetivo com sucesso', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValueOnce(mockObjective);
      (prismaService.objective.update as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValueOnce(mockObjective);

      const result = await service.updateObjective('obj-1', updateObjectiveDto);

      expect(result).toBeDefined();
      expect(prismaService.objective.update).toHaveBeenCalledWith({
        where: { id: 'obj-1' },
        data: updateObjectiveDto,
      });
      expect(okrService.updateOKRProgress).not.toHaveBeenCalled();
      expect(result).toEqual(mockObjective);
    });

    it('deve atualizar o progresso do objetivo e o progresso do OKR pai se o progresso mudar', async () => {
      const updateDtoWithProgress: UpdateObjectiveDto = { progress: 75 };
      const objectiveBeforeUpdate = { ...mockObjective, progress: 50 };
      const objectiveAfterUpdate = { ...mockObjective, progress: 75 };

      (prismaService.objective.findUnique as jest.Mock)
        .mockResolvedValueOnce(objectiveBeforeUpdate)
        .mockResolvedValueOnce({ ...objectiveAfterUpdate, keyResults: [] });

      (prismaService.objective.update as jest.Mock).mockResolvedValue(objectiveAfterUpdate);

      const spyOnUpdateObjectiveProgress = jest.spyOn(service, 'updateObjectiveProgress').mockResolvedValue(undefined);

      const result = await service.updateObjective('obj-1', updateDtoWithProgress);

      expect(prismaService.objective.update).toHaveBeenCalledWith({
        where: { id: 'obj-1' },
        data: updateDtoWithProgress,
      });
      expect(spyOnUpdateObjectiveProgress).toHaveBeenCalledWith('obj-1');
      expect(result).toBeDefined();

      spyOnUpdateObjectiveProgress.mockRestore();
    });

    it('deve lançar NotFoundException quando o objetivo não for encontrado', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateObjective('naoexistente', updateObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteObjective', () => {
    it('deve excluir o objetivo com sucesso', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.objective.delete as jest.Mock).mockResolvedValue(undefined);

      const spyOnUpdateObjectiveProgress = jest.spyOn(service, 'updateObjectiveProgress').mockResolvedValue(undefined);

      await service.deleteObjective('obj-1');

      expect(prismaService.objective.delete).toHaveBeenCalledWith({
        where: { id: 'obj-1' },
      });
      expect(spyOnUpdateObjectiveProgress).toHaveBeenCalledWith(mockObjective.okrId);

      spyOnUpdateObjectiveProgress.mockRestore();
    });

    it('deve lançar NotFoundException quando o objetivo não for encontrado', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteObjective('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateObjectiveProgress', () => {
    beforeEach(() => {
      (prismaService.objective.findUnique as jest.Mock).mockClear();
      (prismaService.objective.update as jest.Mock).mockClear();
      keyResultService.calculateKeyResultProgress.mockClear();
      okrService.updateOKRProgress.mockClear();
    });

    it('deve atualizar o progresso do objetivo com base na média dos resultados-chave', async () => {
      const objectiveWithKRs = {
        ...mockObjective,
        keyResults: [
          { ...mockKeyResult, currentValue: 100, targetValue: 100, type: KeyResultType.NUMBER },
          { ...mockKeyResult, currentValue: 50, targetValue: 100, type: KeyResultType.NUMBER },
        ],
      };
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(objectiveWithKRs);
      keyResultService.calculateKeyResultProgress
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(50);

      (prismaService.objective.update as jest.Mock).mockResolvedValue(objectiveWithKRs);

      await service.updateObjectiveProgress(objectiveWithKRs.id);

      expect(prismaService.objective.findUnique).toHaveBeenCalledWith({
        where: { id: objectiveWithKRs.id },
        include: { keyResults: true },
      });
      expect(keyResultService.calculateKeyResultProgress).toHaveBeenCalledTimes(2);
      expect(prismaService.objective.update).toHaveBeenCalledWith({
        where: { id: objectiveWithKRs.id },
        data: { progress: 75, status: ObjectiveStatus.IN_PROGRESS },
      });
      expect(okrService.updateOKRProgress).toHaveBeenCalledWith(objectiveWithKRs.okrId);
    });

    it('deve definir o objetivo como COMPLETED se todos os RCs estiverem 100%', async () => {
      const objectiveWithCompletedKRs = {
        ...mockObjective,
        keyResults: [
          { ...mockKeyResult, currentValue: 100, targetValue: 100, type: KeyResultType.NUMBER },
          { ...mockKeyResult, currentValue: 1, type: KeyResultType.BINARY, targetValue: 1 },
        ],
      };
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(objectiveWithCompletedKRs);
      keyResultService.calculateKeyResultProgress
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(100);

      (prismaService.objective.update as jest.Mock).mockResolvedValue(objectiveWithCompletedKRs);

      await service.updateObjectiveProgress(objectiveWithCompletedKRs.id);

      expect(prismaService.objective.findUnique).toHaveBeenCalledWith({
        where: { id: objectiveWithCompletedKRs.id },
        include: { keyResults: true },
      });
      expect(keyResultService.calculateKeyResultProgress).toHaveBeenCalledTimes(2);
      expect(prismaService.objective.update).toHaveBeenCalledWith({
        where: { id: objectiveWithCompletedKRs.id },
        data: { progress: 100, status: ObjectiveStatus.COMPLETED },
      });
      expect(okrService.updateOKRProgress).toHaveBeenCalledWith(objectiveWithCompletedKRs.okrId);
    });

    it('deve atualizar o objetivo para NOT_STARTED se não tiver resultados-chave', async () => {
      const objectiveWithoutKRs = { ...mockObjective, keyResults: [] };
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(objectiveWithoutKRs);

      (prismaService.objective.update as jest.Mock).mockResolvedValue({
        ...objectiveWithoutKRs,
        progress: 0,
        status: ObjectiveStatus.NOT_STARTED
      });

      await service.updateObjectiveProgress(objectiveWithoutKRs.id);

      expect(prismaService.objective.findUnique).toHaveBeenCalledWith({
        where: { id: objectiveWithoutKRs.id },
        include: { keyResults: true },
      });
      expect(prismaService.objective.update).toHaveBeenCalledWith({
        where: { id: objectiveWithoutKRs.id },
        data: { progress: 0, status: ObjectiveStatus.NOT_STARTED },
      });
      expect(okrService.updateOKRProgress).toHaveBeenCalledWith(objectiveWithoutKRs.okrId);
    });
  });

  describe('mapToObjectiveResponse', () => {
    it('deve mapear corretamente os dados do objetivo para ObjectiveResponseDto', () => {
      keyResultService.mapToKeyResultResponse.mockImplementation(kr => ({ ...kr, progress: 50 }));

      const objectiveWithKRs = {
        ...mockObjective,
        keyResults: [mockKeyResult],
      };
      const result = service.mapToObjectiveResponse(objectiveWithKRs);

      expect(result).toEqual({
        id: objectiveWithKRs.id,
        okrId: objectiveWithKRs.okrId,
        title: objectiveWithKRs.title,
        description: objectiveWithKRs.description,
        status: objectiveWithKRs.status,
        progress: objectiveWithKRs.progress,
        createdAt: objectiveWithKRs.createdAt,
        updatedAt: objectiveWithKRs.updatedAt,
        keyResults: [mockKeyResult],
      });
      expect(keyResultService.mapToKeyResultResponse).toHaveBeenCalledWith(mockKeyResult);
    });

    it('deve lidar com objetivo sem resultados-chave', () => {
      keyResultService.mapToKeyResultResponse.mockReset();
      const result = service.mapToObjectiveResponse(mockObjective);
      expect(result.keyResults).toEqual([]);
      expect(keyResultService.mapToKeyResultResponse).not.toHaveBeenCalled();
    });
  });
});