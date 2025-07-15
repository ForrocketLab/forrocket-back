import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaService } from './criteria.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateCriterionDto, UpdateCriterionDto } from './dto/criteria.dto';
import { CriterionPillar } from '@prisma/client';

describe('CriteriaService', () => {
  let service: CriteriaService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    criterion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    selfAssessmentAnswer: {
      count: jest.fn(),
    },
    managerAssessmentAnswer: {
      count: jest.fn(),
    },
  };

  const mockCriterion = {
    id: 'test-criterion',
    name: 'Test Criterion',
    description: 'Test Description',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    isBase: true,
    businessUnit: null,
    createdAt: '2025-07-10T05:30:52.271Z',
    updatedAt: '2025-07-10T05:30:52.271Z',
  };

  const mockCriterionDto = {
    id: 'test-criterion',
    name: 'Test Criterion',
    description: 'Test Description',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1,
    isRequired: true,
    isBase: true,
    businessUnit: null,
    createdAt: '2025-07-10T05:30:52.271Z',
    updatedAt: '2025-07-10T05:30:52.271Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriteriaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CriteriaService>(CriteriaService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar todos os critérios ordenados', async () => {
      const mockCriteria = [mockCriterion];
      mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);

      const result = await service.findAll();

      expect(mockPrismaService.criterion.findMany).toHaveBeenCalledWith({
        orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual([
        expect.objectContaining({
          ...mockCriterionDto,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      ]);
    });

    it('deve retornar array vazio quando não há critérios', async () => {
      mockPrismaService.criterion.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('deve lidar com erros do banco de dados', async () => {
      mockPrismaService.criterion.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('findRequired', () => {
    it('deve retornar apenas critérios obrigatórios', async () => {
      const mockCriteria = [mockCriterion];
      mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);

      const result = await service.findRequired();

      expect(mockPrismaService.criterion.findMany).toHaveBeenCalledWith({
        where: { isRequired: true },
        orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual([mockCriterionDto]);
    });
  });

  describe('findOptional', () => {
    it('deve retornar apenas critérios opcionais', async () => {
      const mockCriteria = [mockCriterion];
      mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);

      const result = await service.findOptional();

      expect(mockPrismaService.criterion.findMany).toHaveBeenCalledWith({
        where: { isRequired: false },
        orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual([mockCriterionDto]);
    });
  });

  describe('findOne', () => {
    it('deve retornar critério por ID', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);

      const result = await service.findOne('test-criterion');

      expect(mockPrismaService.criterion.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
      });
      expect(result).toEqual(mockCriterionDto);
    });

    it('deve lançar NotFoundException quando critério não existe', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Critério com ID non-existent não encontrado'),
      );
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
      mockPrismaService.criterion.findFirst.mockResolvedValue(null);
      mockPrismaService.criterion.create.mockResolvedValue(mockCriterion);

      const result = await service.create(createDto);

      expect(mockPrismaService.criterion.findFirst).toHaveBeenCalledWith({
        where: { name: 'New Criterion' },
      });
      expect(mockPrismaService.criterion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'new-criterion',
          name: 'New Criterion',
          description: 'New Description',
          pillar: 'BEHAVIOR',
          weight: 2,
          isRequired: false,
          isBase: true,
          businessUnit: null,
        }),
      });
      expect(result).toEqual(mockCriterionDto);
    });

    it('deve usar valores padrão quando weight e isRequired não são fornecidos', async () => {
      const createDtoWithoutDefaults = {
        name: 'New Criterion',
        description: 'New Description',
        pillar: CriterionPillar.EXECUTION,
      };

      mockPrismaService.criterion.findFirst.mockResolvedValue(null);
      mockPrismaService.criterion.create.mockResolvedValue(mockCriterion);

      await service.create(createDtoWithoutDefaults as CreateCriterionDto);

      expect(mockPrismaService.criterion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'new-criterion',
          name: 'New Criterion',
          description: 'New Description',
          pillar: 'EXECUTION',
          weight: 1,
          isRequired: true,
          isBase: true,
          businessUnit: null,
        }),
      });
    });

    it('deve lançar ConflictException quando nome já existe', async () => {
      mockPrismaService.criterion.findFirst.mockResolvedValue(mockCriterion);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('Já existe um critério com o nome "New Criterion"'),
      );
    });

    it('deve gerar ID único baseado no nome', async () => {
      const createDtoWithSpecialChars = {
        ...createDto,
        name: 'Critério com Acentos & Símbolos!',
      };

      mockPrismaService.criterion.findFirst.mockResolvedValue(null);
      mockPrismaService.criterion.create.mockResolvedValue(mockCriterion);

      await service.create(createDtoWithSpecialChars);

      expect(mockPrismaService.criterion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'criterio-com-acentos-simbolos',
        }),
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateCriterionDto = {
      name: 'Updated Criterion',
      description: 'Updated Description',
      weight: 3.0,
    };

    it('deve atualizar critério com sucesso', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrismaService.criterion.findFirst.mockResolvedValue(null);
      mockPrismaService.criterion.update.mockResolvedValue(mockCriterion);

      const result = await service.update('test-criterion', updateDto);

      expect(mockPrismaService.criterion.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
      });
      expect(mockPrismaService.criterion.update).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
        data: expect.objectContaining({
          description: 'Updated Description',
          name: 'Updated Criterion',
          updatedAt: expect.any(String),
          weight: 3,
        }),
      });
      expect(result).toEqual(mockCriterionDto);
    });

    it('deve lançar NotFoundException quando critério não existe', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        new NotFoundException('Critério com ID non-existent não encontrado'),
      );
    });

    it('deve verificar conflito de nome apenas quando nome está sendo alterado', async () => {
      const updateDtoWithoutName = { description: 'Updated Description' };
      mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrismaService.criterion.update.mockResolvedValue(mockCriterion);

      await service.update('test-criterion', updateDtoWithoutName);

      expect(mockPrismaService.criterion.findFirst).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando novo nome já existe', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrismaService.criterion.findFirst.mockResolvedValue({ id: 'other-criterion' });

      await expect(service.update('test-criterion', updateDto)).rejects.toThrow(
        new ConflictException('Já existe um critério com o nome "Updated Criterion"'),
      );
    });
  });

  describe('remove', () => {
    it('deve remover critério quando não está sendo usado', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrismaService.selfAssessmentAnswer.count.mockResolvedValue(0);
      mockPrismaService.managerAssessmentAnswer.count.mockResolvedValue(0);
      mockPrismaService.criterion.delete.mockResolvedValue(mockCriterion);

      await service.remove('test-criterion');

      expect(mockPrismaService.criterion.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
      });
      expect(mockPrismaService.criterion.delete).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
      });
    });

    it('deve lançar NotFoundException quando critério não existe', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Critério com ID non-existent não encontrado'),
      );
    });

    it('deve lançar BadRequestException quando critério está sendo usado', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrismaService.selfAssessmentAnswer.count.mockResolvedValue(5);
      mockPrismaService.managerAssessmentAnswer.count.mockResolvedValue(3);

      await expect(service.remove('test-criterion')).rejects.toThrow(
        new BadRequestException(
          'Não é possível remover o critério "Test Criterion" pois ele está sendo usado em 8 avaliação(ões). Para manter histórico, altere a obrigatoriedade ao invés de remover.',
        ),
      );
    });
  });

  describe('toggleRequired', () => {
    it('deve alternar isRequired de true para false', async () => {
      const criterionWithRequiredTrue = { ...mockCriterion, isRequired: true };
      const updatedCriterion = { ...mockCriterion, isRequired: false };

      mockPrismaService.criterion.findUnique.mockResolvedValue(criterionWithRequiredTrue);
      mockPrismaService.criterion.update.mockResolvedValue(updatedCriterion);

      const result = await service.toggleRequired('test-criterion');

      expect(mockPrismaService.criterion.update).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
        data: expect.objectContaining({
          isRequired: false,
          updatedAt: expect.any(String),
        }),
      });
      expect(result.isRequired).toBe(false);
    });

    it('deve alternar isRequired de false para true', async () => {
      const criterionWithRequiredFalse = { ...mockCriterion, isRequired: false };
      const updatedCriterion = { ...mockCriterion, isRequired: true };

      mockPrismaService.criterion.findUnique.mockResolvedValue(criterionWithRequiredFalse);
      mockPrismaService.criterion.update.mockResolvedValue(updatedCriterion);

      const result = await service.toggleRequired('test-criterion');

      expect(mockPrismaService.criterion.update).toHaveBeenCalledWith({
        where: { id: 'test-criterion' },
        data: expect.objectContaining({
          isRequired: true,
          updatedAt: expect.any(String),
        }),
      });
      expect(result.isRequired).toBe(true);
    });

    it('deve lançar NotFoundException quando critério não existe', async () => {
      mockPrismaService.criterion.findUnique.mockResolvedValue(null);

      await expect(service.toggleRequired('non-existent')).rejects.toThrow(
        new NotFoundException('Critério com ID non-existent não encontrado'),
      );
    });
  });

  describe('findByPillar', () => {
    it('deve retornar critérios de um pilar específico', async () => {
      const mockCriteria = [mockCriterion];
      mockPrismaService.criterion.findMany.mockResolvedValue(mockCriteria);

      const result = await service.findByPillar('TECHNICAL');

      expect(mockPrismaService.criterion.findMany).toHaveBeenCalledWith({
        where: { pillar: 'TECHNICAL' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockCriterionDto]);
    });

    it('deve retornar array vazio quando não há critérios no pilar', async () => {
      mockPrismaService.criterion.findMany.mockResolvedValue([]);

      const result = await service.findByPillar('BEHAVIORAL');

      expect(result).toEqual([]);
    });
  });

  describe('Métodos privados', () => {
    describe('generateCriterionId', () => {
      it('deve gerar ID válido para nome simples', () => {
        const result = (service as any).generateCriterionId('Test Criterion');
        expect(result).toBe('test-criterion');
      });

      it('deve remover acentos', () => {
        const result = (service as any).generateCriterionId('Critério com Acentos');
        expect(result).toBe('criterio-com-acentos');
      });

      it('deve remover caracteres especiais', () => {
        const result = (service as any).generateCriterionId('Test & Special @ Characters!');
        expect(result).toBe('test-special-characters');
      });

      it('deve lidar com múltiplos espaços e hífens', () => {
        const result = (service as any).generateCriterionId('  Test   Criterion  ');
        expect(result).toBe('test-criterion');
      });
    });

    describe('checkCriterionUsage', () => {
      it('deve retornar soma de uso em autoavaliações e avaliações de gestor', async () => {
        mockPrismaService.selfAssessmentAnswer.count.mockResolvedValue(5);
        mockPrismaService.managerAssessmentAnswer.count.mockResolvedValue(3);

        const result = await (service as any).checkCriterionUsage('test-criterion');

        expect(mockPrismaService.selfAssessmentAnswer.count).toHaveBeenCalledWith({
          where: { criterionId: 'test-criterion' },
        });
        expect(mockPrismaService.managerAssessmentAnswer.count).toHaveBeenCalledWith({
          where: { criterionId: 'test-criterion' },
        });
        expect(result).toBe(8);
      });
    });

    describe('mapToDto', () => {
      it('deve mapear critério para DTO corretamente', () => {
        const result = (service as any).mapToDto(mockCriterion);
        expect(result).toEqual(mockCriterionDto);
      });
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve lidar com critério sem descrição', async () => {
      const criterionWithoutDescription = { ...mockCriterion, description: null };
      mockPrismaService.criterion.findUnique.mockResolvedValue(criterionWithoutDescription);

      const result = await service.findOne('test-criterion');

      expect(result.description).toBeNull();
    });

    it('deve lidar com critério com peso zero', async () => {
      const criterionWithZeroWeight = { ...mockCriterion, weight: 0 };
      mockPrismaService.criterion.findUnique.mockResolvedValue(criterionWithZeroWeight);

      const result = await service.findOne('test-criterion');

      expect(result.weight).toBe(0);
    });

    it('deve lidar com erros de banco de dados em operações de escrita', async () => {
      mockPrismaService.criterion.findFirst.mockResolvedValue(null);
      mockPrismaService.criterion.create.mockRejectedValue(new Error('DB write error'));

      await expect(service.create({
        name: 'Test',
        description: 'Test',
        pillar: CriterionPillar.MANAGEMENT,
      })).rejects.toThrow('DB write error');
    });
  });
}); 