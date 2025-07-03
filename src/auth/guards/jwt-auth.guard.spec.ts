import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';

// Mock do AuthGuard do Passport
const mockAuthGuard = {
  canActivate: jest.fn(() => true),
  handleRequest: jest.fn((err: any, user: any, info: any) => {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }),
};

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => {
    return class MockAuthGuard {
      canActivate = mockAuthGuard.canActivate;
      handleRequest = mockAuthGuard.handleRequest;
    };
  }),
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockExecutionContext = {
    getHandler: jest.fn(() => () => {}),
    getClass: jest.fn(() => function TestClass() {}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: {
          authorization: 'Bearer mock-token',
        },
      }),
      getResponse: jest.fn().mockReturnValue({
        status: jest.fn(),
        json: jest.fn(),
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();
    
    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('deve permitir acesso quando rota é marcada como pública', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('deve chamar super.canActivate quando rota não é pública', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true); // mock retorna true
      expect(mockAuthGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
    });
  });

  describe('handleRequest', () => {
    it('deve retornar usuário quando válido', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockInfo = null;
      const mockError = null;
      const result = guard.handleRequest(mockError, mockUser, mockInfo);
      expect(result).toEqual(mockUser);
    });

    it('deve lançar erro quando há erro de autenticação', () => {
      const mockUser = null;
      const mockInfo = 'Token expired';
      const mockError = new Error('Authentication failed');
      expect(() => guard.handleRequest(mockError, mockUser, mockInfo)).toThrow(mockError);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', () => {
      const mockUser = null;
      const mockInfo = 'No user found';
      const mockError = null;
      expect(() => guard.handleRequest(mockError, mockUser, mockInfo)).toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando há erro e usuário não existe', () => {
      const mockUser = null;
      const mockInfo = 'Token invalid';
      const mockError = new Error('Token validation failed');
      expect(() => guard.handleRequest(mockError, mockUser, mockInfo)).toThrow(mockError);
    });

    it('deve lançar UnauthorizedException com mensagem padrão', () => {
      const mockUser = null;
      const mockInfo = null;
      const mockError = null;
      expect(() => guard.handleRequest(mockError, mockUser, mockInfo)).toThrow(
        new UnauthorizedException('Token inválido ou expirado')
      );
    });

    it('deve lidar com diferentes tipos de erros de autenticação', () => {
      const errorTypes = [
        new Error('jwt expired'),
        new Error('jwt malformed'),
        new Error('invalid signature'),
        new Error('jwt not active'),
      ];
      errorTypes.forEach(error => {
        expect(() => guard.handleRequest(error, null, 'error info')).toThrow(error);
      });
    });

    it('deve lidar com diferentes tipos de info', () => {
      const infoTypes = [
        'Token expired',
        'No user found',
        'Invalid token',
        'Token malformed',
      ];
      infoTypes.forEach(info => {
        expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      });
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com reflector retornando undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true); // pois o mock retorna true
    });

    it('deve lidar com usuário undefined no handleRequest', () => {
      expect(() => guard.handleRequest(null, undefined, null)).toThrow(UnauthorizedException);
    });

    it('deve lidar com info undefined no handleRequest', () => {
      const mockUser = { id: 'user-123' };
      const result = guard.handleRequest(null, mockUser, undefined);
      expect(result).toEqual(mockUser);
    });
  });
}); 