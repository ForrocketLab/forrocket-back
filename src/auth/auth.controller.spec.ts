import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@rocketcorp.com',
    passwordHash: '$2a$10$mockHashedPassword',
    roles: ['colaborador'],

    // Dados organizacionais
    jobTitle: 'Desenvolvedora Frontend',
    seniority: 'Pleno',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',

    // Relacionamentos
    projects: ['projeto-app-mobile', 'projeto-dashboard'],
    managerId: 'gestor-id-123',
    directReports: [],
    mentorId: 'mentor-id-123',

    // Metadados
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toPublic: function () {
      const { passwordHash, ...publicUser } = this;
      return publicUser;
    },
  };

  const mockAuthService = {
    login: jest.fn(),
    getUserProjectRoles: jest.fn(),
  };

  const mockUserService = {
    getUserProfile: jest.fn(),
    createUser: jest.fn(),
    findUserById: jest.fn(),
  };

  const mockRoleCheckerService = {
    isAdmin: jest.fn(),
    isHR: jest.fn(),
    isManager: jest.fn(),
    isCommittee: jest.fn(),
    userHasRole: jest.fn(),
    userHasAnyRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: require('./role-checker.service').RoleCheckerService,
          useValue: mockRoleCheckerService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'ana.oliveira@rocketcorp.com',
      password: 'password123',
    };

    it('deve fazer login com sucesso', async () => {
      // Arrange
      const expectedResponse = {
        token: 'mocked-jwt-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          roles: mockUser.roles,
        },
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('deve lançar NotFoundException quando usuário não existir', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('deve lançar UnauthorizedException quando senha estiver incorreta', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Senha incorreta'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('deve retornar perfil do usuário', async () => {
      // Arrange
      const mockProjectRoles = [
        {
          projectId: 'projeto-app-mobile',
          projectName: 'App Mobile',
          roles: ['COLLABORATOR'],
        },
      ];

      const expectedProfile = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        roles: mockUser.roles,
        jobTitle: mockUser.jobTitle,
        seniority: mockUser.seniority,
        careerTrack: mockUser.careerTrack,
        businessUnit: mockUser.businessUnit,
        projectRoles: mockProjectRoles,
        managerId: mockUser.managerId,
        directReports: mockUser.directReports,
        mentorId: mockUser.mentorId,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockAuthService.getUserProjectRoles.mockResolvedValue(mockProjectRoles);

      // Act
      const result = await controller.getProfile(mockUser);

      // Assert
      expect(result).toEqual(expectedProfile);
      expect(mockAuthService.getUserProjectRoles).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getStatus', () => {
    it('deve retornar status da API', async () => {
      // Act
      const result = await controller.getStatus();

      // Assert
      expect(result).toEqual({
        status: 'ok',
        message: 'API de autenticação RPE funcionando',
        timestamp: expect.any(String),
        version: '1.0.0',
      });
    });

    it('deve retornar timestamp no formato ISO', async () => {
      // Act
      const result = await controller.getStatus();

      // Assert
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
