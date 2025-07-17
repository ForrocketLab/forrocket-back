import { Test, TestingModule } from '@nestjs/testing';

import { CommitteeDataService } from './committee-data.service';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import {
  CreateCommitteeAssessmentDto,
  UpdateCommitteeAssessmentDto,
  SubmitCommitteeAssessmentDto,
} from './dto/committee-assessment.dto';
import { User } from '../../auth/entities/user.entity';
import { GenAiService } from '../../gen-ai/gen-ai.service';
import { EncryptionService } from '../../common/services/encryption.service';

describe('CommitteeController', () => {
  let controller: CommitteeController;
  let committeeService: jest.Mocked<CommitteeService>;
  let mockGenAiService: any;
  let mockCommitteeDataService: any;

  const mockUser: User = {
    id: 'committee-1',
    name: 'Maria Comitê',
    email: 'maria.comite@rocketcorp.com',
    jobTitle: 'Sócia',
    seniority: 'Senior',
    careerTrack: 'LEADERSHIP',
    businessUnit: 'MANAGEMENT',
    businessHub: 'Management Hub',
    projects: '["projeto-geral"]',
    isActive: true,
    roles: '["comite"]',
    managerId: undefined,
    mentorId: undefined,
    leaderId: null,
    directReports: '[]',
    directLeadership: '[]',
    mentoringIds: '[]',
    importBatchId: null,
    lastActivityAt: new Date(),
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    toPublic: () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...publicUser } = mockUser;
      return publicUser;
    },
  };

  const mockCreateCommitteeAssessmentDto: CreateCommitteeAssessmentDto = {
    evaluatedUserId: 'user-1',
    finalScore: 4,
    justification: 'Avaliação baseada no conjunto de avaliações recebidas.',
    observations: 'Colaborador com bom desempenho geral.',
  };

  const mockUpdateCommitteeAssessmentDto: UpdateCommitteeAssessmentDto = {
    finalScore: 5,
    justification: 'Avaliação ajustada após revisão.',
    observations: 'Excelente performance em todos os critérios.',
  };

  const mockSubmitCommitteeAssessmentDto: SubmitCommitteeAssessmentDto = {
    evaluationType: 'committee',
  };

  const mockCollaboratorsForEqualization = {
    cycle: '2025.1',
    phase: 'EQUALIZATION',
    collaborators: [
      {
        id: 'user-1',
        name: 'João Silva',
        email: 'joao.silva@rocketcorp.com',
        jobTitle: 'Desenvolvedor',
        seniority: 'Pleno',
        businessUnit: 'TECHNOLOGY',
        hasCommitteeAssessment: false,
        committeeAssessment: null,
      },
    ],
    summary: {
      totalCollaborators: 1,
      withCommitteeAssessment: 0,
      pendingEqualization: 1,
    },
  };

  const mockCollaboratorSummary = {
    cycle: '2025.1',
    collaborator: {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao.silva@rocketcorp.com',
      jobTitle: 'Desenvolvedor',
      seniority: 'Pleno',
    },
    selfAssessment: { id: 'self-1', score: 4 },
    assessments360Received: [{ id: '360-1', score: 4 }],
    managerAssessmentsReceived: [{ id: 'mgr-1', score: 5 }],
    mentoringAssessmentsReceived: [],
    referenceFeedbacksReceived: [],
    committeeAssessment: null,
    summary: {
      totalAssessmentsReceived: 3,
      hasCommitteeAssessment: false,
      isEqualizationComplete: false,
    },
  };

  const mockCommitteeAssessment = {
    id: 'committee-assessment-1',
    cycle: '2025.1',
    finalScore: 4,
    justification: 'Avaliação baseada no conjunto de avaliações recebidas.',
    observations: 'Colaborador com bom desempenho geral.',
    status: 'DRAFT',
    createdAt: '2025-07-10T05:30:52.271Z',
    author: {
      id: 'committee-1',
      name: 'Maria Comitê',
      email: 'maria.comite@rocketcorp.com',
    },
    evaluatedUser: {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao.silva@rocketcorp.com',
      jobTitle: 'Desenvolvedor',
      seniority: 'Pleno',
    },
  };

  const mockCommitteeAssessmentsByCycle = {
    cycle: '2025.1',
    phase: 'EQUALIZATION',
    assessments: [mockCommitteeAssessment],
    summary: {
      total: 1,
      draft: 1,
      submitted: 0,
      completion: 50,
    },
  };

  beforeEach(async () => {
    const mockCommitteeService = {
      getCollaboratorsForEqualization: jest.fn(),
      getCollaboratorEvaluationSummary: jest.fn(),
      createCommitteeAssessment: jest.fn(),
      updateCommitteeAssessment: jest.fn(),
      submitCommitteeAssessment: jest.fn(),
      getCommitteeAssessmentsByCycle: jest.fn(),
      getCommitteeMetrics: jest.fn(),
      exportCollaboratorEvaluationData: jest.fn(),
      getGenAISummary: jest.fn(),
      listGenAISummariesByCycle: jest.fn(),
      checkGenAISummaryExists: jest.fn(),
      saveGenAISummary: jest.fn(),
    };

    mockGenAiService = {
      getCollaboratorSummaryForEqualization: jest.fn(),
      getCollaboratorSummary: jest.fn(),
      listCollaboratorSummariesByCycle: jest.fn(),
      checkCollaboratorSummaryExists: jest.fn(),
    };
    mockCommitteeDataService = {
      getCollaboratorEvaluationData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommitteeController],
      providers: [
        {
          provide: CommitteeService,
          useValue: mockCommitteeService,
        },
        {
          provide: CommitteeDataService,
          useValue: mockCommitteeDataService,
        },
        {
          provide: GenAiService,
          useValue: mockGenAiService,
        },
        {
          provide: EncryptionService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CommitteeController>(CommitteeController);
    committeeService = module.get(CommitteeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCollaboratorsForEqualization', () => {
    it('deve retornar lista de colaboradores para equalização', async () => {
      jest
        .spyOn(committeeService, 'getCollaboratorsForEqualization')
        .mockResolvedValue(mockCollaboratorsForEqualization as any);

      const result = await controller.getCollaboratorsForEqualization(mockUser);

      expect(result).toEqual(mockCollaboratorsForEqualization);
      expect(committeeService.getCollaboratorsForEqualization).toHaveBeenCalled();
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro no service');
      jest.spyOn(committeeService, 'getCollaboratorsForEqualization').mockRejectedValue(error);

      await expect(controller.getCollaboratorsForEqualization(mockUser)).rejects.toThrow(
        'Erro no service',
      );
    });
  });

  describe('getCommitteeMetrics', () => {
    it('deve retornar métricas do comitê', async () => {
      const mockMetrics = {
        cycle: '2025.1',
        phase: 'EQUALIZATION',
        deadlines: {
          assessment: new Date(),
          manager: new Date(),
          equalization: new Date(),
          daysRemaining: 15,
        },
        metrics: {
          totalCollaborators: 50,
          selfAssessmentCompletion: 85,
          assessment360Completion: 72,
          managerAssessmentCompletion: 90,
          committeeAssessmentCompletion: 60,
          counts: {
            selfAssessments: 42,
            assessments360: 36,
            managerAssessments: 45,
            committeeAssessments: 30,
          },
        },
      };

      jest.spyOn(committeeService, 'getCommitteeMetrics').mockResolvedValue(mockMetrics as any);

      const result = await controller.getCommitteeMetrics(mockUser);

      expect(result).toEqual(mockMetrics);
      expect(committeeService.getCommitteeMetrics).toHaveBeenCalled();
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro no service');
      jest.spyOn(committeeService, 'getCommitteeMetrics').mockRejectedValue(error);

      await expect(controller.getCommitteeMetrics(mockUser)).rejects.toThrow('Erro no service');
    });
  });

  describe('getCollaboratorEvaluationSummary', () => {
    it('deve retornar resumo de avaliações do colaborador', async () => {
      jest.spyOn(committeeService, 'getCollaboratorEvaluationSummary').mockResolvedValue(mockCollaboratorSummary as any);

      const result = await controller.getCollaboratorEvaluationSummary(mockUser, 'user-1');

      expect(result).toEqual(mockCollaboratorSummary);
      expect(committeeService.getCollaboratorEvaluationSummary).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Colaborador não encontrado');
      jest.spyOn(committeeService, 'getCollaboratorEvaluationSummary').mockRejectedValue(error);

      await expect(controller.getCollaboratorEvaluationSummary(mockUser, 'invalid-user')).rejects.toThrow('Colaborador não encontrado');
    });
  });

  describe('createCommitteeAssessment', () => {
    it('deve criar avaliação de comitê com sucesso', async () => {
      const createdAssessment = {
        ...mockCommitteeAssessment,
        id: 'new-assessment',
        status: 'DRAFT',
      };

      jest.spyOn(committeeService, 'createCommitteeAssessment').mockResolvedValue(createdAssessment as any);

      const result = await controller.createCommitteeAssessment(mockUser, mockCreateCommitteeAssessmentDto);

      expect(result).toEqual(createdAssessment);
      expect(committeeService.createCommitteeAssessment).toHaveBeenCalledWith(
        mockUser.id,
        mockCreateCommitteeAssessmentDto
      );
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro ao criar avaliação');
      jest.spyOn(committeeService, 'createCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.createCommitteeAssessment(mockUser, mockCreateCommitteeAssessmentDto)).rejects.toThrow('Erro ao criar avaliação');
    });

    it('deve lidar com dados inválidos', async () => {
      const invalidDto = {
        evaluatedUserId: '',
        finalScore: -1,
        justification: '',
      };

      const error = new Error('Dados inválidos');
      jest.spyOn(committeeService, 'createCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.createCommitteeAssessment(mockUser, invalidDto as any)).rejects.toThrow('Dados inválidos');
    });
  });

  describe('updateCommitteeAssessment', () => {
    it('deve atualizar avaliação de comitê com sucesso', async () => {
      const updatedAssessment = {
        ...mockCommitteeAssessment,
        finalScore: 5,
        justification: 'Avaliação ajustada após revisão.',
      };

      jest.spyOn(committeeService, 'updateCommitteeAssessment').mockResolvedValue(updatedAssessment as any);

      const result = await controller.updateCommitteeAssessment(mockUser, 'assessment-1', mockUpdateCommitteeAssessmentDto);

      expect(result).toEqual(updatedAssessment);
      expect(committeeService.updateCommitteeAssessment).toHaveBeenCalledWith(
        'assessment-1',
        mockUser.id,
        mockUpdateCommitteeAssessmentDto
      );
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Avaliação não encontrada');
      jest.spyOn(committeeService, 'updateCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.updateCommitteeAssessment(mockUser, 'invalid-id', mockUpdateCommitteeAssessmentDto)).rejects.toThrow('Avaliação não encontrada');
    });

    it('deve lidar com dados de atualização inválidos', async () => {
      const invalidDto = {
        finalScore: 10, // Score inválido
        justification: '',
      };

      const error = new Error('Dados inválidos');
      jest.spyOn(committeeService, 'updateCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.updateCommitteeAssessment(mockUser, 'assessment-1', invalidDto as any)).rejects.toThrow('Dados inválidos');
    });
  });

  describe('submitCommitteeAssessment', () => {
    it('deve submeter avaliação de comitê com sucesso', async () => {
      const submittedAssessment = {
        ...mockCommitteeAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      };

      jest.spyOn(committeeService, 'submitCommitteeAssessment').mockResolvedValue(submittedAssessment as any);

      const result = await controller.submitCommitteeAssessment(mockUser, 'assessment-1', mockSubmitCommitteeAssessmentDto);

      expect(result).toEqual(submittedAssessment);
      expect(committeeService.submitCommitteeAssessment).toHaveBeenCalledWith(
        'assessment-1',
        mockUser.id
      );
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Avaliação já foi submetida');
      jest.spyOn(committeeService, 'submitCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.submitCommitteeAssessment(mockUser, 'assessment-1', mockSubmitCommitteeAssessmentDto)).rejects.toThrow('Avaliação já foi submetida');
    });

    it('deve lidar com dados de submissão inválidos', async () => {
      const invalidDto = {
        evaluationType: 'invalid-type',
      };

      const error = new Error('Tipo de avaliação inválido');
      jest.spyOn(committeeService, 'submitCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.submitCommitteeAssessment(mockUser, 'assessment-1', invalidDto as any)).rejects.toThrow('Tipo de avaliação inválido');
    });
  });

  describe('getCommitteeAssessmentsByCycle', () => {
    it('deve retornar avaliações de comitê do ciclo ativo', async () => {
      jest.spyOn(committeeService, 'getCommitteeAssessmentsByCycle').mockResolvedValue(mockCommitteeAssessmentsByCycle as any);

      const result = await controller.getCommitteeAssessmentsByCycle(mockUser);

      expect(result).toEqual(mockCommitteeAssessmentsByCycle);
      expect(committeeService.getCommitteeAssessmentsByCycle).toHaveBeenCalled();
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Não há ciclo ativo');
      jest.spyOn(committeeService, 'getCommitteeAssessmentsByCycle').mockRejectedValue(error);

      await expect(controller.getCommitteeAssessmentsByCycle(mockUser)).rejects.toThrow('Não há ciclo ativo');
    });
  });

  describe('exportCollaboratorData', () => {
    it('deve exportar dados do colaborador com sucesso', async () => {
      const mockExportData = {
        cycle: '2025.1',
        collaborator: {
          id: 'user-1',
          name: 'João Silva',
          email: 'joao.silva@rocketcorp.com',
        },
        evaluations: [],
        summary: {},
      };

      jest.spyOn(committeeService, 'exportCollaboratorEvaluationData').mockResolvedValue(mockExportData as any);

      const result = await controller.exportCollaboratorData('user-1');

      expect(result).toEqual(mockExportData);
      expect(committeeService.exportCollaboratorEvaluationData).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Colaborador não encontrado');
      jest.spyOn(committeeService, 'exportCollaboratorEvaluationData').mockRejectedValue(error);

      await expect(controller.exportCollaboratorData('invalid-user')).rejects.toThrow('Colaborador não encontrado');
    });
  });

  describe('GenAI Methods', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('generateCollaboratorSummary', () => {
      it('deve gerar resumo do colaborador com sucesso', async () => {
        const requestDto = {
          collaboratorId: 'user-1',
          cycle: '2025.1',
        };

        const mockSummary = {
          id: 'summary-1',
          collaboratorId: 'user-1',
          cycle: '2025.1',
          summary: 'Resumo gerado por IA',
          collaboratorName: 'João Silva',
          jobTitle: 'Desenvolvedor',
          averageScore: 4.5,
          totalEvaluations: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockCommitteeDataService.getCollaboratorEvaluationData.mockResolvedValue({
          collaboratorId: 'user-1',
          collaboratorName: 'João Silva',
          jobTitle: 'Desenvolvedor',
          cycle: '2025.1',
          selfAssessment: null,
          assessments360: [],
          managerAssessments: [],
          mentoringAssessments: [],
          referenceFeedbacks: [],
          statistics: { averageScore: 4.5, totalEvaluations: 5 },
        });

        mockGenAiService.getCollaboratorSummaryForEqualization.mockResolvedValue(mockSummary);
        committeeService.saveGenAISummary.mockResolvedValue(mockSummary);

        const result = await controller.generateCollaboratorSummary(mockUser, requestDto);

        expect(result).toEqual(mockSummary);
        expect(mockCommitteeDataService.getCollaboratorEvaluationData).toHaveBeenCalledWith('user-1', '2025.1');
        expect(mockGenAiService.getCollaboratorSummaryForEqualization).toHaveBeenCalled();
        expect(committeeService.saveGenAISummary).toHaveBeenCalledWith(
          'user-1',
          '2025.1',
          mockSummary,
          'João Silva',
          'Desenvolvedor',
          4.5,
          5
        );
      });

      it('deve propagar erro do service', async () => {
        const requestDto = {
          collaboratorId: 'user-1',
          cycle: '2025.1',
        };

        const error = new Error('Erro ao gerar resumo');
        mockGenAiService.getCollaboratorSummaryForEqualization.mockRejectedValue(error);

        await expect(controller.generateCollaboratorSummary(mockUser, requestDto)).rejects.toThrow('Erro ao gerar resumo');
      });
    });

    describe('getCollaboratorSummary', () => {
      it('deve obter resumo do colaborador com sucesso', async () => {
        const mockSummary = {
          id: 'summary-1',
          collaboratorId: 'user-1',
          cycle: '2025.1',
          summary: 'Resumo existente',
          collaboratorName: 'João Silva',
          jobTitle: 'Desenvolvedor',
          averageScore: 4.5,
          totalEvaluations: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        committeeService.getGenAISummary.mockResolvedValue(mockSummary);

        const result = await controller.getCollaboratorSummary(mockUser, 'user-1', '2025.1');

        expect(result).toEqual(mockSummary);
        expect(committeeService.getGenAISummary).toHaveBeenCalledWith({
          collaboratorId: 'user-1',
          cycle: '2025.1',
        });
      });

      it('deve propagar erro do service', async () => {
        const error = new Error('Resumo não encontrado');
        committeeService.getGenAISummary.mockRejectedValue(error);

        await expect(controller.getCollaboratorSummary(mockUser, 'user-1', '2025.1')).rejects.toThrow('Resumo não encontrado');
      });
    });

    describe('listCollaboratorSummariesByCycle', () => {
      it('deve listar resumos por ciclo com sucesso', async () => {
        const mockSummaries = [
          {
            id: 'summary-1',
            collaboratorId: 'user-1',
            cycle: '2025.1',
            summary: 'Resumo 1',
            collaboratorName: 'João Silva',
            jobTitle: 'Desenvolvedor',
            averageScore: 4.5,
            totalEvaluations: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        committeeService.listGenAISummariesByCycle.mockResolvedValue(mockSummaries);

        const result = await controller.listCollaboratorSummariesByCycle(mockUser, '2025.1');

        expect(result).toEqual(mockSummaries);
        expect(committeeService.listGenAISummariesByCycle).toHaveBeenCalledWith('2025.1');
      });

      it('deve propagar erro do service', async () => {
        const error = new Error('Erro ao listar resumos');
        committeeService.listGenAISummariesByCycle.mockRejectedValue(error);

        await expect(controller.listCollaboratorSummariesByCycle(mockUser, '2025.1')).rejects.toThrow('Erro ao listar resumos');
      });
    });

    describe('checkCollaboratorSummaryExists', () => {
      it('deve verificar se resumo existe com sucesso', async () => {
        const mockResult = {
          exists: true,
          collaboratorId: 'user-1',
          cycle: '2025.1',
        };

        committeeService.checkGenAISummaryExists.mockResolvedValue(true);

        const result = await controller.checkCollaboratorSummaryExists(mockUser, 'user-1', '2025.1');

        expect(result).toEqual(mockResult);
        expect(committeeService.checkGenAISummaryExists).toHaveBeenCalledWith('user-1', '2025.1');
      });

      it('deve retornar false quando resumo não existe', async () => {
        const mockResult = {
          exists: false,
          collaboratorId: 'user-1',
          cycle: '2025.1',
        };

        committeeService.checkGenAISummaryExists.mockResolvedValue(false);

        const result = await controller.checkCollaboratorSummaryExists(mockUser, 'user-1', '2025.1');

        expect(result.exists).toBe(false);
      });

      it('deve propagar erro do service', async () => {
        const error = new Error('Erro ao verificar resumo');
        committeeService.checkGenAISummaryExists.mockRejectedValue(error);

        await expect(controller.checkCollaboratorSummaryExists(mockUser, 'user-1', '2025.1')).rejects.toThrow('Erro ao verificar resumo');
      });
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve lidar com usuário undefined', async () => {
      const error = new Error('Usuário não autenticado');
      jest.spyOn(committeeService, 'getCollaboratorsForEqualization').mockRejectedValue(error);

      await expect(controller.getCollaboratorsForEqualization(undefined as any)).rejects.toThrow('Usuário não autenticado');
    });

    it('deve lidar com parâmetros inválidos', async () => {
      const error = new Error('ID inválido');
      jest.spyOn(committeeService, 'getCollaboratorEvaluationSummary').mockRejectedValue(error);

      await expect(controller.getCollaboratorEvaluationSummary(mockUser, '')).rejects.toThrow('ID inválido');
    });

    it('deve lidar com DTOs vazios', async () => {
      const error = new Error('Dados obrigatórios não fornecidos');
      jest.spyOn(committeeService, 'createCommitteeAssessment').mockRejectedValue(error);

      await expect(controller.createCommitteeAssessment(mockUser, {} as any)).rejects.toThrow('Dados obrigatórios não fornecidos');
    });
  });

  describe('Integração com Guards', () => {
    it('deve ter JwtAuthGuard aplicado', () => {
      const guards = Reflect.getMetadata('__guards__', CommitteeController) || [];
      const guardNames = guards.map((guard: any) => guard.name);
      
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('deve ter CommitteeRoleGuard aplicado em endpoints específicos', () => {
      // Verificar se o guard está aplicado no método getCollaboratorsForEqualization
      const methodGuards = Reflect.getMetadata('__guards__', CommitteeController.prototype.getCollaboratorsForEqualization) || [];
      const guardNames = methodGuards.map((guard: any) => guard.name);
      
      expect(guardNames).toContain('CommitteeRoleGuard');
    });
  });
});
