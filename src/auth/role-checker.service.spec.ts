import { Test, TestingModule } from '@nestjs/testing';
import { RoleCheckerService } from './role-checker.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

describe('RoleCheckerService', () => {
  let service: RoleCheckerService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleCheckerService,
        {
          provide: PrismaService,
          useValue: {
            userRoleAssignment: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RoleCheckerService>(RoleCheckerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('userHasRole', () => {
    it('deve retornar true quando usuário tem a role ADMIN', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.ADMIN,
      });

      const result = await service.userHasRole('user-123', 'admin');

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.ADMIN,
        },
      });
    });

    it('deve retornar true quando usuário tem a role RH', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.RH,
      });

      const result = await service.userHasRole('user-123', 'rh');

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.RH,
        },
      });
    });

    it('deve retornar true quando usuário tem a role COMMITTEE', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.COMMITTEE,
      });

      const result = await service.userHasRole('user-123', 'comite');

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.COMMITTEE,
        },
      });
    });

    it('deve retornar true quando usuário tem a role MANAGER', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.MANAGER,
      });

      const result = await service.userHasRole('user-123', 'gestor');

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.MANAGER,
        },
      });
    });

    it('deve retornar true quando usuário tem a role COLLABORATOR', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.COLLABORATOR,
      });

      const result = await service.userHasRole('user-123', 'colaborador');

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.COLLABORATOR,
        },
      });
    });

    it('deve retornar false quando usuário não tem a role', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue(null);

      const result = await service.userHasRole('user-123', 'admin');

      expect(result).toBe(false);
    });

    it('deve lidar com mapeamento case-insensitive', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.ADMIN,
      });

      const result = await service.userHasRole('user-123', 'ADMIN');

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.ADMIN,
        },
      });
    });

    it('deve lidar com erros do banco de dados', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockRejectedValue(new Error('DB error'));

      const result = await service.userHasRole('user-123', 'admin');

      expect(result).toBe(false);
    });

    it('deve aceitar UserRole enum diretamente', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
        userId: 'user-123',
        role: UserRole.ADMIN,
      });

      const result = await service.userHasRole('user-123', UserRole.ADMIN);

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          role: UserRole.ADMIN,
        },
      });
    });
  });

  describe('userHasAnyRole', () => {
    it('deve retornar true quando usuário tem pelo menos uma das roles', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst')
        .mockResolvedValueOnce(null) // Primeira role não encontrada
        .mockResolvedValueOnce({     // Segunda role encontrada
          userId: 'user-123',
          role: UserRole.RH,
        });

      const result = await service.userHasAnyRole('user-123', ['admin', 'rh']);

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledTimes(2);
    });

    it('deve retornar false quando usuário não tem nenhuma das roles', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst')
        .mockResolvedValue(null);

      const result = await service.userHasAnyRole('user-123', ['admin', 'rh']);

      expect(result).toBe(false);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledTimes(2);
    });

    it('deve parar na primeira role encontrada', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst')
        .mockResolvedValueOnce({     // Primeira role encontrada
          userId: 'user-123',
          role: UserRole.ADMIN,
        });

      const result = await service.userHasAnyRole('user-123', ['admin', 'rh']);

      expect(result).toBe(true);
      expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledTimes(1);
    });

    it('deve lidar com array vazio de roles', async () => {
      const result = await service.userHasAnyRole('user-123', []);

      expect(result).toBe(false);
      expect(prismaService.userRoleAssignment.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('getUserRoles', () => {
    it('deve retornar todas as roles do usuário', async () => {
      const mockAssignments = [
        {
          userId: 'user-123',
          role: UserRole.ADMIN,
        },
        {
          userId: 'user-123',
          role: UserRole.MANAGER,
        },
      ];

      jest.spyOn(prismaService.userRoleAssignment, 'findMany').mockResolvedValue(mockAssignments);

      const result = await service.getUserRoles('user-123');

      expect(result).toEqual([UserRole.ADMIN, UserRole.MANAGER]);
      expect(prismaService.userRoleAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: { role: true },
      });
    });

    it('deve retornar array vazio quando usuário não tem roles', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findMany').mockResolvedValue([]);

      const result = await service.getUserRoles('user-123');

      expect(result).toEqual([]);
    });

    it('deve lidar com erros do banco de dados', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findMany').mockRejectedValue(new Error('DB error'));

      const result = await service.getUserRoles('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('isAdmin', () => {
    it('deve retornar true quando usuário é admin', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);

      const result = await service.isAdmin('user-123');

      expect(result).toBe(true);
      expect(service.userHasRole).toHaveBeenCalledWith('user-123', UserRole.ADMIN);
    });

    it('deve retornar false quando usuário não é admin', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);

      const result = await service.isAdmin('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isHR', () => {
    it('deve retornar true quando usuário é do RH', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);

      const result = await service.isHR('user-123');

      expect(result).toBe(true);
      expect(service.userHasRole).toHaveBeenCalledWith('user-123', UserRole.RH);
    });

    it('deve retornar false quando usuário não é do RH', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);

      const result = await service.isHR('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isCommittee', () => {
    it('deve retornar true quando usuário é membro do comitê', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);

      const result = await service.isCommittee('user-123');

      expect(result).toBe(true);
      expect(service.userHasRole).toHaveBeenCalledWith('user-123', UserRole.COMMITTEE);
    });

    it('deve retornar false quando usuário não é membro do comitê', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);

      const result = await service.isCommittee('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isManager', () => {
    it('deve retornar true quando usuário é gestor', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);

      const result = await service.isManager('user-123');

      expect(result).toBe(true);
      expect(service.userHasRole).toHaveBeenCalledWith('user-123', UserRole.MANAGER);
    });

    it('deve retornar false quando usuário não é gestor', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);

      const result = await service.isManager('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isCollaborator', () => {
    it('deve retornar true quando usuário é colaborador', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(true);

      const result = await service.isCollaborator('user-123');

      expect(result).toBe(true);
      expect(service.userHasRole).toHaveBeenCalledWith('user-123', UserRole.COLLABORATOR);
    });

    it('deve retornar false quando usuário não é colaborador', async () => {
      jest.spyOn(service, 'userHasRole').mockResolvedValue(false);

      const result = await service.isCollaborator('user-123');

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve lidar com userId vazio', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue(null);

      const result = await service.userHasRole('', 'admin');

      expect(result).toBe(false);
    });

    it('deve lidar com role vazia', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue(null);

      const result = await service.userHasRole('user-123', '');

      expect(result).toBe(false);
    });

    it('deve lidar com role desconhecida', async () => {
      jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue(null);

      const result = await service.userHasRole('user-123', 'unknown-role');

      expect(result).toBe(false);
    });

    it('deve mapear corretamente todas as variações de role', async () => {
      const roleMappings = [
        { input: 'admin', expected: UserRole.ADMIN },
        { input: 'rh', expected: UserRole.RH },
        { input: 'comite', expected: UserRole.COMMITTEE },
        { input: 'committee', expected: UserRole.COMMITTEE },
        { input: 'gestor', expected: UserRole.MANAGER },
        { input: 'manager', expected: UserRole.MANAGER },
        { input: 'colaborador', expected: UserRole.COLLABORATOR },
        { input: 'collaborator', expected: UserRole.COLLABORATOR },
      ];

      for (const mapping of roleMappings) {
        jest.spyOn(prismaService.userRoleAssignment, 'findFirst').mockResolvedValue({
          userId: 'user-123',
          role: mapping.expected,
        });

        const result = await service.userHasRole('user-123', mapping.input);

        expect(result).toBe(true);
        expect(prismaService.userRoleAssignment.findFirst).toHaveBeenCalledWith({
          where: {
            userId: 'user-123',
            role: mapping.expected,
          },
        });
      }
    });
  });
}); 