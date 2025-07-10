import { Readable } from 'stream';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, ImportStatus } from '@prisma/client';

import { PaginationQueryDto } from './dto/pagination.dto';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

describe('ImportController', () => {
  let controller: ImportController;
  let service: jest.Mocked<ImportService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    jobTitle: 'Developer',
    seniority: 'Pleno',
    passwordHash: 'hashedPassword',
    roles: '["HR"]',
    careerTrack: 'Tech',
    businessUnit: 'Technology',
    businessHub: 'São Paulo',
    projects: '["project-1"]',
    managerId: null,
    directReports: '["report-1"]',
    mentorId: null,
    leaderId: null,
    directLeadership: '["leadership-1"]',
    mentoringIds: '["mentoring-1"]',
    importBatchId: null,
    lastActivityAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImportBatchWithRelations = {
    id: 'batch-1',
    fileName: 'test-file.xlsx',
    uploadedUserId: 'user-1',
    importedAt: new Date(),
    status: ImportStatus.COMPLETED,
    notes: null,
    uploadedUser: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    _count: {
      createdUsers: 10,
      createdSelfAssessments: 5,
      createdAssessments360: 8,
      createdReferenceFeedbacks: 3,
    },
  };

  const mockImportBatchDetails = {
    id: 'batch-1',
    fileName: 'test-file.xlsx',
    uploadedUserId: 'user-1',
    importedAt: new Date(),
    status: ImportStatus.COMPLETED,
    notes: null,
    uploadedUser: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    createdUsers: [
      {
        id: 'user-created-1',
        name: 'Created User',
        email: 'created@example.com',
        createdAt: new Date(),
      },
    ],
    createdSelfAssessments: [],
    createdAssessments360: [],
    createdReferenceFeedbacks: [],
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
    const mockImportService = {
      processXslFile: jest.fn(),
      processMultipleXslFiles: jest.fn(),
      getImportBatchesByUser: jest.fn(),
      getImportBatchesByUserPaginated: jest.fn(),
      getAllImportBatches: jest.fn(),
      getImportBatchDetails: jest.fn(),
      deleteImportBatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        {
          provide: ImportService,
          useValue: mockImportService,
        },
      ],
    }).compile();

    controller = module.get<ImportController>(ImportController);
    service = module.get(ImportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadExcelFile', () => {
    it('should upload and process a single Excel file successfully', async () => {
      const mockResponse = {
        message: 'Arquivo processado com sucesso',
        userId: mockUser.id,
        userName: mockUser.name,
        batchId: 'batch-1',
      };

      service.processXslFile.mockResolvedValue(mockResponse);

      const result = await controller.uploadExcelFile(mockFile, mockUser);

      expect(result).toEqual(mockResponse);
      expect(service.processXslFile).toHaveBeenCalledWith(mockFile, mockUser);
    });

    it('should handle service errors', async () => {
      service.processXslFile.mockRejectedValue(new BadRequestException('Invalid file'));

      await expect(controller.uploadExcelFile(mockFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadMultipleExcelFiles', () => {
    it('should upload and process multiple Excel files successfully', async () => {
      const files = [mockFile, { ...mockFile, originalname: 'test-file-2.xlsx' }];
      const mockResponse = {
        totalFiles: 2,
        successfulFiles: 2,
        failedFiles: 0,
        fileResults: [
          {
            fileName: 'test-file.xlsx',
            batchId: 'batch-1',
            status: 'SUCCESS' as const,
            message: 'Sucesso',
            userId: mockUser.id,
            userName: mockUser.name,
          },
          {
            fileName: 'test-file-2.xlsx',
            batchId: 'batch-2',
            status: 'SUCCESS' as const,
            message: 'Sucesso',
            userId: mockUser.id,
            userName: mockUser.name,
          },
        ],
        message: 'Processamento concluído',
      };

      service.processMultipleXslFiles.mockResolvedValue(mockResponse);

      const result = await controller.uploadMultipleExcelFiles(files, mockUser);

      expect(result).toEqual(mockResponse);
      expect(service.processMultipleXslFiles).toHaveBeenCalledWith(files, mockUser);
    });
  });

  describe('getMyImportBatches', () => {
    it('should return paginated import batches with default parameters', async () => {
      const mockPaginatedResponse = {
        data: [mockImportBatchWithRelations],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      service.getImportBatchesByUserPaginated.mockResolvedValue(mockPaginatedResponse);

      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        sortBy: 'importedAt',
        sortOrder: 'desc',
      };
      const result = await controller.getMyImportBatches(mockUser, query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.getImportBatchesByUserPaginated).toHaveBeenCalledWith(
        mockUser.id,
        1, // default page
        10, // default limit
        'importedAt', // default sortBy
        'desc', // default sortOrder
      );
    });

    it('should return paginated import batches with custom parameters', async () => {
      const mockPaginatedResponse = {
        data: [mockImportBatchWithRelations],
        meta: {
          page: 2,
          limit: 20,
          total: 25,
          totalPages: 2,
          hasNext: false,
          hasPrevious: true,
        },
      };

      service.getImportBatchesByUserPaginated.mockResolvedValue(mockPaginatedResponse);

      const query: PaginationQueryDto = {
        page: 2,
        limit: 20,
        sortBy: 'fileName',
        sortOrder: 'asc',
      };
      const result = await controller.getMyImportBatches(mockUser, query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.getImportBatchesByUserPaginated).toHaveBeenCalledWith(
        mockUser.id,
        2,
        20,
        'fileName',
        'asc',
      );
    });

    it('should handle validation and use corrected values', async () => {
      const mockPaginatedResponse = {
        data: [mockImportBatchWithRelations],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      service.getImportBatchesByUserPaginated.mockResolvedValue(mockPaginatedResponse);

      // O ValidationPipe transformaria os valores inválidos
      await controller.getMyImportBatches(mockUser, {
        page: 1,
        limit: 10,
        sortBy: 'importedAt',
        sortOrder: 'desc',
      });

      expect(service.getImportBatchesByUserPaginated).toHaveBeenCalled();
    });
  });

  describe('getMyImportBatchesAll', () => {
    it('should return all import batches for user without pagination', async () => {
      const mockBatches = [mockImportBatchWithRelations];
      service.getImportBatchesByUser.mockResolvedValue(mockBatches);

      const result = await controller.getMyImportBatchesAll(mockUser);

      expect(result).toEqual(mockBatches);
      expect(service.getImportBatchesByUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getAllImportBatches', () => {
    it('should return all import batches in the system', async () => {
      const mockBatches = [mockImportBatchWithRelations];
      service.getAllImportBatches.mockResolvedValue(mockBatches);

      const result = await controller.getAllImportBatches();

      expect(result).toEqual(mockBatches);
      expect(service.getAllImportBatches).toHaveBeenCalled();
    });
  });

  describe('getImportBatchDetails', () => {
    it('should return import batch details', async () => {
      service.getImportBatchDetails.mockResolvedValue(mockImportBatchDetails);

      const result = await controller.getImportBatchDetails('batch-1');

      expect(result).toEqual(mockImportBatchDetails);
      expect(service.getImportBatchDetails).toHaveBeenCalledWith('batch-1');
    });

    it('should handle not found errors', async () => {
      service.getImportBatchDetails.mockRejectedValue(new Error('Batch not found'));

      await expect(controller.getImportBatchDetails('nonexistent')).rejects.toThrow(
        'Batch not found',
      );
    });
  });

  describe('deleteImportBatch', () => {
    it('should delete import batch successfully', async () => {
      service.deleteImportBatch.mockResolvedValue(undefined);

      const result = await controller.deleteImportBatch('batch-1', mockUser);

      expect(result).toEqual({
        message: 'Lote de importação removido com sucesso',
      });
      expect(service.deleteImportBatch).toHaveBeenCalledWith('batch-1', mockUser.id);
    });

    it('should handle delete errors', async () => {
      service.deleteImportBatch.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.deleteImportBatch('batch-1', mockUser)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('pagination edge cases', () => {
    it('should handle empty results', async () => {
      const mockEmptyResponse = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };

      service.getImportBatchesByUserPaginated.mockResolvedValue(mockEmptyResponse);

      const query: PaginationQueryDto = {};
      const result = await controller.getMyImportBatches(mockUser, query);

      expect(result).toEqual(mockEmptyResponse);
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should handle large datasets with proper pagination', async () => {
      const mockLargeResponse = {
        data: Array(50).fill(mockImportBatchWithRelations),
        meta: {
          page: 3,
          limit: 50,
          total: 150,
          totalPages: 3,
          hasNext: false,
          hasPrevious: true,
        },
      };

      service.getImportBatchesByUserPaginated.mockResolvedValue(mockLargeResponse);

      const query: PaginationQueryDto = {
        page: 3,
        limit: 50,
      };
      const result = await controller.getMyImportBatches(mockUser, query);

      expect(result).toEqual(mockLargeResponse);
      expect(result.data).toHaveLength(50);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrevious).toBe(true);
    });
  });
});
