import { Test, TestingModule } from '@nestjs/testing';

import { TestSummaryDto } from './dto/gen-ai-test.dto';
import { GenAiController } from './gen-ai.controller';
import { GenAiService } from './gen-ai.service';

describe('GenAiController', () => {
  let controller: GenAiController;
  let service: jest.Mocked<GenAiService>;

  beforeEach(async () => {
    const mockGenAiService = {
      getSummary: jest.fn(),
      getTeamEvaluationSummary: jest.fn(),
      getTeamScoreAnalysis: jest.fn(),
      getCollaboratorSummaryForEqualization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenAiController],
      providers: [
        {
          provide: GenAiService,
          useValue: mockGenAiService,
        },
      ],
    }).compile();

    controller = module.get<GenAiController>(GenAiController);
    service = module.get(GenAiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('testSummary', () => {
    it('should generate summary successfully', async () => {
      const testSummaryDto: TestSummaryDto = {
        evaluationText: 'Texto de avaliação teste',
      };
      const expectedSummary = 'Resumo gerado pela IA';
      service.getSummary.mockResolvedValue(expectedSummary);

      const result = await controller.testSummary(testSummaryDto);

      expect(result).toEqual({ summary: expectedSummary });
      expect(service.getSummary).toHaveBeenCalledWith(testSummaryDto.evaluationText);
    });

    it('should handle empty evaluation text', async () => {
      const testSummaryDto: TestSummaryDto = {
        evaluationText: '',
      };
      const expectedSummary = 'Resumo para texto vazio';
      service.getSummary.mockResolvedValue(expectedSummary);

      const result = await controller.testSummary(testSummaryDto);

      expect(result).toEqual({ summary: expectedSummary });
      expect(service.getSummary).toHaveBeenCalledWith('');
    });

    it('should handle long evaluation text', async () => {
      const longText = 'A'.repeat(1000);
      const testSummaryDto: TestSummaryDto = {
        evaluationText: longText,
      };
      const expectedSummary = 'Resumo para texto longo';
      service.getSummary.mockResolvedValue(expectedSummary);

      const result = await controller.testSummary(testSummaryDto);

      expect(result).toEqual({ summary: expectedSummary });
      expect(service.getSummary).toHaveBeenCalledWith(longText);
    });

    it('should propagate service errors', async () => {
      const testSummaryDto: TestSummaryDto = {
        evaluationText: 'Texto teste',
      };
      const error = new Error('Service error');
      service.getSummary.mockRejectedValue(error);

      await expect(controller.testSummary(testSummaryDto)).rejects.toThrow('Service error');
      expect(service.getSummary).toHaveBeenCalledWith(testSummaryDto.evaluationText);
    });
  });

  describe('healthCheck', () => {
    it('should return health check response', () => {
      const result = controller.healthCheck();

      expect(result).toEqual({
        status: 'ok',
        message: 'GenAI Service está funcionando corretamente',
      });
    });

    it('should always return the same health check response', () => {
      const result1 = controller.healthCheck();
      const result2 = controller.healthCheck();

      expect(result1).toEqual(result2);
      expect(result1.status).toBe('ok');
      expect(result1.message).toBe('GenAI Service está funcionando corretamente');
    });
  });
}); 