import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';
import { UserProjectRoleDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let databaseService: DatabaseService;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: 'user-123',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    passwordHash: 'hashed-password',
    roles: ['colaborador'],
    jobTitle: 'Desenvolvedor',
    seniority: 'Pleno',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',
    projects: ['projeto-app-mobile'],
    managerId: 'gestor-id-123',
    directReports: [],
    mentorId: 'mentor-id-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toPublic: function() {
      const { passwordHash, ...publicUser } = this;
      return publicUser;
    }
  };

  const mockLoginDto: LoginDto = {
    email: 'joao.silva@rocketcorp.com',
    password: 'password123',
  };

  const mockJwtPayload = {
    userId: 'user-123',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    roles: ['colaborador'],
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            userProjectAssignment: {
              findMany: jest.fn(),
            },
            userProjectRole: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);

      const result = await service.login(mockLoginDto);

      expect(result).toEqual({
        token: mockToken,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          roles: mockUser.roles,
        },
      });
      expect(databaseService.findUserByEmail).toHaveBeenCalledWith(mockLoginDto.email);
      expect(jwtService.signAsync).toHaveBeenCalledWith(mockJwtPayload);
    });

    it('deve lançar NotFoundException quando usuário não existir', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(NotFoundException);
      expect(databaseService.findUserByEmail).toHaveBeenCalledWith(mockLoginDto.email);
    });

    it('deve lançar UnauthorizedException quando senha estiver incorreta', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
      expect(databaseService.findUserByEmail).toHaveBeenCalledWith(mockLoginDto.email);
    });

    it('deve lidar com erros de bcrypt', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockRejectedValue(new Error('bcrypt error') as never);

      await expect(service.login(mockLoginDto)).rejects.toThrow();
    });

    it('deve lidar com erros de JWT', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'signAsync').mockRejectedValue(new Error('JWT error'));

      await expect(service.login(mockLoginDto)).rejects.toThrow();
    });
  });

  describe('findUserById', () => {
    it('deve encontrar usuário por ID', async () => {
      jest.spyOn(databaseService, 'findUserById').mockResolvedValue(mockUser);

      const result = await service.findUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(databaseService.findUserById).toHaveBeenCalledWith('user-123');
    });

    it('deve retornar null quando usuário não existir', async () => {
      jest.spyOn(databaseService, 'findUserById').mockResolvedValue(null);

      const result = await service.findUserById('invalid-id');

      expect(result).toBeNull();
      expect(databaseService.findUserById).toHaveBeenCalledWith('invalid-id');
    });

    it('deve lidar com erros do banco de dados', async () => {
      jest.spyOn(databaseService, 'findUserById').mockRejectedValue(new Error('DB error'));

      await expect(service.findUserById('user-123')).rejects.toThrow();
    });
  });

  describe('findUserByEmail', () => {
    it('deve encontrar usuário por email', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('joao.silva@rocketcorp.com');

      expect(result).toEqual(mockUser);
      expect(databaseService.findUserByEmail).toHaveBeenCalledWith('joao.silva@rocketcorp.com');
    });

    it('deve retornar null quando usuário não existir', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);

      const result = await service.findUserByEmail('invalid@email.com');

      expect(result).toBeNull();
      expect(databaseService.findUserByEmail).toHaveBeenCalledWith('invalid@email.com');
    });

    it('deve lidar com erros do banco de dados', async () => {
      jest.spyOn(databaseService, 'findUserByEmail').mockRejectedValue(new Error('DB error'));

      await expect(service.findUserByEmail('test@email.com')).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('deve validar token JWT válido', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockJwtPayload);

      const result = await service.validateToken(mockToken);

      expect(result).toEqual(mockJwtPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
    });

    it('deve lançar UnauthorizedException para token inválido', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token');
    });

    it('deve lançar UnauthorizedException para token expirado', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Token expired'));

      await expect(service.validateToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('deve lidar com diferentes tipos de erros JWT', async () => {
      const jwtErrors = [
        new Error('jwt malformed'),
        new Error('jwt expired'),
        new Error('jwt not active'),
        new Error('invalid signature'),
      ];

      for (const error of jwtErrors) {
        jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(error);
        await expect(service.validateToken('bad-token')).rejects.toThrow(UnauthorizedException);
      }
    });
  });

  describe('hasRole', () => {
    it('deve retornar true quando usuário tem a role', () => {
      const userWithRole: User = { 
        ...mockUser, 
        roles: ['admin', 'colaborador'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasRole(userWithRole, 'admin');

      expect(result).toBe(true);
    });

    it('deve retornar false quando usuário não tem a role', () => {
      const userWithoutRole: User = { 
        ...mockUser, 
        roles: ['colaborador'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasRole(userWithoutRole, 'admin');

      expect(result).toBe(false);
    });

    it('deve retornar false para role vazia', () => {
      const result = service.hasRole(mockUser, '');

      expect(result).toBe(false);
    });

    it('deve lidar com usuário sem roles', () => {
      const userWithoutRoles: User = { 
        ...mockUser, 
        roles: [],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasRole(userWithoutRoles, 'admin');

      expect(result).toBe(false);
    });

    it('deve ser case-sensitive', () => {
      const userWithRole: User = { 
        ...mockUser, 
        roles: ['Admin'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasRole(userWithRole, 'admin');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('deve retornar true quando usuário tem pelo menos uma das roles', () => {
      const userWithRoles: User = { 
        ...mockUser, 
        roles: ['admin', 'colaborador'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasAnyRole(userWithRoles, ['admin', 'rh']);

      expect(result).toBe(true);
    });

    it('deve retornar false quando usuário não tem nenhuma das roles', () => {
      const userWithoutRoles: User = { 
        ...mockUser, 
        roles: ['colaborador'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasAnyRole(userWithoutRoles, ['admin', 'rh']);

      expect(result).toBe(false);
    });

    it('deve retornar false para array vazio de roles', () => {
      const result = service.hasAnyRole(mockUser, []);

      expect(result).toBe(false);
    });

    it('deve lidar com usuário sem roles', () => {
      const userWithoutRoles: User = { 
        ...mockUser, 
        roles: [],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasAnyRole(userWithoutRoles, ['admin', 'rh']);

      expect(result).toBe(false);
    });

    it('deve retornar true se usuário tem exatamente uma das roles', () => {
      const userWithOneRole: User = { 
        ...mockUser, 
        roles: ['admin'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      const result = service.hasAnyRole(userWithOneRole, ['admin', 'rh']);

      expect(result).toBe(true);
    });
  });

  describe('getUserProjectRoles', () => {
    const mockProjectAssignments = [
      {
        userId: 'user-123',
        projectId: 'project-1',
        project: {
          id: 'project-1',
          name: 'Projeto Alpha',
          isActive: true,
        },
      },
      {
        userId: 'user-123',
        projectId: 'project-2',
        project: {
          id: 'project-2',
          name: 'Projeto Beta',
          isActive: false,
        },
      },
    ];

    const mockUserRoles = [
      { 
        id: 'role-1',
        userId: 'user-123',
        projectId: 'project-1',
        role: UserRole.COLLABORATOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { 
        id: 'role-2',
        userId: 'user-123',
        projectId: 'project-1',
        role: UserRole.MANAGER,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('deve retornar roles de projetos ativos do usuário', async () => {
      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockResolvedValue(mockProjectAssignments);
      jest.spyOn(prismaService.userProjectRole, 'findMany').mockResolvedValue(mockUserRoles);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([
        {
          projectId: 'project-1',
          projectName: 'Projeto Alpha',
          roles: ['COLLABORATOR', 'MANAGER'],
        },
      ]);
      expect(prismaService.userProjectAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });
    });

    it('deve retornar array vazio quando usuário não tem projetos', async () => {
      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockResolvedValue([]);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([]);
    });

    it('deve filtrar projetos inativos', async () => {
      const onlyInactiveProjects = [
        {
          userId: 'user-123',
          projectId: 'project-2',
          project: {
            id: 'project-2',
            name: 'Projeto Beta',
            isActive: false,
          },
        },
      ];

      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockResolvedValue(onlyInactiveProjects);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([]);
    });

    it('deve ordenar projetos por nome', async () => {
      const unorderedProjects = [
        {
          userId: 'user-123',
          projectId: 'project-2',
          project: {
            id: 'project-2',
            name: 'Projeto Beta',
            isActive: true,
          },
        },
        {
          userId: 'user-123',
          projectId: 'project-1',
          project: {
            id: 'project-1',
            name: 'Projeto Alpha',
            isActive: true,
          },
        },
      ];

      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockResolvedValue(unorderedProjects);
      jest.spyOn(prismaService.userProjectRole, 'findMany').mockResolvedValue(mockUserRoles);

      const result = await service.getUserProjectRoles('user-123');

      expect(result[0].projectName).toBe('Projeto Alpha');
      expect(result[1].projectName).toBe('Projeto Beta');
    });

    it('deve lidar com projetos sem roles', async () => {
      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockResolvedValue(mockProjectAssignments);
      jest.spyOn(prismaService.userProjectRole, 'findMany').mockResolvedValue([]);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([
        {
          projectId: 'project-1',
          projectName: 'Projeto Alpha',
          roles: [],
        },
      ]);
    });

    it('deve lidar com erros do banco de dados', async () => {
      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockRejectedValue(new Error('DB error'));

      await expect(service.getUserProjectRoles('user-123')).rejects.toThrow();
    });

    it('deve lidar com erros ao buscar roles', async () => {
      jest.spyOn(prismaService.userProjectAssignment, 'findMany').mockResolvedValue(mockProjectAssignments);
      jest.spyOn(prismaService.userProjectRole, 'findMany').mockRejectedValue(new Error('DB error'));

      await expect(service.getUserProjectRoles('user-123')).rejects.toThrow();
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve lidar com email vazio no login', async () => {
      const emptyEmailDto = { ...mockLoginDto, email: '' };

      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(null);

      await expect(service.login(emptyEmailDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lidar com senha vazia no login', async () => {
      const emptyPasswordDto = { ...mockLoginDto, password: '' };

      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(emptyPasswordDto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve lidar com usuário inativo', async () => {
      const inactiveUser: User = { 
        ...mockUser, 
        isActive: false,
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      jest.spyOn(databaseService, 'findUserByEmail').mockResolvedValue(inactiveUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(mockLoginDto);

      expect(result).toBeDefined();
      expect(result.user.id).toBe(inactiveUser.id);
    });

    it('deve lidar com usuário com múltiplas roles', () => {
      const userWithMultipleRoles: User = { 
        ...mockUser, 
        roles: ['admin', 'rh', 'colaborador'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      expect(service.hasRole(userWithMultipleRoles, 'admin')).toBe(true);
      expect(service.hasRole(userWithMultipleRoles, 'rh')).toBe(true);
      expect(service.hasRole(userWithMultipleRoles, 'colaborador')).toBe(true);
      expect(service.hasRole(userWithMultipleRoles, 'gestor')).toBe(false);
    });

    it('deve lidar com roles duplicadas', () => {
      const userWithDuplicateRoles: User = { 
        ...mockUser, 
        roles: ['admin', 'admin', 'colaborador'],
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };

      expect(service.hasRole(userWithDuplicateRoles, 'admin')).toBe(true);
      expect(service.hasAnyRole(userWithDuplicateRoles, ['admin', 'rh'])).toBe(true);
    });
  });
}); 