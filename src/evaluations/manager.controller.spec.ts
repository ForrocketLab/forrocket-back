import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EvaluationsService } from './evaluations.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateManagerAssessmentDto } from './assessments/dto';
import { ManagerController } from './manager.controller';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { GenAiService } from '../gen-ai/gen-ai.service';

describe('ManagerController', () => {
  let controller: ManagerController;
  let evaluationsService: jest.Mocked<EvaluationsService>;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockUser: User = {
    id: 'manager-1',
    name: 'Carlos Gestor',
    email: 'carlos.gestor@rocketcorp.com',
    jobTitle: 'Tech Lead',
    seniority: 'Senior',
    careerTrack: 'TECHNICAL',
    businessUnit: 'TECHNOLOGY',
    projects: ['projeto-alpha'],
    isActive: true,
    roles: ['gestor'],
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

  const mockCreateManagerAssessmentDto: CreateManagerAssessmentDto = {
    evaluatedUserId: 'user-1',
    sentimentoDeDonoScore: 4,
    sentimentoDeDonoJustification: 'Demonstra grande comprometimento com os resultados.',
    resilienciaAdversidadesScore: 3,
    resilienciaAdversidadesJustification: 'Lida bem com pressão na maioria das situações.',
    organizacaoTrabalhoScore: 4,
    organizacaoTrabalhoJustification: 'Mantém boa organização no trabalho.',
    capacidadeAprenderScore: 5,
    capacidadeAprenderJustification: 'Demonstra grande capacidade de aprendizado.',
    teamPlayerScore: 4,
    teamPlayerJustification: 'Trabalha muito bem em equipe.',
  };

  const mockManagerAssessment = {
    id: 'assessment-123',
    cycle: '2025.1',
    authorId: 'manager-1',
    evaluatedUserId: 'user-1',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    evaluatedUser: {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao.silva@rocketcorp.com',
      jobTitle: 'Desenvolvedor',
      seniority: 'Pleno',
    },
    answers: [
      {
        id: 'answer-1',
        criterionId: 'sentimento-de-dono',
        score: 4,
        justification: 'Demonstra grande comprometimento com os resultados.',
        managerAssessmentId: 'assessment-123',
      },
      {
        id: 'answer-2',
        criterionId: 'resiliencia-adversidades',
        score: 3,
        justification: 'Lida bem com pressão na maioria das situações.',
        managerAssessmentId: 'assessment-123',
      },
    ],
  };

  const mockSubordinates = [
    {
      projectId: 'project-1',
      projectName: 'Projeto Alpha',
      subordinates: [
        {
          id: 'user-1',
          name: 'João Silva',
          email: 'joao.silva@rocketcorp.com',
          jobTitle: 'Desenvolvedor',
          seniority: 'Pleno',
          role: UserRole.COLABORADOR,
        },
        {
          id: 'user-2',
          name: 'Ana Santos',
          email: 'ana.santos@rocketcorp.com',
          jobTitle: 'Designer',
          seniority: 'Junior',
          role: UserRole.COLABORADOR,
        },
      ],
    },
  ];

  beforeEach(async () => {
    const mockEvaluationsService = {
      createManagerAssessment: jest.fn(),
    };

    const mockProjectsService = {
      isManager: jest.fn(),
      getEvaluableSubordinates: jest.fn(),
    };

    const mockGenAiService = {
      generateCollaboratorSummary: jest.fn(),
      generateTeamEvaluationSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerController],
      providers: [
        {
          provide: EvaluationsService,
          useValue: mockEvaluationsService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: GenAiService,
          useValue: mockGenAiService,
        },
      ],
    }).compile();

    controller = module.get<ManagerController>(ManagerController);
    evaluationsService = module.get(EvaluationsService);
    projectsService = module.get(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSubordinateAssessment', () => {
    it('deve criar avaliação de liderado com sucesso', async () => {
      jest
        .spyOn(evaluationsService, 'createManagerAssessment')
        .mockResolvedValue(mockManagerAssessment as any);

      const result = await controller.createSubordinateAssessment(
        mockUser,
        mockCreateManagerAssessmentDto,
      );

      expect(result).toEqual(mockManagerAssessment);
      expect(evaluationsService.createManagerAssessment).toHaveBeenCalledWith(
        'manager-1',
        mockCreateManagerAssessmentDto,
      );
    });

    it('deve propagar erro do service quando avaliação falha', async () => {
      const error = new ForbiddenException('Gestor não pode avaliar este usuário');
      jest.spyOn(evaluationsService, 'createManagerAssessment').mockRejectedValue(error);

      await expect(
        controller.createSubordinateAssessment(mockUser, mockCreateManagerAssessmentDto),
      ).rejects.toThrow(ForbiddenException);

      expect(evaluationsService.createManagerAssessment).toHaveBeenCalledWith(
        'manager-1',
        mockCreateManagerAssessmentDto,
      );
    });

    it('deve propagar erro quando liderado não existe', async () => {
      const error = new Error('Liderado não encontrado');
      jest.spyOn(evaluationsService, 'createManagerAssessment').mockRejectedValue(error);

      await expect(
        controller.createSubordinateAssessment(mockUser, mockCreateManagerAssessmentDto),
      ).rejects.toThrow('Liderado não encontrado');
    });
  });

  describe('getEvaluableSubordinates', () => {
    it('deve retornar lista de liderados quando usuário é gestor', async () => {
      jest.spyOn(projectsService, 'isManager').mockResolvedValue(true);
      jest
        .spyOn(projectsService, 'getEvaluableSubordinates')
        .mockResolvedValue(mockSubordinates as any);

      const result = await controller.getEvaluableSubordinates(mockUser);

      expect(result).toEqual(mockSubordinates);
      expect(projectsService.isManager).toHaveBeenCalledWith('manager-1');
      expect(projectsService.getEvaluableSubordinates).toHaveBeenCalledWith('manager-1');
    });

    it('deve lançar ForbiddenException quando usuário não é gestor', async () => {
      jest.spyOn(projectsService, 'isManager').mockResolvedValue(false);

      await expect(controller.getEvaluableSubordinates(mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.getEvaluableSubordinates(mockUser)).rejects.toThrow(
        'Apenas gestores podem acessar esta funcionalidade',
      );

      expect(projectsService.isManager).toHaveBeenCalledWith('manager-1');
      expect(projectsService.getEvaluableSubordinates).not.toHaveBeenCalled();
    });

    it('deve retornar array vazio quando gestor não tem liderados', async () => {
      jest.spyOn(projectsService, 'isManager').mockResolvedValue(true);
      jest.spyOn(projectsService, 'getEvaluableSubordinates').mockResolvedValue([]);

      const result = await controller.getEvaluableSubordinates(mockUser);

      expect(result).toEqual([]);
      expect(projectsService.isManager).toHaveBeenCalledWith('manager-1');
      expect(projectsService.getEvaluableSubordinates).toHaveBeenCalledWith('manager-1');
    });

    it('deve propagar erro do service', async () => {
      jest.spyOn(projectsService, 'isManager').mockResolvedValue(true);
      const error = new Error('Erro interno do service');
      jest.spyOn(projectsService, 'getEvaluableSubordinates').mockRejectedValue(error);

      await expect(controller.getEvaluableSubordinates(mockUser)).rejects.toThrow(
        'Erro interno do service',
      );

      expect(projectsService.isManager).toHaveBeenCalledWith('manager-1');
      expect(projectsService.getEvaluableSubordinates).toHaveBeenCalledWith('manager-1');
    });
  });
});
