import { Readable } from 'stream';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, ImportBatch, ImportStatus } from '@prisma/client';
import * as xlsx from 'xlsx';

import { ImportService } from './import.service';
import { UserService } from '../auth/user.service';
import { PrismaService } from '../database/prisma.service';
import { CriteriaService } from '../evaluations/criteria.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { ProjectsService } from '../projects/projects.service';

describe('ImportService', () => {
  let service: ImportService;
  let prismaService: jest.Mocked<PrismaService>;
  let userService: jest.Mocked<UserService>;
  let cyclesService: jest.Mocked<CyclesService>;
  let projectsService: jest.Mocked<ProjectsService>;
  let criteriaService: jest.Mocked<CriteriaService>;
  let evaluationsService: jest.Mocked<EvaluationsService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    jobTitle: 'Developer',
    seniority: 'Pleno',
    passwordHash: 'hashedPassword',
    roles: 'HR',
    careerTrack: 'Tech',
    businessUnit: 'Technology',
    businessHub: 'São Paulo',
    projects: null,
    managerId: null,
    directReports: null,
    mentorId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    importBatchId: null,
  };

  const mockImportBatch: ImportBatch = {
    id: 'batch-1',
    fileName: 'test-file.xlsx',
    uploadedUserId: 'user-1',
    importedAt: new Date(),
    status: ImportStatus.COMPLETED,
    notes: null,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-file.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024,
    buffer: Buffer.from('mock excel file'),
    stream: new Readable(),
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      importBatch: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      userProjectRole: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      selfAssessment: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      assessment360: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      referenceFeedback: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockUserService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockCyclesService = {
      getActiveCycle: jest.fn(),
    };

    const mockProjectsService = {
      create: jest.fn(),
      findByName: jest.fn(),
    };

    const mockCriteriaService = {
      findAll: jest.fn(),
    };

    const mockEvaluationsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CyclesService,
          useValue: mockCyclesService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: CriteriaService,
          useValue: mockCriteriaService,
        },
        {
          provide: EvaluationsService,
          useValue: mockEvaluationsService,
        },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    prismaService = module.get(PrismaService);
    userService = module.get(UserService);
    cyclesService = module.get(CyclesService);
    projectsService = module.get(ProjectsService);
    criteriaService = module.get(CriteriaService);
    evaluationsService = module.get(EvaluationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processXslFile', () => {
    it('should process a single Excel file successfully', async () => {
      // Mock Excel file content with realistic data
      const mockWorkbook = {
        SheetNames: ['Perfil', 'Autoavaliação', 'Avaliação 360', 'Pesquisa de Referências'],
        Sheets: {
          Perfil: {},
          Autoavaliação: {},
          'Avaliação 360': {},
          'Pesquisa de Referências': {},
        },
      };

      const mockProfileData = [
        {
          'Nome ( nome.sobrenome )': 'João Silva',
          'Email': 'joao.silva@company.com',
          'Unidade': 'Technology',
          'Ciclo (ano.semestre)': '2025.1',
        },
      ];

      // Mock xlsx methods
      const xlsxReadSpy = jest.spyOn(xlsx, 'read').mockReturnValue(mockWorkbook);
      const xlsxSheetToJsonSpy = jest.spyOn(xlsx.utils, 'sheet_to_json')
        .mockReturnValueOnce(mockProfileData)      // Perfil sheet
        .mockReturnValueOnce([])                   // Autoavaliação sheet
        .mockReturnValueOnce([])                   // Avaliação 360 sheet
        .mockReturnValueOnce([]);                  // Pesquisa de Referências sheet

      // Mock database operations with proper return values
      const mockUserCreated = { ...mockUser, email: 'joao.silva@company.com', name: 'João Silva' };

      // Setup Prisma mocks using Jest Mock cast
      (prismaService.importBatch.create as jest.Mock).mockResolvedValue(mockImportBatch);
      (prismaService.importBatch.update as jest.Mock).mockResolvedValue({
        ...mockImportBatch,
        status: ImportStatus.COMPLETED,
      });

      // Mock transaction to execute the callback immediately
      (prismaService.$transaction as jest.Mock).mockImplementation((callback) => {
        const txMock = {
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockUserCreated),
            findMany: jest.fn().mockResolvedValue([]),
            upsert: jest.fn().mockResolvedValue(mockUserCreated),
          },
          selfAssessment: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          assessment360: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          referenceFeedback: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          userProjectRole: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await service.processXslFile(mockFile, mockUser);

      expect(result).toBeDefined();
      expect(result.batchId).toEqual(mockImportBatch.id);
      expect(result.message).toBe('Arquivo importado com sucesso!');

      // Clean up
      xlsxReadSpy.mockRestore();
      xlsxSheetToJsonSpy.mockRestore();
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(service.processXslFile(invalidFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing file', async () => {
      await expect(
        service.processXslFile(null as unknown as Express.Multer.File, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processMultipleXslFiles', () => {
    it('should process multiple Excel files successfully', async () => {
      const files = [mockFile, { ...mockFile, originalname: 'test-file-2.xlsx' }];
      const mockSingleResult = {
        message: 'Arquivo importado com sucesso!',
        userId: mockUser.id,
        userName: mockUser.name,
        batchId: mockImportBatch.id,
      };

      // Mock processSingleFile method directly
      const processSingleFileSpy = jest
        .spyOn(service, 'processSingleFile' as any)
        .mockResolvedValue(mockSingleResult);

      const result = await service.processMultipleXslFiles(files, mockUser);

      expect(result).toBeDefined();
      expect(result.fileResults).toHaveLength(2);
      expect(result.successfulFiles).toBe(2);
      expect(result.failedFiles).toBe(0);
      expect(result.totalFiles).toBe(2);
      expect(result.message).toContain('2/2 arquivos processados com sucesso');

      // Verify processSingleFile was called twice
      expect(processSingleFileSpy).toHaveBeenCalledTimes(2);

      // Clean up
      processSingleFileSpy.mockRestore();
    });

    it('should throw BadRequestException for empty file array', async () => {
      await expect(service.processMultipleXslFiles([], mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getImportBatchesByUser', () => {
    it('should return import batches for a user', async () => {
      const mockBatches = [mockImportBatch];
      (prismaService.importBatch.findMany as jest.Mock).mockResolvedValue(mockBatches);

      const result = await service.getImportBatchesByUser('user-1');

      expect(result).toEqual(mockBatches);
      expect(prismaService.importBatch.findMany).toHaveBeenCalledWith({
        where: { uploadedUserId: 'user-1' },
        orderBy: { importedAt: 'desc' },
        include: {
          uploadedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              createdUsers: true,
              createdSelfAssessments: true,
              createdAssessments360: true,
              createdReferenceFeedbacks: true,
            },
          },
        },
      });
    });
  });

  describe('getImportBatchesByUserPaginated', () => {
    it('should return paginated import batches for a user', async () => {
      const mockBatches = [mockImportBatch];
      const mockCount = 1;

      (prismaService.importBatch.findMany as jest.Mock).mockResolvedValue(mockBatches);
      (prismaService.importBatch.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await service.getImportBatchesByUserPaginated(
        'user-1',
        1,
        10,
        'importedAt',
        'desc',
      );

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockBatches);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should handle pagination parameters correctly', async () => {
      const mockBatches = Array(20).fill(mockImportBatch);
      const mockCount = 25;

      (prismaService.importBatch.findMany as jest.Mock).mockResolvedValue(mockBatches);
      (prismaService.importBatch.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await service.getImportBatchesByUserPaginated(
        'user-1',
        2,
        20,
        'fileName',
        'asc',
      );

      expect(result.meta).toEqual({
        page: 2,
        limit: 20,
        total: 25,
        totalPages: 2,
        hasNext: false,
        hasPrevious: true,
      });

      expect(prismaService.importBatch.findMany).toHaveBeenCalledWith({
        where: { uploadedUserId: 'user-1' },
        orderBy: { fileName: 'asc' },
        skip: 20,
        take: 20,
        include: {
          uploadedUser: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              createdUsers: true,
              createdSelfAssessments: true,
              createdAssessments360: true,
              createdReferenceFeedbacks: true,
            },
          },
        },
      });
    });

    it('should validate sortBy field and fallback to importedAt', async () => {
      const mockBatches = [mockImportBatch];
      const mockCount = 1;

      (prismaService.importBatch.findMany as jest.Mock).mockResolvedValue(mockBatches);
      (prismaService.importBatch.count as jest.Mock).mockResolvedValue(mockCount);

      await service.getImportBatchesByUserPaginated('user-1', 1, 10, 'invalidField', 'desc');

      expect(prismaService.importBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { importedAt: 'desc' },
        }),
      );
    });
  });

  describe('getAllImportBatches', () => {
    it('should return all import batches', async () => {
      const mockBatches = [mockImportBatch];
      (prismaService.importBatch.findMany as jest.Mock).mockResolvedValue(mockBatches);

      const result = await service.getAllImportBatches();

      expect(result).toEqual(mockBatches);
      expect(prismaService.importBatch.findMany).toHaveBeenCalledWith({
        orderBy: { importedAt: 'desc' },
        include: {
          uploadedUser: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              createdUsers: true,
              createdSelfAssessments: true,
              createdAssessments360: true,
              createdReferenceFeedbacks: true,
            },
          },
        },
      });
    });
  });

  describe('getImportBatchDetails', () => {
    it('should return import batch details', async () => {
      (prismaService.importBatch.findUnique as jest.Mock).mockResolvedValue(mockImportBatch);

      const result = await service.getImportBatchDetails('batch-1');

      expect(result).toEqual(mockImportBatch);
      expect(prismaService.importBatch.findUnique).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        include: {
          uploadedUser: { select: { id: true, name: true, email: true } },
          createdUsers: { select: { id: true, name: true, email: true, createdAt: true } },
          createdSelfAssessments: {
            select: {
              id: true,
              cycle: true,
              status: true,
              createdAt: true,
              author: { select: { name: true, email: true } },
            },
          },
          createdAssessments360: {
            select: {
              id: true,
              cycle: true,
              overallScore: true,
              status: true,
              createdAt: true,
              author: { select: { name: true, email: true } },
              evaluatedUser: { select: { name: true, email: true } },
            },
          },
          createdReferenceFeedbacks: {
            select: {
              id: true,
              cycle: true,
              status: true,
              createdAt: true,
              author: { select: { name: true, email: true } },
              referencedUser: { select: { name: true, email: true } },
            },
          },
        },
      });
    });

    it('should throw error when batch not found', async () => {
      (prismaService.importBatch.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getImportBatchDetails('nonexistent')).rejects.toThrow();
    });
  });

  describe('deleteImportBatch', () => {
    it('should delete import batch when user is owner', async () => {
      (prismaService.importBatch.findUnique as jest.Mock).mockResolvedValue(mockImportBatch);
      (prismaService.$transaction as jest.Mock).mockImplementation(
        (callback: (tx: PrismaService) => Promise<void>) => callback(prismaService),
      );
      (prismaService.importBatch.delete as jest.Mock).mockResolvedValue(mockImportBatch);

      await service.deleteImportBatch('batch-1', 'user-1');

      expect(prismaService.importBatch.delete).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
      });
    });

    it('should throw error when user is not owner', async () => {
      const otherUserBatch = { ...mockImportBatch, uploadedUserId: 'other-user' };
      (prismaService.importBatch.findUnique as jest.Mock).mockResolvedValue(otherUserBatch);

      await expect(service.deleteImportBatch('batch-1', 'user-1')).rejects.toThrow();
    });

    it('should throw error when batch not found', async () => {
      (prismaService.importBatch.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteImportBatch('nonexistent', 'user-1')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock xlsx to pass validation but then fail on database
      const mockWorkbook = {
        SheetNames: ['Perfil', 'Autoavaliação', 'Avaliação 360', 'Pesquisa de Referências'],
        Sheets: {
          Perfil: {},
          Autoavaliação: {},
          'Avaliação 360': {},
          'Pesquisa de Referências': {},
        },
      };

      const xlsxReadSpy = jest.spyOn(xlsx, 'read').mockReturnValue(mockWorkbook);
      const xlsxSheetToJsonSpy = jest.spyOn(xlsx.utils, 'sheet_to_json').mockReturnValue([]);

      (prismaService.importBatch.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.processXslFile(mockFile, mockUser)).rejects.toThrow('Database error');

      // Clean up
      xlsxReadSpy.mockRestore();
      xlsxSheetToJsonSpy.mockRestore();
    });

    it('should handle invalid Excel file content', async () => {
      const invalidBuffer = Buffer.from('invalid excel content');
      const invalidFile = { ...mockFile, buffer: invalidBuffer };

      (prismaService.importBatch.create as jest.Mock).mockResolvedValue(mockImportBatch);

      await expect(service.processXslFile(invalidFile, mockUser)).rejects.toThrow();
    });
  });
});
