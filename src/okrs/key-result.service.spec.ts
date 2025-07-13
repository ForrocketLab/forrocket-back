import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { KeyResultStatus, KeyResultType, ObjectiveStatus } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { KeyResultService } from './key-result.service';
import { ObjectiveService } from './objective.service';

import {
  CreateKeyResultDto,
  UpdateKeyResultDto,
  KeyResultResponseDto,
} from './dto';

describe('KeyResultService', () => {
  let service: KeyResultService;
  let prismaService: jest.Mocked<PrismaService>;
  let objectiveService: jest.Mocked<ObjectiveService>;

  const mockObjective = {
    id: 'obj-1',
    okrId: 'okr-1',
    title: 'Objetivo Pai',
    description: 'Descrição do Objetivo Pai',
    status: ObjectiveStatus.NOT_STARTED,
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
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
  };

  beforeEach(async () => {
    const mockPrismaService = {
      objective: {
        findUnique: jest.fn(), 
      },
      keyResult: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockObjectiveService = {
      updateObjectiveProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyResultService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ObjectiveService, useValue: mockObjectiveService },
      ],
    }).compile();

    service = module.get<KeyResultService>(KeyResultService);
    prismaService = module.get(PrismaService);
    objectiveService = module.get(ObjectiveService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createKeyResult', () => {
    const createKeyResultDto: CreateKeyResultDto = {
      title: 'Resultado-Chave de Teste',
      description: 'Descrição de Teste',
      type: KeyResultType.NUMBER,
      targetValue: 100,
      currentValue: 50,
      unit: 'itens',
    };

    it('deve criar um resultado-chave com sucesso', async () => {
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
      expect(objectiveService.updateObjectiveProgress).toHaveBeenCalledWith('obj-1');
    });

    it('deve lançar NotFoundException quando o objetivo não for encontrado', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createKeyResult('naoexistente', createKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException quando já existir um resultado-chave com o mesmo título', async () => {
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.keyResult.findFirst as jest.Mock).mockResolvedValue(mockKeyResult);

      await expect(service.createKeyResult('obj-1', createKeyResultDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve definir o status como COMPLETED se o valor atual atingir o alvo (tipo NUMERO)', async () => {
      const completedDto = { ...createKeyResultDto, currentValue: 100 };
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.keyResult.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.keyResult.create as jest.Mock).mockResolvedValue({ ...mockKeyResult, status: KeyResultStatus.COMPLETED });

      const result = await service.createKeyResult('obj-1', completedDto);

      expect(prismaService.keyResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: KeyResultStatus.COMPLETED }),
        }),
      );
      expect(result.status).toBe(KeyResultStatus.COMPLETED);
    });

    it('deve definir o status como IN_PROGRESS se o valor atual for positivo, mas não atingir o alvo (tipo NUMERO)', async () => {
      const inProgressDto = { ...createKeyResultDto, currentValue: 1 };
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.keyResult.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.keyResult.create as jest.Mock).mockResolvedValue({ ...mockKeyResult, status: KeyResultStatus.IN_PROGRESS });

      const result = await service.createKeyResult('obj-1', inProgressDto);

      expect(prismaService.keyResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: KeyResultStatus.IN_PROGRESS }),
        }),
      );
      expect(result.status).toBe(KeyResultStatus.IN_PROGRESS);
    });

    it('deve definir o status como NOT_STARTED se o valor atual for 0 (tipo NUMERO)', async () => {
      const notStartedDto = { ...createKeyResultDto, currentValue: 0 };
      (prismaService.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective);
      (prismaService.keyResult.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.keyResult.create as jest.Mock).mockResolvedValue({ ...mockKeyResult, status: KeyResultStatus.NOT_STARTED });

      const result = await service.createKeyResult('obj-1', notStartedDto);

      expect(prismaService.keyResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: KeyResultStatus.NOT_STARTED }),
        }),
      );
      expect(result.status).toBe(KeyResultStatus.NOT_STARTED);
    });
  });

  describe('getKeyResultById', () => {
    it('deve retornar o resultado-chave por ID com sucesso', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(mockKeyResult);
      service['mapToKeyResultResponse'] = jest.fn().mockReturnValue(mockKeyResult);

      const result = await service.getKeyResultById('kr-1');

      expect(result).toBeDefined();
      expect(prismaService.keyResult.findUnique).toHaveBeenCalledWith({
        where: { id: 'kr-1' },
      });
      expect(result).toEqual(mockKeyResult);
    });

    it('deve lançar NotFoundException quando o resultado-chave não for encontrado', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getKeyResultById('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateKeyResult', () => {
    const updateKeyResultDto: UpdateKeyResultDto = {
      title: 'Resultado-Chave Atualizado',
      description: 'Descrição Atualizada',
      currentValue: 75,
    };

    it('deve atualizar o resultado-chave com sucesso', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(mockKeyResult);
      (prismaService.keyResult.update as jest.Mock).mockResolvedValue(mockKeyResult);
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValueOnce(mockKeyResult);
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValueOnce(mockKeyResult);

      service['calculateKeyResultProgress'] = jest.fn().mockReturnValue(75);
      service['mapToKeyResultResponse'] = jest.fn().mockReturnValue(mockKeyResult);

      const result = await service.updateKeyResult('kr-1', updateKeyResultDto);

      expect(result).toBeDefined();
      expect(prismaService.keyResult.update).toHaveBeenCalledWith({
        where: { id: 'kr-1' },
        data: expect.objectContaining({
          title: updateKeyResultDto.title,
          description: updateKeyResultDto.description,
          currentValue: updateKeyResultDto.currentValue,
          status: KeyResultStatus.IN_PROGRESS,
        }),
      });
      expect(objectiveService.updateObjectiveProgress).toHaveBeenCalledWith(mockKeyResult.objectiveId);
      expect(result).toEqual(mockKeyResult);
    });

    it('deve atualizar o status do resultado-chave para COMPLETED se o valor atual atingir o alvo', async () => {
      const krBeforeUpdate = { ...mockKeyResult, currentValue: 90 };
      const updateDto = { currentValue: 100 };

      (prismaService.keyResult.findUnique as jest.Mock)
        .mockResolvedValueOnce(krBeforeUpdate)
        .mockResolvedValueOnce({ ...krBeforeUpdate, ...updateDto });
      (prismaService.keyResult.update as jest.Mock).mockResolvedValue({ ...mockKeyResult, status: KeyResultStatus.COMPLETED });

      service['calculateKeyResultProgress'] = jest.fn().mockReturnValue(100);
      service['mapToKeyResultResponse'] = jest.fn().mockReturnValue({ ...mockKeyResult, status: KeyResultStatus.COMPLETED });

      const result = await service.updateKeyResult('kr-1', updateDto);

      expect(prismaService.keyResult.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: KeyResultStatus.COMPLETED }),
        }),
      );
      expect(result.status).toBe(KeyResultStatus.COMPLETED);
    });

    it('deve lançar NotFoundException quando o resultado-chave não for encontrado', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateKeyResult('naoexistente', updateKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteKeyResult', () => {
    it('deve excluir o resultado-chave com sucesso', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(mockKeyResult);
      (prismaService.keyResult.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteKeyResult('kr-1');

      expect(prismaService.keyResult.delete).toHaveBeenCalledWith({
        where: { id: 'kr-1' },
      });
      expect(objectiveService.updateObjectiveProgress).toHaveBeenCalledWith(mockKeyResult.objectiveId);
    });

    it('deve lançar NotFoundException quando o resultado-chave não for encontrado', async () => {
      (prismaService.keyResult.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteKeyResult('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ==========================================
  // Testes para MÉTODOS AUXILIARES (do KeyResultService)
  // ==========================================

  describe('calculateKeyResultProgress', () => {
    it('deve calcular o progresso corretamente para o tipo NUMERO', () => {
      const keyResult = { type: KeyResultType.NUMBER, currentValue: 50, targetValue: 100 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(50);
    });

    it('deve retornar 0 quando targetValue for 0 para o tipo NUMERO', () => {
      const keyResult = { type: KeyResultType.NUMBER, currentValue: 50, targetValue: 0 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(0);
    });

    it('deve limitar o progresso a 100 para o tipo NUMERO', () => {
      const keyResult = { type: KeyResultType.NUMBER, currentValue: 150, targetValue: 100 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(100);
    });

    it('deve limitar o progresso a 0 para valores negativos para o tipo NUMERO', () => {
      const keyResult = { type: KeyResultType.NUMBER, currentValue: -10, targetValue: 100 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(0);
    });

    it('deve calcular o progresso corretamente para o tipo PORCENTAGEM', () => {
      const keyResult = { type: KeyResultType.PERCENTAGE, currentValue: 75, targetValue: 100 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(75);
    });

    it('deve limitar o progresso a 100 para o tipo PORCENTAGEM', () => {
      const keyResult = { type: KeyResultType.PERCENTAGE, currentValue: 120, targetValue: 100 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(100);
    });

    it('deve limitar o progresso a 0 para valores negativos de PORCENTAGEM', () => {
      const keyResult = { type: KeyResultType.PERCENTAGE, currentValue: -20, targetValue: 100 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(0);
    });

    it('deve calcular o progresso corretamente para o tipo BINARIO (concluído)', () => {
      const keyResult = { type: KeyResultType.BINARY, currentValue: 1, targetValue: 1 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(100);
    });

    it('deve calcular o progresso corretamente para o tipo BINARIO (não concluído)', () => {
      const keyResult = { type: KeyResultType.BINARY, currentValue: 0, targetValue: 1 };
      expect(service['calculateKeyResultProgress'](keyResult)).toBe(0);
    });
  });

  describe('formatValue', () => {
    it('deve formatar valores do tipo PORCENTAGEM', () => {
      expect(service['formatValue'](75, KeyResultType.PERCENTAGE)).toBe('75%');
    });

    it('deve formatar valores do tipo BINARIO', () => {
      expect(service['formatValue'](1, KeyResultType.BINARY, undefined, 1)).toBe('Sim');
      expect(service['formatValue'](0, KeyResultType.BINARY, undefined, 1)).toBe('Não');
    });

    it('deve formatar valores do tipo NUMERO com unidade', () => {
      expect(service['formatValue'](100, KeyResultType.NUMBER, 'itens')).toBe('100 itens');
    });

    it('deve formatar valores do tipo NUMERO sem unidade', () => {
      expect(service['formatValue'](100, KeyResultType.NUMBER)).toBe('100');
    });
  });

  describe('mapToKeyResultResponse', () => {
    it('deve mapear corretamente os dados do resultado-chave para KeyResultResponseDto', () => {
      service.calculateKeyResultProgress = jest.fn().mockReturnValue(50);
      service.formatValue = jest.fn()
        .mockReturnValueOnce('50 itens')
        .mockReturnValueOnce('100 itens'); 

      const result = service.mapToKeyResultResponse(mockKeyResult);

      expect(result).toEqual({
        id: mockKeyResult.id,
        objectiveId: mockKeyResult.objectiveId,
        title: mockKeyResult.title,
        description: mockKeyResult.description,
        type: mockKeyResult.type,
        targetValue: mockKeyResult.targetValue,
        currentValue: mockKeyResult.currentValue,
        unit: mockKeyResult.unit,
        status: mockKeyResult.status,
        progress: 50,
        formattedCurrentValue: '50 itens',
        formattedTargetValue: '100 itens',
        createdAt: mockKeyResult.createdAt,
        updatedAt: mockKeyResult.updatedAt,
      });
      expect(service.formatValue).toHaveBeenCalledWith(mockKeyResult.currentValue, mockKeyResult.type, mockKeyResult.unit, mockKeyResult.targetValue);
      expect(service.formatValue).toHaveBeenCalledWith(mockKeyResult.targetValue, mockKeyResult.type, mockKeyResult.unit);
    });
  });
});