import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { UserProjectRolesService } from './user-project-roles.service';
import { PrismaService } from '../database/prisma.service';

describe('UserProjectRolesService', () => {
  let service: UserProjectRolesService;
  let prismaService: any;

  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
  };

  const mockProject = {
    id: 'project-1',
    name: 'Projeto Alpha',
    description: 'Sistema de avaliação 360',
  };

  const mockUserProjectRole = {
    id: 'role-1',
    userId: 'user-1',
    projectId: 'project-1',
    role: 'COLLABORATOR' as UserRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    project: mockProject,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      userProjectRole: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProjectRolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserProjectRolesService>(UserProjectRolesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma nova atribuição de role com sucesso', async () => {
      const createDto = {
        userId: 'user-1',
        projectId: 'project-1',
        role: 'COLLABORATOR' as UserRole,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.userProjectRole.findFirst.mockResolvedValue(null);
      prismaService.userProjectRole.create.mockResolvedValue(mockUserProjectRole);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUserProjectRole);
      expect(prismaService.userProjectRole.create).toHaveBeenCalledWith({
        data: createDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      const createDto = {
        userId: 'user-inexistente',
        projectId: 'project-1',
        role: 'COLLABORATOR' as UserRole,
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-inexistente' },
      });
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      const createDto = {
        userId: 'user-1',
        projectId: 'project-inexistente',
        role: 'COLLABORATOR' as UserRole,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-inexistente' },
      });
    });

    it('deve lançar ConflictException quando role já existe', async () => {
      const createDto = {
        userId: 'user-1',
        projectId: 'project-1',
        role: 'COLLABORATOR' as UserRole,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.userProjectRole.findFirst.mockResolvedValue(mockUserProjectRole);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as atribuições sem filtros', async () => {
      const mockRoles = [mockUserProjectRole];
      prismaService.userProjectRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(prismaService.userProjectRole.findMany).toHaveBeenCalledWith({
        where: {},
        include: {},
        orderBy: [{ createdAt: 'desc' }, { role: 'asc' }],
      });
    });

    it('deve aplicar filtros quando fornecidos', async () => {
      const filters = {
        userId: 'user-1',
        projectId: 'project-1',
        role: 'COLLABORATOR' as UserRole,
        includeUser: true,
        includeProject: true,
      };

      const mockRoles = [mockUserProjectRole];
      prismaService.userProjectRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll(filters);

      expect(result).toEqual(mockRoles);
      expect(prismaService.userProjectRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          projectId: 'project-1',
          role: 'COLLABORATOR',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { role: 'asc' }],
      });
    });
  });

  describe('findUserRoles', () => {
    it('deve retornar roles do usuário com projeto incluído', async () => {
      const mockRoles = [mockUserProjectRole];

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.userProjectRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.findUserRoles('user-1', { includeProject: true });

      expect(result).toEqual(mockRoles);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(prismaService.userProjectRole.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: [{ project: { name: 'asc' } }, { role: 'asc' }],
      });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findUserRoles('user-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findProjectRoles', () => {
    it('deve retornar roles do projeto com usuário incluído', async () => {
      const mockRoles = [mockUserProjectRole];

      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.userProjectRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.findProjectRoles('project-1', { includeUser: true });

      expect(result).toEqual(mockRoles);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findProjectRoles('project-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma atribuição específica', async () => {
      prismaService.userProjectRole.findUnique.mockResolvedValue(mockUserProjectRole);

      const result = await service.findOne('role-1');

      expect(result).toEqual(mockUserProjectRole);
      expect(prismaService.userProjectRole.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando atribuição não existe', async () => {
      prismaService.userProjectRole.findUnique.mockResolvedValue(null);

      await expect(service.findOne('role-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar uma atribuição com sucesso', async () => {
      const updateDto = { role: 'MANAGER' as UserRole };
      const updatedRole = { ...mockUserProjectRole, role: 'MANAGER' };

      prismaService.userProjectRole.findUnique.mockResolvedValue(mockUserProjectRole);
      prismaService.userProjectRole.update.mockResolvedValue(updatedRole);

      const result = await service.update('role-1', updateDto);

      expect(result).toEqual(updatedRole);
      expect(prismaService.userProjectRole.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: updateDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando atribuição não existe', async () => {
      const updateDto = { role: 'MANAGER' as UserRole };

      prismaService.userProjectRole.findUnique.mockResolvedValue(null);

      await expect(service.update('role-inexistente', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover uma atribuição com sucesso', async () => {
      prismaService.userProjectRole.findUnique.mockResolvedValue(mockUserProjectRole);
      prismaService.userProjectRole.delete.mockResolvedValue(mockUserProjectRole);

      await service.remove('role-1');

      expect(prismaService.userProjectRole.delete).toHaveBeenCalledWith({
        where: { id: 'role-1' },
      });
    });

    it('deve lançar NotFoundException quando atribuição não existe', async () => {
      prismaService.userProjectRole.findUnique.mockResolvedValue(null);

      await expect(service.remove('role-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUserFromProject', () => {
    it('deve remover usuário do projeto com sucesso', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.userProjectRole.deleteMany.mockResolvedValue({ count: 2 });

      await service.removeUserFromProject('user-1', 'project-1');

      expect(prismaService.userProjectRole.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          projectId: 'project-1',
        },
      });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.removeUserFromProject('user-inexistente', 'project-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.removeUserFromProject('user-1', 'project-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
