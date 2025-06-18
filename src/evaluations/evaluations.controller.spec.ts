import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

describe('EvaluationsController', () => {
  let controller: EvaluationsController;
  let evaluationsService: jest.Mocked<EvaluationsService>;

  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    roles: ['colaborador'],
    jobTitle: 'developer',
    seniority: 'mid',
    careerTrack: 'engineering',
    businessUnit: 'technology',
    projects: ['project-1'],
    isActive: true,
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    toPublic: jest.fn(),
  };

  const mockSelfAssessmentDto = {
    sentimentoDeDonoScore: 4,
    sentimentoDeDonoJustification: 'Sempre busco soluções',
    resilienciaAdversidadesScore: 5,
    resilienciaAdversidadesJustification: 'Mantenho calma em situações difíceis',
    organizacaoTrabalhoScore: 3,
    organizacaoTrabalhoJustification: 'Posso melhorar minha organização',
    capacidadeAprenderScore: 5,
    capacidadeAprenderJustification: 'Sempre busco novos conhecimentos',
    teamPlayerScore: 4,
    teamPlayerJustification: 'Colaboro bem com a equipe',
    entregarQualidadeScore: 4,
    entregarQualidadeJustification: 'Foco em entrega de qualidade',
    atenderPrazosScore: 3,
    atenderPrazosJustification: 'Às vezes tenho dificuldade com prazos',
    fazerMaisMenosScore: 4,
    fazerMaisMenosJustification: 'Busco eficiência nas tarefas',
    pensarForaCaixaScore: 4,
    pensarForaCaixaJustification: 'Gosto de soluções criativas',
    gestaoGenteScore: 3,
    gestaoGenteJustification: 'Ainda desenvolvendo habilidades de gestão',
    gestaoResultadosScore: 4,
    gestaoResultadosJustification: 'Foco nos resultados da equipe',
    evolucaoRocketScore: 5,
    evolucaoRocketJustification: 'Contribuo para o crescimento da empresa',
  };

  const mock360AssessmentDto = {
    evaluatedUserId: 'user-2',
    overallScore: 4,
    strengths: 'Excelente comunicação e colaboração em equipe',
    improvements: 'Pode melhorar gestão de tempo e organização',
  };

  const mockMentoringAssessmentDto = {
    mentorId: 'mentor-1',
    score: 4,
    justification: 'Excelente mentor, sempre disponível e muito útil no desenvolvimento',
  };

  const mockReferenceFeedbackDto = {
    referencedUserId: 'user-2',
    justification: 'Excelente colega, demonstra boa comunicação e sempre ajuda a equipe',
  };

  const mockSubmitAssessmentDto = {
    evaluationType: 'self' as const,
  };

  beforeEach(async () => {
    const mockEvaluationsService = {
      submitAssessment: jest.fn(),
      createSelfAssessment: jest.fn(),
      create360Assessment: jest.fn(),
      createMentoringAssessment: jest.fn(),
      createReferenceFeedback: jest.fn(),
      getUserEvaluationsByCycle: jest.fn(),
      getReceivedEvaluationsByCycle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [
        {
          provide: EvaluationsService,
          useValue: mockEvaluationsService,
        },
      ],
    }).compile();

    controller = module.get<EvaluationsController>(EvaluationsController);
    evaluationsService = module.get(EvaluationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAssessment', () => {
    it('deve submeter avaliação com sucesso', async () => {
      const mockSubmittedAssessment = {
        id: 'assessment-1',
        authorId: 'user-1',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      };

      evaluationsService.submitAssessment.mockResolvedValue(mockSubmittedAssessment as any);

      const result = await controller.submitAssessment(
        mockUser as any,
        'assessment-1',
        mockSubmitAssessmentDto,
      );

      expect(evaluationsService.submitAssessment).toHaveBeenCalledWith(
        'assessment-1',
        'user-1',
        'self',
      );
      expect(result).toEqual(mockSubmittedAssessment);
    });

    it('deve propagar erro do service', async () => {
      evaluationsService.submitAssessment.mockRejectedValue(
        new NotFoundException('Avaliação não encontrada'),
      );

      await expect(
        controller.submitAssessment(mockUser as any, 'assessment-1', mockSubmitAssessmentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSelfAssessment', () => {
    it('deve criar autoavaliação com sucesso', async () => {
      const mockCreatedSelfAssessment = {
        id: 'self-assessment-1',
        authorId: 'user-1',
        cycle: 'Q1 2024',
        status: 'DRAFT',
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
      };

      evaluationsService.createSelfAssessment.mockResolvedValue(mockCreatedSelfAssessment as any);

      const result = await controller.createSelfAssessment(
        mockUser as any,
        mockSelfAssessmentDto as any,
      );

      expect(evaluationsService.createSelfAssessment).toHaveBeenCalledWith(
        'user-1',
        mockSelfAssessmentDto,
      );
      expect(result).toEqual(mockCreatedSelfAssessment);
    });

    it('deve propagar erro de validação do service', async () => {
      evaluationsService.createSelfAssessment.mockRejectedValue(
        new BadRequestException('Já existe uma autoavaliação para este ciclo'),
      );

      await expect(
        controller.createSelfAssessment(mockUser as any, mockSelfAssessmentDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create360Assessment', () => {
    it('deve criar avaliação 360 com sucesso', async () => {
      const mockCreated360Assessment = {
        id: '360-assessment-1',
        authorId: 'user-1',
        evaluatedUserId: 'user-2',
        cycle: 'Q1 2024',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
        overallScore: 4,
        strengths: 'Pontos fortes',
        improvements: 'Melhorias',
      };

      evaluationsService.create360Assessment.mockResolvedValue(mockCreated360Assessment as any);

      const result = await controller.create360Assessment(
        mockUser as any,
        mock360AssessmentDto as any,
      );

      expect(evaluationsService.create360Assessment).toHaveBeenCalledWith(
        'user-1',
        mock360AssessmentDto,
      );
      expect(result).toEqual(mockCreated360Assessment);
    });

    it('deve propagar erro de permissão do service', async () => {
      evaluationsService.create360Assessment.mockRejectedValue(
        new BadRequestException('Você só pode avaliar colegas de trabalho ou seu gestor direto'),
      );

      await expect(
        controller.create360Assessment(mockUser as any, mock360AssessmentDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createMentoringAssessment', () => {
    it('deve criar avaliação de mentoring com sucesso', async () => {
      const mockCreatedMentoringAssessment = {
        id: 'mentoring-assessment-1',
        authorId: 'user-1',
        mentorId: 'mentor-1',
        cycle: 'Q1 2024',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
        score: 4,
        justification: 'Justificativa',
      };

      evaluationsService.createMentoringAssessment.mockResolvedValue(
        mockCreatedMentoringAssessment as any,
      );

      const result = await controller.createMentoringAssessment(
        mockUser as any,
        mockMentoringAssessmentDto as any,
      );

      expect(evaluationsService.createMentoringAssessment).toHaveBeenCalledWith(
        'user-1',
        mockMentoringAssessmentDto,
      );
      expect(result).toEqual(mockCreatedMentoringAssessment);
    });

    it('deve propagar erro de mentor não encontrado', async () => {
      evaluationsService.createMentoringAssessment.mockRejectedValue(
        new NotFoundException('Mentor não encontrado'),
      );

      await expect(
        controller.createMentoringAssessment(mockUser as any, mockMentoringAssessmentDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReferenceFeedback', () => {
    it('deve criar feedback de referência com sucesso', async () => {
      const mockCreatedReferenceFeedback = {
        id: 'reference-feedback-1',
        authorId: 'user-1',
        referencedUserId: 'user-2',
        cycle: 'Q1 2024',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
        justification: 'Justificativa',
      };

      evaluationsService.createReferenceFeedback.mockResolvedValue(
        mockCreatedReferenceFeedback as any,
      );

      const result = await controller.createReferenceFeedback(
        mockUser as any,
        mockReferenceFeedbackDto as any,
      );

      expect(evaluationsService.createReferenceFeedback).toHaveBeenCalledWith(
        'user-1',
        mockReferenceFeedbackDto,
      );
      expect(result).toEqual(mockCreatedReferenceFeedback);
    });

    it('deve propagar erro de usuário não encontrado', async () => {
      evaluationsService.createReferenceFeedback.mockRejectedValue(
        new NotFoundException('Usuário referenciado não encontrado'),
      );

      await expect(
        controller.createReferenceFeedback(mockUser as any, mockReferenceFeedbackDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserEvaluationsByCycle', () => {
    it('deve retornar avaliações do usuário por ciclo', async () => {
      const mockUserEvaluations = {
        selfAssessments: [{ id: 'self-1', authorId: 'user-1' }],
        assessment360s: [{ id: '360-1', authorId: 'user-1' }],
        mentoringAssessments: [],
        referenceFeedbacks: [],
        managerAssessments: [],
        committeeAssessments: [],
      };

      evaluationsService.getUserEvaluationsByCycle.mockResolvedValue(mockUserEvaluations as any);

      const result = await controller.getUserEvaluationsByCycle(mockUser as any, 'Q1 2024');

      expect(evaluationsService.getUserEvaluationsByCycle).toHaveBeenCalledWith(
        'user-1',
        'Q1 2024',
      );
      expect(result).toEqual(mockUserEvaluations);
    });
  });

  describe('getReceivedEvaluationsByCycle', () => {
    it('deve retornar avaliações recebidas pelo usuário por ciclo', async () => {
      const mockReceivedEvaluations = {
        selfAssessments: [{ id: 'self-1', authorId: 'user-1' }],
        assessment360s: [{ id: '360-1', evaluatedUserId: 'user-1' }],
        mentoringAssessments: [],
        referenceFeedbacks: [],
        managerAssessments: [],
        committeeAssessments: [],
      };

      evaluationsService.getReceivedEvaluationsByCycle.mockResolvedValue(
        mockReceivedEvaluations as any,
      );

      const result = await controller.getReceivedEvaluationsByCycle(mockUser as any, 'Q1 2024');

      expect(evaluationsService.getReceivedEvaluationsByCycle).toHaveBeenCalledWith(
        'user-1',
        'Q1 2024',
      );
      expect(result).toEqual(mockReceivedEvaluations);
    });
  });
});
