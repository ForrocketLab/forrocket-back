import { Test, TestingModule } from '@nestjs/testing';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: any;

  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    passwordHash: 'hashed-password',
    roles: '["colaborador"]',
    jobTitle: 'Desenvolvedor',
    seniority: 'Pleno',
    careerTrack: 'Tech',
    businessUnit: 'Engineering',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockTeammatesResponse = [
    {
      projectName: 'projeto-alpha',
      teammates: [
        {
          id: 'user-2',
          name: 'Ana Santos',
          email: 'ana.santos@rocketcorp.com',
          jobTitle: 'Desenvolvedora Frontend',
          seniority: 'Senior',
          roles: ['colaborador'],
          isManager: false,
        },
      ],
    },
  ];

  const mockEvaluableUsersResponse = {
    colleagues: [
      {
        id: 'user-2',
        name: 'Ana Santos',
        email: 'ana.santos@rocketcorp.com',
        jobTitle: 'Desenvolvedora Frontend',
        seniority: 'Senior',
        roles: ['colaborador'],
      },
    ],
    managers: [],
    mentors: [],
  };

  const mockUserProjectsResponse = [
    {
      id: 'project-1',
      name: 'Projeto Alpha',
      description: 'Sistema de avaliação 360',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: ['COLLABORATOR'],
    },
  ];

  const mockTeammatesWithRolesResponse = [
    {
      projectId: 'project-1',
      projectName: 'Projeto Alpha',
      projectDescription: 'Sistema de avaliação 360',
      teammates: [
        {
          id: 'user-2',
          name: 'Ana Santos',
          email: 'ana.santos@rocketcorp.com',
          jobTitle: 'Desenvolvedora Frontend',
          seniority: 'Senior',
          projectRoles: ['COLLABORATOR', 'TECH_LEAD'],
        },
      ],
    },
  ];

  beforeEach(async () => {
    const mockProjectsService = {
      getTeammatesByProjects: jest.fn(),
      getEvaluableUsers: jest.fn(),
      getUserProjects: jest.fn(),
      getTeammatesByProjectsWithRoles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTeammates', () => {
    it('deve retornar colegas de equipe por projeto', async () => {
      projectsService.getTeammatesByProjects.mockResolvedValue(mockTeammatesResponse);

      const result = await controller.getTeammates(mockUser);

      expect(result).toEqual(mockTeammatesResponse);
      expect(projectsService.getTeammatesByProjects).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro interno');
      projectsService.getTeammatesByProjects.mockRejectedValue(error);

      await expect(controller.getTeammates(mockUser)).rejects.toThrow(error);
    });
  });

  describe('getEvaluableUsers', () => {
    it('deve retornar usuários avaliáveis organizados por relacionamento', async () => {
      projectsService.getEvaluableUsers.mockResolvedValue(mockEvaluableUsersResponse);

      const result = await controller.getEvaluableUsers(mockUser);

      expect(result).toEqual(mockEvaluableUsersResponse);
      expect(projectsService.getEvaluableUsers).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Usuário não encontrado');
      projectsService.getEvaluableUsers.mockRejectedValue(error);

      await expect(controller.getEvaluableUsers(mockUser)).rejects.toThrow(error);
    });
  });

  describe('getProjects', () => {
    it('deve retornar projetos do usuário com suas roles', async () => {
      projectsService.getUserProjects.mockResolvedValue(mockUserProjectsResponse);

      const result = await controller.getProjects(mockUser);

      expect(result).toEqual(mockUserProjectsResponse);
      expect(projectsService.getUserProjects).toHaveBeenCalledWith('user-1');
    });

    it('deve retornar array vazio quando usuário não tem projetos', async () => {
      projectsService.getUserProjects.mockResolvedValue([]);

      const result = await controller.getProjects(mockUser);

      expect(result).toEqual([]);
      expect(projectsService.getUserProjects).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro de acesso ao banco');
      projectsService.getUserProjects.mockRejectedValue(error);

      await expect(controller.getProjects(mockUser)).rejects.toThrow(error);
    });
  });

  describe('getTeammatesWithRoles', () => {
    it('deve retornar colegas de trabalho com roles específicas por projeto', async () => {
      projectsService.getTeammatesByProjectsWithRoles.mockResolvedValue(
        mockTeammatesWithRolesResponse,
      );

      const result = await controller.getTeammatesWithRoles(mockUser);

      expect(result).toEqual(mockTeammatesWithRolesResponse);
      expect(projectsService.getTeammatesByProjectsWithRoles).toHaveBeenCalledWith('user-1');
    });

    it('deve retornar array vazio quando usuário não tem colegas', async () => {
      projectsService.getTeammatesByProjectsWithRoles.mockResolvedValue([]);

      const result = await controller.getTeammatesWithRoles(mockUser);

      expect(result).toEqual([]);
      expect(projectsService.getTeammatesByProjectsWithRoles).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro ao buscar colegas');
      projectsService.getTeammatesByProjectsWithRoles.mockRejectedValue(error);

      await expect(controller.getTeammatesWithRoles(mockUser)).rejects.toThrow(error);
    });
  });
});
