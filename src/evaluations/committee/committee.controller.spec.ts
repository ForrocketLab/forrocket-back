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

describe('CommitteeController', () => {
  let controller: CommitteeController;
  let committeeService: jest.Mocked<CommitteeService>;

  const mockUser: User = {
    id: 'committee-1',
    name: 'Maria Comitê',
    email: 'maria.comite@rocketcorp.com',
    jobTitle: 'Sócia',
    seniority: 'Senior',
    careerTrack: 'LEADERSHIP',
    businessUnit: 'MANAGEMENT',
    projects: ['projeto-geral'],
    isActive: true,
    roles: ['comite'],
    managerId: undefined,
    mentorId: undefined,
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
    createdAt: new Date(),
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
    };

    const mockCommitteeDataService = {
      // Add mock methods as needed
    };

    const mockGenAiService = {
      generateCollaboratorSummary: jest.fn(),
      getCollaboratorSummary: jest.fn(),
      listCollaboratorSummariesByCycle: jest.fn(),
      checkCollaboratorSummaryExists: jest.fn(),
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

  describe('getCollaboratorEvaluationSummary', () => {
    it('deve retornar resumo de avaliações do colaborador', async () => {
      jest
        .spyOn(committeeService, 'getCollaboratorEvaluationSummary')
        .mockResolvedValue(mockCollaboratorSummary as any);

      const result = await controller.getCollaboratorEvaluationSummary(mockUser, 'user-1');

      expect(result).toEqual(mockCollaboratorSummary);
      expect(committeeService.getCollaboratorEvaluationSummary).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service quando colaborador não existe', async () => {
      const error = new Error('Colaborador não encontrado');
      jest.spyOn(committeeService, 'getCollaboratorEvaluationSummary').mockRejectedValue(error);

      await expect(
        controller.getCollaboratorEvaluationSummary(mockUser, 'user-inexistente'),
      ).rejects.toThrow('Colaborador não encontrado');
    });
  });

  describe('createCommitteeAssessment', () => {
    it('deve criar avaliação de comitê com sucesso', async () => {
      jest
        .spyOn(committeeService, 'createCommitteeAssessment')
        .mockResolvedValue(mockCommitteeAssessment as any);

      const result = await controller.createCommitteeAssessment(
        mockUser,
        mockCreateCommitteeAssessmentDto,
      );

      expect(result).toEqual(mockCommitteeAssessment);
      expect(committeeService.createCommitteeAssessment).toHaveBeenCalledWith(
        'committee-1',
        mockCreateCommitteeAssessmentDto,
      );
    });

    it('deve propagar erro do service quando já existe avaliação', async () => {
      const error = new Error('Já existe avaliação para este colaborador');
      jest.spyOn(committeeService, 'createCommitteeAssessment').mockRejectedValue(error);

      await expect(
        controller.createCommitteeAssessment(mockUser, mockCreateCommitteeAssessmentDto),
      ).rejects.toThrow('Já existe avaliação para este colaborador');
    });
  });

  describe('updateCommitteeAssessment', () => {
    it('deve atualizar avaliação de comitê com sucesso', async () => {
      const updatedAssessment = { ...mockCommitteeAssessment, finalScore: 5 };
      jest
        .spyOn(committeeService, 'updateCommitteeAssessment')
        .mockResolvedValue(updatedAssessment as any);

      const result = await controller.updateCommitteeAssessment(
        mockUser,
        'committee-assessment-1',
        mockUpdateCommitteeAssessmentDto,
      );

      expect(result).toEqual(updatedAssessment);
      expect(committeeService.updateCommitteeAssessment).toHaveBeenCalledWith(
        'committee-assessment-1',
        'committee-1',
        mockUpdateCommitteeAssessmentDto,
      );
    });

    it('deve propagar erro do service quando avaliação não existe', async () => {
      const error = new Error('Avaliação não encontrada');
      jest.spyOn(committeeService, 'updateCommitteeAssessment').mockRejectedValue(error);

      await expect(
        controller.updateCommitteeAssessment(
          mockUser,
          'assessment-inexistente',
          mockUpdateCommitteeAssessmentDto,
        ),
      ).rejects.toThrow('Avaliação não encontrada');
    });
  });

  describe('submitCommitteeAssessment', () => {
    it('deve submeter avaliação de comitê com sucesso', async () => {
      const submittedAssessment = { ...mockCommitteeAssessment, status: 'SUBMITTED' };
      jest
        .spyOn(committeeService, 'submitCommitteeAssessment')
        .mockResolvedValue(submittedAssessment as any);

      const result = await controller.submitCommitteeAssessment(
        mockUser,
        'committee-assessment-1',
        mockSubmitCommitteeAssessmentDto,
      );

      expect(result).toEqual(submittedAssessment);
      expect(committeeService.submitCommitteeAssessment).toHaveBeenCalledWith(
        'committee-assessment-1',
        'committee-1',
      );
    });

    it('deve propagar erro do service quando avaliação já foi submetida', async () => {
      const error = new Error('Avaliação já foi submetida');
      jest.spyOn(committeeService, 'submitCommitteeAssessment').mockRejectedValue(error);

      await expect(
        controller.submitCommitteeAssessment(
          mockUser,
          'committee-assessment-1',
          mockSubmitCommitteeAssessmentDto,
        ),
      ).rejects.toThrow('Avaliação já foi submetida');
    });
  });

  describe('getCommitteeAssessmentsByCycle', () => {
    it('deve retornar avaliações de comitê do ciclo ativo', async () => {
      jest
        .spyOn(committeeService, 'getCommitteeAssessmentsByCycle')
        .mockResolvedValue(mockCommitteeAssessmentsByCycle as any);

      const result = await controller.getCommitteeAssessmentsByCycle(mockUser);

      expect(result).toEqual(mockCommitteeAssessmentsByCycle);
      expect(committeeService.getCommitteeAssessmentsByCycle).toHaveBeenCalled();
    });

    it('deve propagar erro do service quando não há ciclo ativo', async () => {
      const error = new Error('Não há ciclo ativo');
      jest.spyOn(committeeService, 'getCommitteeAssessmentsByCycle').mockRejectedValue(error);

      await expect(controller.getCommitteeAssessmentsByCycle(mockUser)).rejects.toThrow(
        'Não há ciclo ativo',
      );
    });
  });
});
