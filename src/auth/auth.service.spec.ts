import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: DatabaseService;
  let jwtService: JwtService;

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
    toPublic: function() {
      const { passwordHash, ...publicUser } = this;
      return publicUser;
    }
  };

  const mockDatabaseService = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'ana.oliveira@rocketcorp.com',
      password: 'password123',
    };

    it('deve fazer login com credenciais válidas', async () => {
      // Arrange
      mockDatabaseService.findUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValue('mocked-jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        token: 'mocked-jwt-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          roles: mockUser.roles,
        },
      });
      expect(mockDatabaseService.findUserByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        userId: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        roles: mockUser.roles,
      });
    });

    it('deve lançar NotFoundException quando usuário não existir', async () => {
      // Arrange
      mockDatabaseService.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockDatabaseService.findUserByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('deve lançar UnauthorizedException quando senha estiver incorreta', async () => {
      // Arrange
      mockDatabaseService.findUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockDatabaseService.findUserByEmail).toHaveBeenCalledWith(loginDto.email);
    });
  });

  describe('findUserById', () => {
    it('deve encontrar usuário por ID', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockDatabaseService.findUserById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findUserById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.findUserById).toHaveBeenCalledWith(userId);
    });

    it('deve retornar null quando usuário não existir', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockDatabaseService.findUserById.mockResolvedValue(null);

      // Act
      const result = await service.findUserById(userId);

      // Assert
      expect(result).toBeNull();
      expect(mockDatabaseService.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findUserByEmail', () => {
    it('deve encontrar usuário por email', async () => {
      // Arrange
      const email = 'ana.oliveira@rocketcorp.com';
      mockDatabaseService.findUserByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findUserByEmail(email);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.findUserByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('validateToken', () => {
    it('deve validar token JWT válido', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const payload = {
        userId: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        roles: mockUser.roles,
      };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toEqual(payload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token);
    });

    it('deve lançar UnauthorizedException para token inválido', async () => {
      // Arrange
      const token = 'invalid-jwt-token';
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token inválido'));

      // Act & Assert
      await expect(service.validateToken(token)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token);
    });
  });

  describe('hasRole', () => {
    it('deve retornar true quando usuário tem a role', () => {
      // Act
      const result = service.hasRole(mockUser, 'colaborador');

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false quando usuário não tem a role', () => {
      // Act
      const result = service.hasRole(mockUser, 'admin');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('deve retornar true quando usuário tem pelo menos uma das roles', () => {
      // Act
      const result = service.hasAnyRole(mockUser, ['admin', 'colaborador']);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false quando usuário não tem nenhuma das roles', () => {
      // Act
      const result = service.hasAnyRole(mockUser, ['admin', 'gestor']);

      // Assert
      expect(result).toBe(false);
    });
  });
}); 