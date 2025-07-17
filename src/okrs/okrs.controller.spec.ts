import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OKRStatus, ObjectiveStatus, KeyResultStatus, KeyResultType } from '@prisma/client';

import { OKRsController } from './okrs.controller';
import { OkrService } from './okr.service';
import { ObjectiveService } from './objective.service';
import { KeyResultService } from './key-result.service';

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
  let okrService: jest.Mocked<OkrService>;
  let objectiveService: jest.Mocked<ObjectiveService>;
  let keyResultService: jest.Mocked<KeyResultService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Usuário de Teste',
    passwordHash: 'hash',
    roles: ['colaborador'],
    jobTitle: 'Desenvolvedor',
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
    title: 'OKR de Teste',
    description: 'Descrição de Teste',
    quarter: 'T3',
    year: 2025,
    status: OKRStatus.ACTIVE,
    overallProgress: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    objectives: [],
  };

  const mockOKRSummary: OKRSummaryDto = {
    id: 'okr-1',
    title: 'OKR de Teste',
    quarter: 'T3',
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
    title: 'Objetivo de Teste',
    description: 'Descrição de Teste',
    status: ObjectiveStatus.IN_PROGRESS,
    progress: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    keyResults: [],
  };

  const mockKeyResultResponse: KeyResultResponseDto = {
    id: 'kr-1',
    objectiveId: 'obj-1',
    title: 'Resultado-Chave de Teste',
    description: 'Descrição de Teste',
    type: KeyResultType.NUMBER,
    targetValue: 100,
    currentValue: 50,
    unit: 'itens',
    status: KeyResultStatus.IN_PROGRESS,
    progress: 50,
    formattedCurrentValue: '50 itens',
    formattedTargetValue: '100 itens',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Mocks separados para cada serviço
    const mockOkrService = {
      createOKR: jest.fn(),
      getUserOKRs: jest.fn(),
      getOKRById: jest.fn(),
      updateOKR: jest.fn(),
      deleteOKR: jest.fn(),
    };

    const mockObjectiveService = {
      createObjective: jest.fn(),
      getObjectiveById: jest.fn(),
      updateObjective: jest.fn(),
      deleteObjective: jest.fn(),
    };

    const mockKeyResultService = {
      createKeyResult: jest.fn(),
      getKeyResultById: jest.fn(),
      updateKeyResult: jest.fn(),
      deleteKeyResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OKRsController],
      providers: [
        {
          provide: OkrService, 
          useValue: mockOkrService,
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

    controller = module.get<OKRsController>(OKRsController);
    okrService = module.get(OkrService); 
    objectiveService = module.get(ObjectiveService); 
    keyResultService = module.get(KeyResultService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('createOKR', () => {
    const createOKRDto: CreateOKRDto = {
      title: 'OKR de Teste',
      description: 'Descrição de Teste',
      quarter: 'T3',
      year: 2025,
      objectives: [],
    };

    it('deve criar OKR com sucesso', async () => {
      okrService.createOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.createOKR(mockUser, createOKRDto);

      expect(result).toEqual(mockOKRResponse);
      expect(okrService.createOKR).toHaveBeenCalledWith(mockUser.id, createOKRDto);
    });

    it('deve propagar erros do serviço', async () => {
      const error = new ConflictException('OKR já existe');
      okrService.createOKR.mockRejectedValue(error);

      await expect(controller.createOKR(mockUser, createOKRDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUserOKRs', () => {
    it('deve retornar os OKRs do usuário com sucesso', async () => {
      const mockOKRs = [mockOKRSummary];
      okrService.getUserOKRs.mockResolvedValue(mockOKRs);

      const result = await controller.getUserOKRs(mockUser);

      expect(result).toEqual(mockOKRs);
      expect(okrService.getUserOKRs).toHaveBeenCalledWith(mockUser.id);
    });

    it('deve retornar um array vazio quando o usuário não tiver OKRs', async () => {
      okrService.getUserOKRs.mockResolvedValue([]);

      const result = await controller.getUserOKRs(mockUser);

      expect(result).toEqual([]);
    });

    it('deve propagar erros do serviço', async () => {
      const error = new Error('Erro de banco de dados');
      okrService.getUserOKRs.mockRejectedValue(error);

      await expect(controller.getUserOKRs(mockUser)).rejects.toThrow('Erro de banco de dados');
    });
  });

  describe('getOKRById', () => {
    it('deve retornar OKR por ID com sucesso', async () => {
      okrService.getOKRById.mockResolvedValue(mockOKRResponse);

      const result = await controller.getOKRById('okr-1');

      expect(result).toEqual(mockOKRResponse);
      expect(okrService.getOKRById).toHaveBeenCalledWith('okr-1');
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('OKR não encontrado');
      okrService.getOKRById.mockRejectedValue(error);

      await expect(controller.getOKRById('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOKR', () => {
    const updateOKRDto: UpdateOKRDto = {
      title: 'OKR Atualizado',
      description: 'Descrição Atualizada',
    };

    it('deve atualizar OKR com sucesso', async () => {
      okrService.updateOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.updateOKR('okr-1', mockUser, updateOKRDto);

      expect(result).toEqual(mockOKRResponse);
      expect(okrService.updateOKR).toHaveBeenCalledWith('okr-1', mockUser.id, updateOKRDto);
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('OKR não encontrado');
      okrService.updateOKR.mockRejectedValue(error);

      await expect(controller.updateOKR('naoexistente', mockUser, updateOKRDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve propagar ConflictException', async () => {
      const error = new ConflictException('Conflito de trimestre');
      okrService.updateOKR.mockRejectedValue(error);

      await expect(controller.updateOKR('okr-1', mockUser, updateOKRDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteOKR', () => {
    it('deve excluir OKR com sucesso', async () => {
      okrService.deleteOKR.mockResolvedValue(undefined);

      const result = await controller.deleteOKR('okr-1', mockUser);

      expect(result).toBeUndefined();
      expect(okrService.deleteOKR).toHaveBeenCalledWith('okr-1', mockUser.id);
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('OKR não encontrado');
      okrService.deleteOKR.mockRejectedValue(error);

      await expect(controller.deleteOKR('naoexistente', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createObjective', () => {
    const createObjectiveDto: CreateObjectiveDto = {
      title: 'Objetivo de Teste',
      description: 'Descrição de Teste',
      keyResults: [],
    };

    it('deve criar objetivo com sucesso', async () => {
      objectiveService.createObjective.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.createObjective('okr-1', createObjectiveDto);

      expect(result).toEqual(mockObjectiveResponse);
      expect(objectiveService.createObjective).toHaveBeenCalledWith('okr-1', createObjectiveDto);
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('OKR não encontrado');
      objectiveService.createObjective.mockRejectedValue(error);

      await expect(controller.createObjective('naoexistente', createObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getObjectiveById', () => {
    it('deve retornar objetivo por ID com sucesso', async () => {
      objectiveService.getObjectiveById.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.getObjectiveById('obj-1');

      expect(result).toEqual(mockObjectiveResponse);
      expect(objectiveService.getObjectiveById).toHaveBeenCalledWith('obj-1');
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Objetivo não encontrado');
      objectiveService.getObjectiveById.mockRejectedValue(error);

      await expect(controller.getObjectiveById('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateObjective', () => {
    const updateObjectiveDto: UpdateObjectiveDto = {
      title: 'Objetivo Atualizado',
      description: 'Descrição Atualizada',
    };

    it('deve atualizar objetivo com sucesso', async () => {
      objectiveService.updateObjective.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.updateObjective('obj-1', updateObjectiveDto);

      expect(result).toEqual(mockObjectiveResponse);
      expect(objectiveService.updateObjective).toHaveBeenCalledWith('obj-1', updateObjectiveDto);
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Objetivo não encontrado');
      objectiveService.updateObjective.mockRejectedValue(error);

      await expect(controller.updateObjective('naoexistente', updateObjectiveDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteObjective', () => {
    it('deve excluir objetivo com sucesso', async () => {
      objectiveService.deleteObjective.mockResolvedValue(undefined);

      const result = await controller.deleteObjective('obj-1');

      expect(result).toBeUndefined();
      expect(objectiveService.deleteObjective).toHaveBeenCalledWith('obj-1');
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Objetivo não encontrado');
      objectiveService.deleteObjective.mockRejectedValue(error);

      await expect(controller.deleteObjective('naoexistente')).rejects.toThrow(NotFoundException);
    });
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

    it('deve criar resultado-chave com sucesso', async () => {
      keyResultService.createKeyResult.mockResolvedValue(mockKeyResultResponse);

      const result = await controller.createKeyResult('obj-1', createKeyResultDto);

      expect(result).toEqual(mockKeyResultResponse);
      expect(keyResultService.createKeyResult).toHaveBeenCalledWith('obj-1', createKeyResultDto);
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Objetivo não encontrado');
      keyResultService.createKeyResult.mockRejectedValue(error);

      await expect(controller.createKeyResult('naoexistente', createKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve propagar ConflictException', async () => {
      const error = new ConflictException('Resultado-chave com o mesmo título já existe');
      keyResultService.createKeyResult.mockRejectedValue(error);

      await expect(controller.createKeyResult('obj-1', createKeyResultDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getKeyResultById', () => {
    it('deve retornar resultado-chave por ID com sucesso', async () => {
      keyResultService.getKeyResultById.mockResolvedValue(mockKeyResultResponse);

      const result = await controller.getKeyResultById('kr-1');

      expect(result).toEqual(mockKeyResultResponse);
      expect(keyResultService.getKeyResultById).toHaveBeenCalledWith('kr-1');
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Resultado-chave não encontrado');
      keyResultService.getKeyResultById.mockRejectedValue(error);

      await expect(controller.getKeyResultById('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateKeyResult', () => {
    const updateKeyResultDto: UpdateKeyResultDto = {
      title: 'Resultado-Chave Atualizado',
      description: 'Descrição Atualizada',
      currentValue: 75,
    };

    it('deve atualizar resultado-chave com sucesso', async () => {
      keyResultService.updateKeyResult.mockResolvedValue(mockKeyResultResponse);

      const result = await controller.updateKeyResult('kr-1', updateKeyResultDto);

      expect(result).toEqual(mockKeyResultResponse);
      expect(keyResultService.updateKeyResult).toHaveBeenCalledWith('kr-1', updateKeyResultDto);
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Resultado-chave não encontrado');
      keyResultService.updateKeyResult.mockRejectedValue(error);

      await expect(controller.updateKeyResult('naoexistente', updateKeyResultDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteKeyResult', () => {
    it('deve excluir resultado-chave com sucesso', async () => {
      keyResultService.deleteKeyResult.mockResolvedValue(undefined);

      const result = await controller.deleteKeyResult('kr-1');

      expect(result).toBeUndefined();
      expect(keyResultService.deleteKeyResult).toHaveBeenCalledWith('kr-1');
    });

    it('deve propagar NotFoundException', async () => {
      const error = new NotFoundException('Resultado-chave não encontrado');
      keyResultService.deleteKeyResult.mockRejectedValue(error);

      await expect(controller.deleteKeyResult('naoexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Casos de borda', () => {
    it('deve lidar com array de objetivos vazio', async () => {
      const createOKRDto = {
        title: 'OKR de Teste',
        description: 'Descrição de Teste',
        quarter: 'T3',
        year: 2025,
        objectives: [],
      };

      okrService.createOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.createOKR(mockUser, createOKRDto);

      expect(result).toEqual(mockOKRResponse);
    });

    it('deve lidar com array de resultados-chave vazio', async () => {
      const createObjectiveDto = {
        title: 'Objetivo de Teste',
        description: 'Descrição de Teste',
        keyResults: [],
      };

      objectiveService.createObjective.mockResolvedValue(mockObjectiveResponse);

      const result = await controller.createObjective('okr-1', createObjectiveDto);

      expect(result).toEqual(mockObjectiveResponse);
    });

    it('deve lidar com DTOs de atualização parciais', async () => {
      const partialUpdateOKRDto = { title: 'Título Atualizado' };
      okrService.updateOKR.mockResolvedValue(mockOKRResponse);

      const result = await controller.updateOKR('okr-1', mockUser, partialUpdateOKRDto);

      expect(result).toEqual(mockOKRResponse);
    });
  });
});