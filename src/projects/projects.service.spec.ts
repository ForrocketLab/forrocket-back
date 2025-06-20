import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectsService } from './projects.service';
import { PrismaService } from '../database/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: any;

  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    jobTitle: 'Desenvolvedor Full Stack',
    seniority: 'Pleno',
    projects: JSON.stringify(['projeto-alpha', 'projeto-beta']),
    managerId: 'manager-1',
    mentorId: 'mentor-1',
    isActive: true,
    roles: JSON.stringify(['colaborador']),
  };

  const mockTeammate = {
    id: 'user-2',
    name: 'Ana Santos',
    email: 'ana.santos@rocketcorp.com',
    jobTitle: 'Desenvolvedora Frontend',
    seniority: 'Senior',
    projects: JSON.stringify(['projeto-alpha']),
    managerId: 'manager-1',
    isActive: true,
    roles: JSON.stringify(['colaborador', 'tech-lead']),
  };

  const mockManager = {
    id: 'manager-1',
    name: 'Carlos Gestor',
    email: 'carlos.gestor@rocketcorp.com',
    jobTitle: 'Tech Lead',
    seniority: 'Senior',
    projects: JSON.stringify(['projeto-alpha']),
    isActive: true,
    roles: JSON.stringify(['gestor']),
  };

  const mockMentor = {
    id: 'mentor-1',
    name: 'Maria Mentora',
    email: 'maria.mentora@rocketcorp.com',
    jobTitle: 'Senior Developer',
    seniority: 'Senior',
    projects: JSON.stringify(['projeto-beta']),
    isActive: true,
    roles: JSON.stringify(['mentor']),
  };

  const mockProject = {
    id: 'project-1',
    name: 'Projeto Alpha',
    description: 'Sistema de avaliação 360',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userProjectRole: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      userProjectAssignment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTeammatesByProjects', () => {
    it('deve retornar colegas agrupados por projeto', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.findMany.mockResolvedValue([mockTeammate]);

      const result = await service.getTeammatesByProjects('user-1');

      expect(result).toHaveLength(2); // 2 projetos
      expect(result[0].projectName).toBe('projeto-alpha');
      expect(result[0].teammates).toHaveLength(1);
      expect(result[0].teammates[0].name).toBe('Ana Santos');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          name: true,
          projects: true,
          managerId: true,
        },
      });
    });

    it('deve retornar array vazio quando usuário não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getTeammatesByProjects('user-inexistente');

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando usuário não tem projetos', async () => {
      const userWithoutProjects = { ...mockUser, projects: null };
      prismaService.user.findUnique.mockResolvedValue(userWithoutProjects);

      const result = await service.getTeammatesByProjects('user-1');

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando usuário tem lista de projetos vazia', async () => {
      const userWithEmptyProjects = { ...mockUser, projects: JSON.stringify([]) };
      prismaService.user.findUnique.mockResolvedValue(userWithEmptyProjects);

      const result = await service.getTeammatesByProjects('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('areTeammates', () => {
    it('deve retornar true quando usuários trabalham no mesmo projeto', async () => {
      const user1 = { projects: JSON.stringify(['projeto-alpha', 'projeto-beta']) };
      const user2 = { projects: JSON.stringify(['projeto-alpha', 'projeto-gamma']) };

      prismaService.user.findUnique.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);

      const result = await service.areTeammates('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('deve retornar false quando usuários não trabalham no mesmo projeto', async () => {
      const user1 = { projects: JSON.stringify(['projeto-alpha']) };
      const user2 = { projects: JSON.stringify(['projeto-beta']) };

      prismaService.user.findUnique.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);

      const result = await service.areTeammates('user-1', 'user-2');

      expect(result).toBe(false);
    });

    it('deve retornar false quando um dos usuários não existe', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      const result = await service.areTeammates('user-inexistente', 'user-2');

      expect(result).toBe(false);
    });

    it('deve retornar false quando usuários não tem projetos', async () => {
      const userWithoutProjects = { projects: null };

      prismaService.user.findUnique
        .mockResolvedValueOnce(userWithoutProjects)
        .mockResolvedValueOnce(mockUser);

      const result = await service.areTeammates('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('canEvaluateUser', () => {
    it('deve retornar true quando usuários são colegas de trabalho', async () => {
      const user1 = { projects: JSON.stringify(['projeto-alpha']), managerId: 'other-manager' };
      const user2 = { projects: JSON.stringify(['projeto-alpha']), managerId: 'other-manager' };

      prismaService.user.findUnique.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);

      // Mock do método areTeammates para retornar true
      jest.spyOn(service, 'areTeammates').mockResolvedValue(true);

      const result = await service.canEvaluateUser('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('deve retornar true quando usuário pode avaliar seu gestor', async () => {
      const evaluator = { projects: JSON.stringify(['projeto-alpha']), managerId: 'manager-1' };
      const manager = { projects: JSON.stringify(['projeto-beta']), managerId: 'other-manager' };

      prismaService.user.findUnique.mockResolvedValueOnce(evaluator).mockResolvedValueOnce(manager);

      // Mock do método areTeammates para retornar false
      jest.spyOn(service, 'areTeammates').mockResolvedValue(false);

      const result = await service.canEvaluateUser('user-1', 'manager-1');

      expect(result).toBe(true);
    });

    it('deve retornar false quando usuários não podem se avaliar', async () => {
      const user1 = { projects: JSON.stringify(['projeto-alpha']), managerId: 'other-manager' };
      const user2 = { projects: JSON.stringify(['projeto-beta']), managerId: 'other-manager-2' };

      prismaService.user.findUnique.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);

      // Mock do método areTeammates para retornar false
      jest.spyOn(service, 'areTeammates').mockResolvedValue(false);

      const result = await service.canEvaluateUser('user-1', 'user-2');

      expect(result).toBe(false);
    });

    it('deve retornar false quando um dos usuários não existe', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      const result = await service.canEvaluateUser('user-inexistente', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('getEvaluableUsers', () => {
    it('deve retornar usuários avaliáveis organizados por relacionamento', async () => {
      const currentUser = {
        id: 'user-1',
        projects: JSON.stringify(['projeto-alpha']),
        managerId: 'manager-1',
        mentorId: 'mentor-1',
      };

      const allUsers = [mockTeammate, mockManager, mockMentor];

      prismaService.user.findUnique.mockResolvedValue(currentUser);
      prismaService.user.findMany.mockResolvedValue(allUsers);

      const result = await service.getEvaluableUsers('user-1');

      expect(result).toHaveProperty('colleagues');
      expect(result).toHaveProperty('managers');
      expect(result).toHaveProperty('mentors');
      expect(Array.isArray(result.colleagues)).toBe(true);
      expect(Array.isArray(result.managers)).toBe(true);
      expect(Array.isArray(result.mentors)).toBe(true);
    });

    it('deve retornar estrutura vazia quando usuário não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getEvaluableUsers('user-inexistente');

      expect(result).toEqual({
        colleagues: [],
        managers: [],
        mentors: [],
      });
    });

    it('deve lidar com usuário sem projetos', async () => {
      const userWithoutProjects = {
        id: 'user-1',
        projects: null,
        managerId: null,
        mentorId: null,
      };

      prismaService.user.findUnique.mockResolvedValue(userWithoutProjects);
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getEvaluableUsers('user-1');

      expect(result).toEqual({
        colleagues: [],
        managers: [],
        mentors: [],
      });
    });
  });

  describe('getAllProjects', () => {
    it('deve retornar todos os projetos ativos', async () => {
      const mockProjects = [mockProject];
      prismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.getAllProjects();

      expect(result).toEqual(mockProjects);
      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getUserProjects', () => {
    it('deve retornar projetos do usuário com roles', async () => {
      const mockUserProjectAssignments = [
        {
          role: 'COLLABORATOR',
          project: mockProject,
        },
      ];

      const mockUserRoles = [{ role: 'COLLABORATOR' }];

      prismaService.userProjectAssignment.findMany.mockResolvedValue(mockUserProjectAssignments);
      prismaService.userProjectRole.findMany.mockResolvedValue(mockUserRoles);

      const result = await service.getUserProjects('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('userRoles');
      expect(result[0].userRoles).toEqual(['COLLABORATOR']);
    });

    it('deve retornar array vazio quando usuário não tem projetos', async () => {
      prismaService.userProjectAssignment.findMany.mockResolvedValue([]);

      const result = await service.getUserProjects('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('isManager', () => {
    it('deve retornar true quando usuário é gestor', async () => {
      const mockManagerRole = { role: 'MANAGER' };
      prismaService.userProjectRole.findFirst.mockResolvedValue(mockManagerRole);

      const result = await service.isManager('manager-1');

      expect(result).toBe(true);
      expect(prismaService.userProjectRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'manager-1',
          role: 'MANAGER',
        },
      });
    });

    it('deve retornar false quando usuário não é gestor', async () => {
      prismaService.userProjectRole.findFirst.mockResolvedValue(null);

      const result = await service.isManager('user-1');

      expect(result).toBe(false);
    });
  });

  describe('canManagerEvaluateUser', () => {
    it('deve retornar true quando gestor pode avaliar liderado', async () => {
      const managerProjects = [{ projectId: 'project-1' }];
      const evaluatedUser = { id: 'user-1', name: 'João Silva' };
      const subordinateRole = { userId: 'user-1', projectId: 'project-1', role: 'COLLABORATOR' };

      // Mock para verificar se o usuário avaliado existe
      prismaService.user.findUnique.mockResolvedValue(evaluatedUser);

      // Mock para buscar projetos onde o manager tem role de MANAGER
      prismaService.userProjectRole.findMany.mockResolvedValueOnce(managerProjects);

      // Mock para verificar se o usuário avaliado está em algum dos projetos do manager
      prismaService.userProjectRole.findFirst.mockResolvedValue(subordinateRole);

      const result = await service.canManagerEvaluateUser('manager-1', 'user-1');

      expect(result).toBe(true);
    });

    it('deve retornar false quando gestor e liderado não estão no mesmo projeto', async () => {
      const managerProjects = [{ projectId: 'project-1' }];
      const evaluatedUser = { id: 'user-1', name: 'João Silva' };

      // Mock para verificar se o usuário avaliado existe
      prismaService.user.findUnique.mockResolvedValue(evaluatedUser);

      // Mock para buscar projetos onde o manager tem role de MANAGER
      prismaService.userProjectRole.findMany.mockResolvedValueOnce(managerProjects);

      // Mock para verificar se o usuário avaliado está em algum dos projetos do manager (não encontra)
      prismaService.userProjectRole.findFirst.mockResolvedValue(null);

      const result = await service.canManagerEvaluateUser('manager-1', 'user-1');

      expect(result).toBe(false);
    });

    it('deve retornar false quando gestor não tem projetos', async () => {
      const evaluatedUser = { id: 'user-1', name: 'João Silva' };

      // Mock para verificar se o usuário avaliado existe
      prismaService.user.findUnique.mockResolvedValue(evaluatedUser);

      // Mock para buscar projetos onde o manager tem role de MANAGER (não encontra)
      prismaService.userProjectRole.findMany.mockResolvedValueOnce([]);

      const result = await service.canManagerEvaluateUser('manager-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getEvaluableSubordinates', () => {
    it('deve retornar liderados avaliáveis agrupados por projeto', async () => {
      const mockManagerProjects = [
        {
          projectId: 'project-1',
          project: { id: 'project-1', name: 'Projeto Alpha' },
        },
      ];
      const mockSubordinates = [
        {
          userId: 'user-1',
          projectId: 'project-1',
          role: 'COLLABORATOR',
          user: {
            id: 'user-1',
            name: 'João Silva',
            email: 'joao.silva@rocketcorp.com',
            jobTitle: 'Desenvolvedor',
            seniority: 'Pleno',
          },
          project: {
            id: 'project-1',
            name: 'Projeto Alpha',
          },
        },
      ];

      // Mock para buscar projetos onde o manager é MANAGER
      prismaService.userProjectRole.findMany
        .mockResolvedValueOnce(mockManagerProjects)
        .mockResolvedValueOnce(mockSubordinates);

      const result = await service.getEvaluableSubordinates('manager-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('projectId');
      expect(result[0]).toHaveProperty('projectName');
      expect(result[0]).toHaveProperty('subordinates');
      expect(result[0].subordinates).toHaveLength(1);
    });

    it('deve retornar array vazio quando gestor não tem projetos', async () => {
      prismaService.userProjectRole.findMany.mockResolvedValue([]);

      const result = await service.getEvaluableSubordinates('manager-1');

      expect(result).toEqual([]);
    });
  });
});
