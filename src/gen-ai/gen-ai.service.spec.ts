import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { OpenAiChatCompletionResponseDto } from './dto/gen-ai-response.dto';
import { CollaboratorEvaluationData } from './dto/collaborator-summary.dto';
import { TeamEvaluationSummaryData, TeamScoreAnalysisData } from './dto/team-evaluation.dto';
import { GenAiService } from './gen-ai.service';

describe('GenAiService', () => {
  let service: GenAiService;
  let httpService: jest.Mocked<HttpService>;

  const mockOpenAiResponse: AxiosResponse<OpenAiChatCompletionResponseDto> = {
    data: {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '{"facts": "Teste de fatos brutos gerados pela IA"}',
          },
          finish_reason: 'stop',
        },
      ],
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  const mockTeamData: TeamEvaluationSummaryData = {
    cycle: '2025.1',
    teamAverageScore: 4.2,
    totalCollaborators: 5,
    highPerformers: 2,
    lowPerformers: 0,
    collaborators: [
      {
        collaboratorId: '1',
        collaboratorName: 'João Silva',
        jobTitle: 'Desenvolvedor',
        seniority: 'Pleno',
        averageScore: 4.5,
        assessments360: [
          {
            authorName: 'Maria Santos',
            overallScore: 4.5,
            strengths: 'Excelente trabalho em equipe',
            improvements: 'Melhorar comunicação',
          },
        ],
        managerAssessments: [
          {
            authorName: 'Pedro Costa',
            answers: [
              {
                criterionId: '1',
                score: 4,
                justification: 'Bom desempenho',
              },
            ],
          },
        ],
      },
    ],
  };

  const mockTeamScoreData: TeamScoreAnalysisData = {
    cycle: '2025.1',
    totalCollaborators: 5,
    teamAverageScore: 4.2,
    behaviorAverage: 4.3,
    executionAverage: 4.1,
    highPerformers: 2,
    criticalPerformers: 0,
    collaborators: [
      {
        collaboratorId: '1',
        collaboratorName: 'João Silva',
        finalScore: 4.5,
        behaviorScore: 4.6,
        executionScore: 4.4,
        hasCommitteeScore: true,
      },
    ],
  };

  const mockCollaboratorData: CollaboratorEvaluationData = {
    collaboratorId: '1',
    collaboratorName: 'João Silva',
    jobTitle: 'Desenvolvedor',
    seniority: 'Pleno',
    cycle: '2025.1',
    selfAssessment: {
      averageScore: 4.2,
      answers: [
        {
          criterionName: 'Trabalho em Equipe',
          pillarName: 'Comportamento',
          score: 4,
          justification: 'Colaboro bem com a equipe',
        },
      ],
    },
    assessments360: [
      {
        authorName: 'Maria Santos',
        authorJobTitle: 'Tech Lead',
        overallScore: 4.5,
        strengths: 'Excelente trabalho em equipe',
        improvements: 'Melhorar comunicação',
      },
    ],
    managerAssessments: [
      {
        authorName: 'Pedro Costa',
        authorJobTitle: 'Gerente',
        answers: [
          {
            criterionName: 'Qualidade',
            pillarName: 'Execução',
            score: 4,
            justification: 'Bom desempenho',
          },
        ],
      },
    ],
    mentoringAssessments: [
      {
        authorName: 'Ana Silva',
        score: 4.2,
        justification: 'Bom progresso',
      },
    ],
    referenceFeedbacks: [
      {
        authorName: 'Carlos Lima',
        justification: 'Recomendo fortemente',
      },
    ],
    statistics: {
      averageScore: 4.2,
      totalEvaluations: 8,
      scoresByPillar: {
        comportamento: 4.3,
        execucao: 4.1,
        gestao: 4.0,
      },
    },
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenAiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<GenAiService>(GenAiService);
    httpService = module.get(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should generate summary successfully', async () => {
      httpService.post.mockReturnValue(of(mockOpenAiResponse));

      const result = await service.getSummary('Texto de avaliação teste');

      expect(result).toBe('Teste de fatos brutos gerados pela IA');
      expect(httpService.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining('Texto de avaliação teste') }],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });
    });

    it('should throw InternalServerErrorException when response has no content', async () => {
      const responseWithoutContent = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: null } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithoutContent));

      await expect(service.getSummary('Texto teste')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has invalid JSON format', async () => {
      const responseWithInvalidJson = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: 'invalid json' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithInvalidJson));

      await expect(service.getSummary('Texto teste')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has wrong JSON structure', async () => {
      const responseWithWrongStructure = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: '{"wrong": "structure"}' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithWrongStructure));

      await expect(service.getSummary('Texto teste')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when HTTP request fails', async () => {
      const axiosError = new AxiosError('Network error', 'NETWORK_ERROR');
      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.getSummary('Texto teste')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when other error occurs', async () => {
      httpService.post.mockReturnValue(throwError(() => new Error('Unexpected error')));

      await expect(service.getSummary('Texto teste')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTeamEvaluationSummary', () => {
    it('should generate team evaluation summary successfully', async () => {
      httpService.post.mockReturnValue(of(mockOpenAiResponse));

      const result = await service.getTeamEvaluationSummary(mockTeamData);

      expect(result).toBe('Teste de fatos brutos gerados pela IA');
      expect(httpService.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining('2025.1') }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
    });

    it('should throw InternalServerErrorException when response has no content', async () => {
      const responseWithoutContent = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: null } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithoutContent));

      await expect(service.getTeamEvaluationSummary(mockTeamData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has invalid JSON format', async () => {
      const responseWithInvalidJson = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: 'invalid json' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithInvalidJson));

      await expect(service.getTeamEvaluationSummary(mockTeamData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has wrong JSON structure', async () => {
      const responseWithWrongStructure = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: '{"wrong": "structure"}' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithWrongStructure));

      await expect(service.getTeamEvaluationSummary(mockTeamData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when HTTP request fails', async () => {
      const axiosError = new AxiosError('Network error', 'NETWORK_ERROR');
      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.getTeamEvaluationSummary(mockTeamData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when other error occurs', async () => {
      httpService.post.mockReturnValue(throwError(() => new Error('Unexpected error')));

      await expect(service.getTeamEvaluationSummary(mockTeamData)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTeamScoreAnalysis', () => {
    it('should generate team score analysis successfully', async () => {
      httpService.post.mockReturnValue(of(mockOpenAiResponse));

      const result = await service.getTeamScoreAnalysis(mockTeamScoreData);

      expect(result).toBe('Teste de fatos brutos gerados pela IA');
      expect(httpService.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining('2025.1') }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });
    });

    it('should throw InternalServerErrorException when response has no content', async () => {
      const responseWithoutContent = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: null } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithoutContent));

      await expect(service.getTeamScoreAnalysis(mockTeamScoreData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has invalid JSON format', async () => {
      const responseWithInvalidJson = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: 'invalid json' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithInvalidJson));

      await expect(service.getTeamScoreAnalysis(mockTeamScoreData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has wrong JSON structure', async () => {
      const responseWithWrongStructure = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: '{"wrong": "structure"}' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithWrongStructure));

      await expect(service.getTeamScoreAnalysis(mockTeamScoreData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when HTTP request fails', async () => {
      const axiosError = new AxiosError('Network error', 'NETWORK_ERROR');
      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.getTeamScoreAnalysis(mockTeamScoreData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when other error occurs', async () => {
      httpService.post.mockReturnValue(throwError(() => new Error('Unexpected error')));

      await expect(service.getTeamScoreAnalysis(mockTeamScoreData)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getCollaboratorSummaryForEqualization', () => {
    it('should generate collaborator summary for equalization successfully', async () => {
      httpService.post.mockReturnValue(of(mockOpenAiResponse));

      const result = await service.getCollaboratorSummaryForEqualization(mockCollaboratorData);

      expect(result).toBe('Teste de fatos brutos gerados pela IA');
      expect(httpService.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining('João Silva') }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });
    });

    it('should handle collaborator data without self assessment', async () => {
      const collaboratorDataWithoutSelfAssessment = {
        ...mockCollaboratorData,
        selfAssessment: null,
      };
      httpService.post.mockReturnValue(of(mockOpenAiResponse));

      const result = await service.getCollaboratorSummaryForEqualization(collaboratorDataWithoutSelfAssessment);

      expect(result).toBe('Teste de fatos brutos gerados pela IA');
      expect(httpService.post).toHaveBeenCalledWith('/chat/completions', {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: expect.stringContaining('Não realizada') }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });
    });

    it('should throw InternalServerErrorException when response has no content', async () => {
      const responseWithoutContent = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: null } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithoutContent));

      await expect(service.getCollaboratorSummaryForEqualization(mockCollaboratorData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has invalid JSON format', async () => {
      const responseWithInvalidJson = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: 'invalid json' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithInvalidJson));

      await expect(service.getCollaboratorSummaryForEqualization(mockCollaboratorData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when response has wrong JSON structure', async () => {
      const responseWithWrongStructure = {
        ...mockOpenAiResponse,
        data: {
          ...mockOpenAiResponse.data,
          choices: [{ ...mockOpenAiResponse.data.choices[0], message: { role: 'assistant', content: '{"wrong": "structure"}' } }],
        },
      };
      httpService.post.mockReturnValue(of(responseWithWrongStructure));

      await expect(service.getCollaboratorSummaryForEqualization(mockCollaboratorData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when HTTP request fails', async () => {
      const axiosError = new AxiosError('Network error', 'NETWORK_ERROR');
      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.getCollaboratorSummaryForEqualization(mockCollaboratorData)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when other error occurs', async () => {
      httpService.post.mockReturnValue(throwError(() => new Error('Unexpected error')));

      await expect(service.getCollaboratorSummaryForEqualization(mockCollaboratorData)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
