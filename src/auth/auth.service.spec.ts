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
    roles: JSON.stringify(['colaborador']),
    jobTitle: 'Desenvolvedor',
    seniority: 'Pleno',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',
    businessHub: 'Digital Hub',
    projects: JSON.stringify(['projeto-app-mobile']),
    managerId: 'gestor-id-123',
    directReports: JSON.stringify([]),
    mentorId: 'mentor-id-123',
    leaderId: null,
    directLeadership: JSON.stringify([]),
    mentoringIds: JSON.stringify([]),
    importBatchId: null,
    lastActivityAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toPublic: function() {
      const { passwordHash, ...publicUser } = this;
      return {
        ...publicUser,
        roles: JSON.parse(this.roles),
        projects: JSON.parse(this.projects),
        directReports: JSON.parse(this.directReports),
        directLeadership: JSON.parse(this.directLeadership),
        mentoringIds: JSON.parse(this.mentoringIds),
      };
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
          roles: ['colaborador'],
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

      await expect(service.findUserByEmail('joao.silva@rocketcorp.com')).rejects.toThrow();
    });
  });

  describe('hasRole', () => {
    it('deve retornar true quando usuário tem a role', () => {
      const userWithRole: User = {
        ...mockUser,
        roles: JSON.stringify(['admin', 'gestor']),
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return {
            ...publicUser,
            roles: JSON.parse(this.roles),
            projects: JSON.parse(this.projects),
            directReports: JSON.parse(this.directReports),
            directLeadership: JSON.parse(this.directLeadership),
            mentoringIds: JSON.parse(this.mentoringIds),
          };
        }
      };

      expect(service.hasRole(userWithRole, 'admin')).toBe(true);
    });

    it('deve retornar false quando usuário não tem a role', () => {
      const userWithoutRole: User = {
        ...mockUser,
        roles: JSON.stringify(['colaborador']),
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return {
            ...publicUser,
            roles: JSON.parse(this.roles),
            projects: JSON.parse(this.projects),
            directReports: JSON.parse(this.directReports),
            directLeadership: JSON.parse(this.directLeadership),
            mentoringIds: JSON.parse(this.mentoringIds),
          };
        }
      };

      expect(service.hasRole(userWithoutRole, 'admin')).toBe(false);
    });

    it('deve ser case-sensitive', () => {
      const userWithRole: User = {
        ...mockUser,
        roles: JSON.stringify(['Admin']),
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return {
            ...publicUser,
            roles: JSON.parse(this.roles),
            projects: JSON.parse(this.projects),
            directReports: JSON.parse(this.directReports),
            directLeadership: JSON.parse(this.directLeadership),
            mentoringIds: JSON.parse(this.mentoringIds),
          };
        }
      };

      expect(service.hasRole(userWithRole, 'admin')).toBe(false);
    });
  });

  describe('getUserProjectRoles', () => {
    it('deve retornar roles de projetos ativos do usuário', async () => {
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
      ];

      const mockProjectRoles = [
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

      (prismaService.userProjectAssignment.findMany as jest.Mock).mockResolvedValue(mockProjectAssignments);
      (prismaService.userProjectRole.findMany as jest.Mock).mockResolvedValue(mockProjectRoles);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([
        {
          projectId: 'project-1',
          projectName: 'Projeto Alpha',
          roles: [UserRole.COLLABORATOR, UserRole.MANAGER],
        },
      ]);
    });

    it('deve retornar array vazio quando usuário não tem projetos', async () => {
      (prismaService.userProjectAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.userProjectRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([]);
    });

    it('deve filtrar projetos inativos', async () => {
      const mockProjectAssignments = [
        {
          userId: 'user-123',
          projectId: 'project-1',
          project: {
            id: 'project-1',
            name: 'Projeto Alpha',
            isActive: false,
          },
        },
      ];

      (prismaService.userProjectAssignment.findMany as jest.Mock).mockResolvedValue(mockProjectAssignments);
      (prismaService.userProjectRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserProjectRoles('user-123');

      expect(result).toEqual([]);
    });
  });
}); 
