import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OKRStatus, ObjectiveStatus, KeyResultStatus, KeyResultType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { OkrService } from './okr.service'; 
import { ObjectiveService } from './objective.service'; 
import { KeyResultService } from './key-result.service';

import {
  CreateOKRDto,
  UpdateOKRDto,
} from './dto';

describe('OkrService', () => { 
  let service: OkrService; 
  let prismaService: jest.Mocked<PrismaService>;
  let objectiveService: jest.Mocked<ObjectiveService>;
  let keyResultService: jest.Mocked<KeyResultService>;

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
    objectives: [],
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
    progress: 50,
    formattedCurrentValue: '50 itens',
    formattedTargetValue: '100 itens',
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
      objective: {},
      keyResult: {},
    };

    const mockObjectiveService = {
      createObjective: jest.fn(),
      getObjectiveById: jest.fn(),
      updateObjective: jest.fn(),
      deleteObjective: jest.fn(),
      mapToObjectiveResponse: jest.fn(),
      updateObjectiveProgress: jest.fn(),
    };

    const mockKeyResultService = {
      createKeyResult: jest.fn(),
      getKeyResultById: jest.fn(),
      updateKeyResult: jest.fn(),
      deleteKeyResult: jest.fn(),
      mapToKeyResultResponse: jest.fn(),
      calculateKeyResultProgress: jest.fn(), 
      formatValue: jest.fn(), 
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OkrService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ObjectiveService,
          useValue: mockObjectiveService,
        },
        {
          provide: KeyResultService,
          useValue: mockKeyResultService,
        },
      ],
    }).compile();

    service = module.get<OkrService>(OkrService);
    prismaService = module.get(PrismaService);
    objectiveService = module.get(ObjectiveService);
    keyResultService = module.get(KeyResultService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // Testes para OPERAÇÕES DE OKR
  // ==========================================

  describe('createOKR', () => {
    const createOKRDto: CreateOKRDto = {
      title: 'OKR de Teste',
      description: 'Descrição de Teste',
      quarter: '2025-Q3',
      year: 2025,
      objectives: [],
    };

    it('deve criar OKR com sucesso sem objetivos', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.oKR.create as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue({
        ...mockOKR,
        objectives: [],
      });
      objectiveService.mapToObjectiveResponse.mockImplementation(obj => obj);

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
      });
      expect(objectiveService.createObjective).not.toHaveBeenCalled();
    });

    it('deve criar OKR com sucesso com objetivos e resultados-chave aninhados', async () => {
      const createOKRDtoWithObjectives: CreateOKRDto = {
        title: 'OKR de Teste com Objetivos',
        description: 'Descrição de Teste',
        quarter: '2025-Q3',
        year: 2025,
        objectives: [
          {
            title: 'Obj 1',
            description: 'Desc Obj 1',
            keyResults: [{
              title: 'RC 1',
              description: 'Desc RC 1',
              type: KeyResultType.NUMBER,
              targetValue: 100,
              currentValue: 0,
              unit: 'unidades',
            }],
          },
        ],
      };

      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.oKR.create as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue({
        ...mockOKR,
        objectives: [{ ...mockObjective, keyResults: [{ ...mockKeyResult }] }],
      });
      objectiveService.createObjective.mockResolvedValue(mockObjective);
      objectiveService.mapToObjectiveResponse.mockImplementation(obj => obj);

      const result = await service.createOKR('user-1', createOKRDtoWithObjectives);

      expect(result).toBeDefined();
      expect(prismaService.oKR.create).toHaveBeenCalledTimes(1);
      expect(objectiveService.createObjective).toHaveBeenCalledWith(
        mockOKR.id,
        createOKRDtoWithObjectives.objectives![0],
      );
    });

    it('deve lançar ConflictException quando o OKR já existe para o mesmo trimestre/ano', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(mockOKR);

      await expect(service.createOKR('user-1', createOKRDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar BadRequestException para ano inválido', async () => {
      const invalidDto = { ...createOKRDto, year: 2024 };

      await expect(service.createOKR('user-1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException para trimestre inválido em 2025', async () => {
      const invalidDto = { ...createOKRDto, quarter: '2025-Q1', year: 2025 };

      await expect(service.createOKR('user-1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserOKRs', () => {
    it('deve retornar os OKRs do usuário com sucesso', async () => {
      const mockOKRs = [mockOKR];
      (prismaService.oKR.findMany as jest.Mock).mockResolvedValue(mockOKRs);
      service['mapToOKRSummary'] = jest.fn().mockReturnValue(mockOKR);

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
      expect(result).toEqual([mockOKR]);
    });

    it('deve retornar um array vazio quando o usuário não tiver OKRs', async () => {
      (prismaService.oKR.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserOKRs('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOKRById', () => {
    it('deve retornar OKR por ID com sucesso', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);
      service['mapToOKRResponse'] = jest.fn().mockReturnValue(mockOKR);

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
      expect(result).toEqual(mockOKR);
    });

    it('deve lançar NotFoundException quando o OKR não for encontrado', async () => {
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getOKRById('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOKR', () => {
    const updateOKRDto: UpdateOKRDto = {
      title: 'OKR Atualizado',
      description: 'Descrição Atualizada',
    };

    it('deve atualizar OKR com sucesso', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.update as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(mockOKR);
      service['mapToOKRResponse'] = jest.fn().mockReturnValue(mockOKR);

      const result = await service.updateOKR('okr-1', 'user-1', updateOKRDto);

      expect(result).toBeDefined();
      expect(prismaService.oKR.update).toHaveBeenCalledWith({
        where: { id: 'okr-1' },
        data: updateOKRDto,
      });
      expect(result).toEqual(mockOKR);
    });

    it('deve lançar NotFoundException quando o OKR não for encontrado', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.updateOKR('naoexistente', 'user-1', updateOKRDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException ao tentar atualizar para um trimestre/ano já existente', async () => {
      const existingOKR = { ...mockOKR, id: 'okr-2' };
      (prismaService.oKR.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockOKR)
        .mockResolvedValueOnce(existingOKR);

      const updateDtoWithConflict: UpdateOKRDto = { quarter: '2025-Q3', year: 2025 };

      await expect(service.updateOKR('okr-1', 'user-1', updateDtoWithConflict)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteOKR', () => {
    it('deve excluir OKR com sucesso', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(mockOKR);
      (prismaService.oKR.delete as jest.Mock).mockResolvedValue(mockOKR);

      await service.deleteOKR('okr-1', 'user-1');

      expect(prismaService.oKR.delete).toHaveBeenCalledWith({
        where: { id: 'okr-1' },
      });
    });

    it('deve lançar NotFoundException quando o OKR não for encontrado', async () => {
      (prismaService.oKR.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteOKR('naoexistente', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================
  // Testes para MÉTODOS PÚBLICOS AUXILIARES (do OkrService)
  // ==========================================

  describe('updateOKRProgress', () => {
    beforeEach(() => {
      (prismaService.oKR.findUnique as jest.Mock).mockClear();
      (prismaService.oKR.update as jest.Mock).mockClear();
      objectiveService.mapToObjectiveResponse.mockClear();
      objectiveService.createObjective.mockClear();
      objectiveService.updateObjectiveProgress.mockClear();
    });

    it('deve atualizar o status do OKR para COMPLETED se todos os objetivos estiverem 100% e o OKR estiver ATIVO', async () => {
      const okrWithCompletedObjectives = {
        ...mockOKR,
        status: OKRStatus.ACTIVE,
        objectives: [
          { id: 'obj-1', progress: 100 },
          { id: 'obj-2', progress: 100 },
        ],
      };
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(okrWithCompletedObjectives);
      (prismaService.oKR.update as jest.Mock).mockResolvedValue({ ...okrWithCompletedObjectives, status: OKRStatus.COMPLETED });

      await service.updateOKRProgress(okrWithCompletedObjectives.id); 

      expect(prismaService.oKR.update).toHaveBeenCalledWith({
        where: { id: okrWithCompletedObjectives.id },
        data: { status: OKRStatus.COMPLETED },
      });
    });

    it('deve reverter o status do OKR para ACTIVE se o progresso cair abaixo de 100% e o OKR estava COMPLETED', async () => {
      const okrWithPartialObjectives = {
        ...mockOKR,
        status: OKRStatus.COMPLETED,
        objectives: [
          { id: 'obj-1', progress: 50 },
          { id: 'obj-2', progress: 100 },
        ],
      };
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(okrWithPartialObjectives);
      (prismaService.oKR.update as jest.Mock).mockResolvedValue({ ...okrWithPartialObjectives, status: OKRStatus.ACTIVE });

      await service.updateOKRProgress(okrWithPartialObjectives.id);

      expect(prismaService.oKR.update).toHaveBeenCalledWith({
        where: { id: okrWithPartialObjectives.id },
        data: { status: OKRStatus.ACTIVE },
      });
    });

    it('não deve atualizar o status do OKR se o progresso permanecer consistente', async () => {
      const okrWithConsistentProgress = {
        ...mockOKR,
        status: OKRStatus.ACTIVE,
        objectives: [
          { id: 'obj-1', progress: 50 },
          { id: 'obj-2', progress: 50 },
        ],
      };
      (prismaService.oKR.findUnique as jest.Mock).mockResolvedValue(okrWithConsistentProgress);
      (prismaService.oKR.update as jest.Mock).mockResolvedValue(okrWithConsistentProgress);

      await service.updateOKRProgress(okrWithConsistentProgress.id);

      expect(prismaService.oKR.update).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Testes para MÉTODOS PRIVADOS AUXILIARES (do OkrService)
  // ==========================================

  describe('validateQuarterPeriod', () => {
    it('deve permitir períodos válidos', () => {
      expect(() => service['validateQuarterPeriod']('2025-Q3', 2025)).not.toThrow();
      expect(() => service['validateQuarterPeriod']('2025-Q4', 2025)).not.toThrow();
      expect(() => service['validateQuarterPeriod']('2026-Q1', 2026)).not.toThrow();
    });

    it('deve lançar BadRequestException para anos anteriores a 2025', () => {
      expect(() => service['validateQuarterPeriod']('Q3', 2024)).toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para trimestres inválidos em 2025', () => {
      expect(() => service['validateQuarterPeriod']('2025-Q1', 2025)).toThrow(BadRequestException);
      expect(() => service['validateQuarterPeriod']('2025-Q2', 2025)).toThrow(BadRequestException);
    });
  });

  // Testes para mapToOKRSummary e mapToOKRResponse não são mais aqui,
  // pois eles foram movidos para os testes de ObjectiveService e KeyResultService onde são chamados.
});