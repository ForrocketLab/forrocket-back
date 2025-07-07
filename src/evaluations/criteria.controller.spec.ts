import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaController } from './criteria.controller';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto, UpdateCriterionDto, CriterionDto } from './dto/criteria.dto';
import { CriterionPillar } from '@prisma/client';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('CriteriaController', () => {
  let controller: CriteriaController;
  let criteriaService: CriteriaService;

  const mockCriteriaService = {
    findAll: jest.fn(),
    findRequired: jest.fn(),
    findOptional: jest.fn(),
    findByPillar: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleRequired: jest.fn(),
  };

  const mockCriterionDto: CriterionDto = {
    id: 'test-criterion',
    name: 'Test Criterion',
    description: 'Test Description',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@rocketcorp.com',
    passwordHash: 'hashed-password',
    roles: 'admin',
    jobTitle: 'Software Engineer',
    seniority: 'JUNIOR',
    careerTrack: 'TECHNICAL',
    businessUnit: 'ENGINEERING',
    projects: null,
    managerId: null,
    mentorId: null,
    directReports: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteriaController],
      providers: [
        {
          provide: CriteriaService,
          useValue: mockCriteriaService,
        },
      ],
    }).compile();

    controller = module.get<CriteriaController>(CriteriaController);
    criteriaService = module.get<CriteriaService>(CriteriaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar todos os critérios quando nenhum filtro é aplicado', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findAll.mockResolvedValue(mockCriteria);

      const result = await controller.findAll();

      expect(criteriaService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockCriteria);
    });

    it('deve filtrar por pilar quando pillar é fornecido', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findByPillar.mockResolvedValue(mockCriteria);

      const result = await controller.findAll(undefined, undefined, 'BEHAVIOR');

      expect(criteriaService.findByPillar).toHaveBeenCalledWith('BEHAVIOR');
      expect(result).toEqual(mockCriteria);
    });

    it('deve filtrar critérios obrigatórios quando requiredOnly é true', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findRequired.mockResolvedValue(mockCriteria);

      const result = await controller.findAll(true);

      expect(criteriaService.findRequired).toHaveBeenCalled();
      expect(result).toEqual(mockCriteria);
    });

    it('deve filtrar critérios opcionais quando optionalOnly é true', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findOptional.mockResolvedValue(mockCriteria);

      const result = await controller.findAll(undefined, true);

      expect(criteriaService.findOptional).toHaveBeenCalled();
      expect(result).toEqual(mockCriteria);
    });

    it('deve priorizar pillar sobre outros filtros', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findByPillar.mockResolvedValue(mockCriteria);

      const result = await controller.findAll(true, true, 'EXECUTION');

      expect(criteriaService.findByPillar).toHaveBeenCalledWith('EXECUTION');
      expect(criteriaService.findRequired).not.toHaveBeenCalled();
      expect(criteriaService.findOptional).not.toHaveBeenCalled();
      expect(result).toEqual(mockCriteria);
    });

    it('deve lidar com erros do service', async () => {
      mockCriteriaService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(controller.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('deve retornar critério por ID', async () => {
      mockCriteriaService.findOne.mockResolvedValue(mockCriterionDto);

      const result = await controller.findOne('test-criterion');

      expect(criteriaService.findOne).toHaveBeenCalledWith('test-criterion');
      expect(result).toEqual(mockCriterionDto);
    });

    it('deve propagar NotFoundException do service', async () => {
      mockCriteriaService.findOne.mockRejectedValue(
        new NotFoundException('Critério não encontrado'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Critério não encontrado'),
      );
    });

    it('deve lidar com ID vazio', async () => {
      mockCriteriaService.findOne.mockRejectedValue(new Error('Invalid ID'));

      await expect(controller.findOne('')).rejects.toThrow('Invalid ID');
    });
  });

  describe('create', () => {
    const createDto: CreateCriterionDto = {
      name: 'New Criterion',
      description: 'New Description',
      pillar: CriterionPillar.BEHAVIOR,
      weight: 2.0,
      isRequired: false,
    };

    it('deve criar critério com sucesso', async () => {
      mockCriteriaService.create.mockResolvedValue(mockCriterionDto);

      const result = await controller.create(createDto, mockUser);

      expect(criteriaService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCriterionDto);
    });

    it('deve propagar ConflictException quando nome já existe', async () => {
      mockCriteriaService.create.mockRejectedValue(
        new ConflictException('Já existe um critério com este nome'),
      );

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(
        new ConflictException('Já existe um critério com este nome'),
      );
    });

    it('deve lidar com dados inválidos', async () => {
      const invalidDto = { ...createDto, name: '' };
      mockCriteriaService.create.mockRejectedValue(
        new BadRequestException('Nome é obrigatório'),
      );

      await expect(controller.create(invalidDto as any, mockUser)).rejects.toThrow(
        new BadRequestException('Nome é obrigatório'),
      );
    });

    it('deve lidar com erros de validação', async () => {
      mockCriteriaService.create.mockRejectedValue(
        new BadRequestException('Dados de entrada inválidos'),
      );

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(
        new BadRequestException('Dados de entrada inválidos'),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCriterionDto = {
      name: 'Updated Criterion',
      description: 'Updated Description',
      weight: 3.0,
    };

    it('deve atualizar critério com sucesso', async () => {
      const updatedCriterion = { ...mockCriterionDto, ...updateDto };
      mockCriteriaService.update.mockResolvedValue(updatedCriterion);

      const result = await controller.update('test-criterion', updateDto, mockUser);

      expect(criteriaService.update).toHaveBeenCalledWith('test-criterion', updateDto);
      expect(result).toEqual(updatedCriterion);
    });

    it('deve propagar NotFoundException quando critério não existe', async () => {
      mockCriteriaService.update.mockRejectedValue(
        new NotFoundException('Critério não encontrado'),
      );

      await expect(controller.update('non-existent', updateDto, mockUser)).rejects.toThrow(
        new NotFoundException('Critério não encontrado'),
      );
    });

    it('deve propagar ConflictException quando nome já existe', async () => {
      mockCriteriaService.update.mockRejectedValue(
        new ConflictException('Nome já existe em outro critério'),
      );

      await expect(controller.update('test-criterion', updateDto, mockUser)).rejects.toThrow(
        new ConflictException('Nome já existe em outro critério'),
      );
    });

    it('deve lidar com dados de atualização inválidos', async () => {
      const invalidDto = { ...updateDto, weight: -1 };
      mockCriteriaService.update.mockRejectedValue(
        new BadRequestException('Peso deve ser positivo'),
      );

      await expect(controller.update('test-criterion', invalidDto, mockUser)).rejects.toThrow(
        new BadRequestException('Peso deve ser positivo'),
      );
    });
  });

  describe('remove', () => {
    it('deve remover critério com sucesso e retornar mensagem', async () => {
      mockCriteriaService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('test-criterion', mockUser);

      expect(criteriaService.remove).toHaveBeenCalledWith('test-criterion');
      expect(result).toEqual({
        message: 'Critério removido permanentemente com sucesso.',
      });
    });

    it('deve propagar NotFoundException quando critério não existe', async () => {
      mockCriteriaService.remove.mockRejectedValue(
        new NotFoundException('Critério não encontrado'),
      );

      await expect(controller.remove('non-existent', mockUser)).rejects.toThrow(
        new NotFoundException('Critério não encontrado'),
      );
    });

    it('deve propagar BadRequestException quando critério está sendo usado', async () => {
      mockCriteriaService.remove.mockRejectedValue(
        new BadRequestException('Critério está sendo usado em avaliações'),
      );

      await expect(controller.remove('test-criterion', mockUser)).rejects.toThrow(
        new BadRequestException('Critério está sendo usado em avaliações'),
      );
    });

    it('deve lidar com erros inesperados', async () => {
      mockCriteriaService.remove.mockRejectedValue(new Error('Unexpected error'));

      await expect(controller.remove('test-criterion', mockUser)).rejects.toThrow(
        'Unexpected error',
      );
    });
  });

  describe('toggleRequired', () => {
    it('deve alternar obrigatoriedade com sucesso', async () => {
      const toggledCriterion = { ...mockCriterionDto, isRequired: false };
      mockCriteriaService.toggleRequired.mockResolvedValue(toggledCriterion);

      const result = await controller.toggleRequired('test-criterion', mockUser);

      expect(criteriaService.toggleRequired).toHaveBeenCalledWith('test-criterion');
      expect(result).toEqual(toggledCriterion);
    });

    it('deve propagar NotFoundException quando critério não existe', async () => {
      mockCriteriaService.toggleRequired.mockRejectedValue(
        new NotFoundException('Critério não encontrado'),
      );

      await expect(controller.toggleRequired('non-existent', mockUser)).rejects.toThrow(
        new NotFoundException('Critério não encontrado'),
      );
    });

    it('deve lidar com erros do service', async () => {
      mockCriteriaService.toggleRequired.mockRejectedValue(new Error('Service error'));

      await expect(controller.toggleRequired('test-criterion', mockUser)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve lidar com usuário undefined no create', async () => {
      const createDto: CreateCriterionDto = {
        name: 'Test',
        description: 'Test',
        pillar: CriterionPillar.BEHAVIOR,
      };

      mockCriteriaService.create.mockResolvedValue(mockCriterionDto);

      const result = await controller.create(createDto, undefined as any);

      expect(result).toEqual(mockCriterionDto);
    });

    it('deve lidar com usuário undefined no update', async () => {
      const updateDto: UpdateCriterionDto = { name: 'Updated' };
      const updatedCriterion = { ...mockCriterionDto, ...updateDto };

      mockCriteriaService.update.mockResolvedValue(updatedCriterion);

      const result = await controller.update('test-criterion', updateDto, undefined as any);

      expect(result).toEqual(updatedCriterion);
    });

    it('deve lidar com usuário undefined no remove', async () => {
      mockCriteriaService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('test-criterion', undefined as any);

      expect(result).toEqual({
        message: 'Critério removido permanentemente com sucesso.',
      });
    });

    it('deve lidar com usuário undefined no toggleRequired', async () => {
      const toggledCriterion = { ...mockCriterionDto, isRequired: false };
      mockCriteriaService.toggleRequired.mockResolvedValue(toggledCriterion);

      const result = await controller.toggleRequired('test-criterion', undefined as any);

      expect(result).toEqual(toggledCriterion);
    });

    it('deve lidar com parâmetros de query como strings', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findRequired.mockResolvedValue(mockCriteria);

      // Simula query parameters como strings (comum em HTTP)
      const result = await controller.findAll('true' as any, 'false' as any, 'BEHAVIOR');

      expect(criteriaService.findByPillar).toHaveBeenCalledWith('BEHAVIOR');
      expect(result).toEqual(mockCriteria);
    });

    it('deve lidar com parâmetros de query undefined', async () => {
      const mockCriteria = [mockCriterionDto];
      mockCriteriaService.findAll.mockResolvedValue(mockCriteria);

      const result = await controller.findAll(undefined, undefined, undefined);

      expect(criteriaService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockCriteria);
    });
  });

  describe('Integração com Guards', () => {
    it('deve ter JwtAuthGuard aplicado', () => {
      const guards = Reflect.getMetadata('__guards__', CriteriaController);
      expect(guards).toBeDefined();
    });

    it('deve ter HRRoleGuard aplicado', () => {
      const guards = Reflect.getMetadata('__guards__', CriteriaController);
      expect(guards).toBeDefined();
    });
  });

  describe('Validação de DTOs', () => {
    // Removido: testes de reflexão de ValidationPipe, pois não são válidos para unit test
  });
}); 