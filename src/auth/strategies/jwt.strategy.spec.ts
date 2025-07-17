import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../jwt-payload.interface';
import { User } from '../entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-123',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    passwordHash: 'hashed-password',
    roles: '["colaborador"]',
    jobTitle: 'Desenvolvedor',
    seniority: 'Pleno',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',
    businessHub: 'Digital Hub',
    projects: '["projeto-app-mobile"]',
    managerId: 'gestor-id-123',
    directReports: '[]',
    mentorId: 'mentor-id-123',
    leaderId: null,
    directLeadership: '[]',
    mentoringIds: '[]',
    importBatchId: null,
    lastActivityAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toPublic: function() {
      const { passwordHash, ...publicUser } = this;
      return publicUser;
    }
  };

  const mockPayload: JwtPayload = {
    userId: 'user-123',
    name: 'João Silva',
    email: 'joao.silva@rocketcorp.com',
    roles: ['colaborador'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: {
            findUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('deve retornar usuário quando token é válido e usuário existe', async () => {
      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      jest.spyOn(authService, 'findUserById').mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Token inválido - usuário não encontrado')
      );
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lançar UnauthorizedException quando usuário está inativo', async () => {
      const inactiveUser: User = { 
        ...mockUser, 
        isActive: false,
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };
      jest.spyOn(authService, 'findUserById').mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Usuário inativo')
      );
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lidar com payload com userId diferente', async () => {
      const differentPayload: JwtPayload = {
        ...mockPayload,
        userId: 'different-user-id',
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(null);

      await expect(strategy.validate(differentPayload)).rejects.toThrow(
        new UnauthorizedException('Token inválido - usuário não encontrado')
      );
      expect(authService.findUserById).toHaveBeenCalledWith('different-user-id');
    });

    it('deve lidar com payload com email diferente', async () => {
      const differentPayload: JwtPayload = {
        ...mockPayload,
        email: 'different@email.com',
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(differentPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lidar com payload com roles diferentes', async () => {
      const differentPayload: JwtPayload = {
        ...mockPayload,
        roles: ['admin', 'rh'],
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(differentPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lidar com payload com name diferente', async () => {
      const differentPayload: JwtPayload = {
        ...mockPayload,
        name: 'Different Name',
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(differentPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lidar com erros do AuthService', async () => {
      jest.spyOn(authService, 'findUserById').mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(mockPayload)).rejects.toThrow('Database error');
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lidar com payload vazio', async () => {
      const emptyPayload = {} as JwtPayload;

      jest.spyOn(authService, 'findUserById').mockResolvedValue(null);

      await expect(strategy.validate(emptyPayload)).rejects.toThrow(
        new UnauthorizedException('Token inválido - usuário não encontrado')
      );
      expect(authService.findUserById).toHaveBeenCalledWith(undefined);
    });

    it('deve lidar com payload com userId undefined', async () => {
      const payloadWithoutUserId: JwtPayload = {
        userId: undefined as any,
        name: 'João Silva',
        email: 'joao.silva@rocketcorp.com',
        roles: ['colaborador'],
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(null);

      await expect(strategy.validate(payloadWithoutUserId)).rejects.toThrow(
        new UnauthorizedException('Token inválido - usuário não encontrado')
      );
      expect(authService.findUserById).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Configuração da Estratégia', () => {
    it('deve ter configuração JWT correta', () => {
      expect(strategy).toBeDefined();
      // Verificar se a estratégia foi configurada corretamente
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });

    it('deve usar fallback secret quando JWT_SECRET não está definido', async () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Recriar a estratégia para testar o fallback
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: AuthService,
            useValue: {
              findUserById: jest.fn(),
            },
          },
        ],
      }).compile();

      const newStrategy = module.get<JwtStrategy>(JwtStrategy);
      expect(newStrategy).toBeDefined();

      // Restaurar variável de ambiente
      if (originalEnv) {
        process.env.JWT_SECRET = originalEnv;
      }
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com usuário com isActive undefined', async () => {
      const userWithoutActive: User = { 
        ...mockUser, 
        isActive: undefined as any,
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };
      jest.spyOn(authService, 'findUserById').mockResolvedValue(userWithoutActive);

      // Quando isActive é undefined, deve ser tratado como false
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Usuário inativo')
      );
    });

    it('deve lidar com usuário com isActive null', async () => {
      const userWithNullActive: User = { 
        ...mockUser, 
        isActive: null as any,
        toPublic: function() {
          const { passwordHash, ...publicUser } = this;
          return publicUser;
        }
      };
      jest.spyOn(authService, 'findUserById').mockResolvedValue(userWithNullActive);

      // Quando isActive é null, deve ser tratado como false
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Usuário inativo')
      );
    });

    it('deve lidar com payload com propriedades extras', async () => {
      const extendedPayload = {
        ...mockPayload,
        extraProperty: 'extra value',
        anotherProperty: 123,
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(extendedPayload as JwtPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });

    it('deve lidar com payload com roles vazio', async () => {
      const payloadWithEmptyRoles: JwtPayload = {
        ...mockPayload,
        roles: [],
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(payloadWithEmptyRoles);

      expect(result).toEqual(mockUser);
    });

    it('deve lidar com payload com roles undefined', async () => {
      const payloadWithUndefinedRoles: JwtPayload = {
        userId: mockPayload.userId,
        name: mockPayload.name,
        email: mockPayload.email,
        roles: undefined as any,
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(payloadWithUndefinedRoles);

      expect(result).toEqual(mockUser);
    });
  });

  describe('Validações de Segurança', () => {
    it('deve validar que apenas userId é usado para buscar usuário', async () => {
      const maliciousPayload: JwtPayload = {
        userId: 'user-123',
        name: 'Malicious Name',
        email: 'malicious@email.com',
        roles: ['admin'],
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(maliciousPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith('user-123');
      expect(authService.findUserById).not.toHaveBeenCalledWith('malicious@email.com');
    });

    it('deve ignorar propriedades extras no payload', async () => {
      const payloadWithExtras = {
        ...mockPayload,
        maliciousField: 'malicious value',
        anotherField: 456,
      };

      jest.spyOn(authService, 'findUserById').mockResolvedValue(mockUser);

      const result = await strategy.validate(payloadWithExtras as JwtPayload);

      expect(result).toEqual(mockUser);
      expect(authService.findUserById).toHaveBeenCalledWith(mockPayload.userId);
    });
  });
}); 