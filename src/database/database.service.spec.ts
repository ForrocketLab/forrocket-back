import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { PrismaService } from './prisma.service';
import { User } from '../auth/entities/user.entity';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, PrismaService],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    // Aguarda inicialização do banco
    await service.onModuleInit();
  });

  describe('findUserByEmail', () => {
    it('deve encontrar usuário Ana Oliveira por email', async () => {
      // Act
      const user = await service.findUserByEmail('ana.oliveira@rocketcorp.com');

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe('Ana Oliveira');
      expect(user?.email).toBe('ana.oliveira@rocketcorp.com');
      expect(user?.roles).toContain('colaborador');
    });

    it('deve encontrar usuário Bruno Mendes por email', async () => {
      // Act
      const user = await service.findUserByEmail('bruno.mendes@rocketcorp.com');

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe('Bruno Mendes');
      expect(user?.email).toBe('bruno.mendes@rocketcorp.com');
      expect(user?.roles).toContain('colaborador');
      expect(user?.roles).toContain('gestor');
    });

    it('deve encontrar usuário Carla Dias por email', async () => {
      // Act
      const user = await service.findUserByEmail('carla.dias@rocketcorp.com');

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe('Carla Dias');
      expect(user?.email).toBe('carla.dias@rocketcorp.com');
      expect(user?.roles).toContain('colaborador');
      expect(user?.roles).toContain('comite');
    });

    it('deve retornar null para email inexistente', async () => {
      // Act
      const user = await service.findUserByEmail('inexistente@rocketcorp.com');

      // Assert
      expect(user).toBeNull();
    });

    it('deve ser case-sensitive para emails', async () => {
      // Act
      const user = await service.findUserByEmail('ANA.OLIVEIRA@ROCKETCORP.COM');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('deve encontrar usuário por ID válido', async () => {
      // Arrange - Primeiro pega um usuário para ter um ID válido
      const userByEmail = await service.findUserByEmail('ana.oliveira@rocketcorp.com');
      
      // Act
      const userById = await service.findUserById(userByEmail!.id);

      // Assert
      expect(userById).toBeDefined();
      expect(userById?.id).toBe(userByEmail!.id);
      expect(userById?.email).toBe('ana.oliveira@rocketcorp.com');
    });

    it('deve retornar null para ID inexistente', async () => {
      // Act
      const user = await service.findUserById('00000000-0000-0000-0000-000000000000');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('deve ter exatamente 6 usuários cadastrados', async () => {
      // Act
      const users = await service.getAllUsers();

      // Assert
      expect(users).toHaveLength(6);
    });

    it('deve ter todos os usuários ativos', async () => {
      // Act
      const users = await service.getAllUsers();

      // Assert
      users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    it('deve ter todos os usuários com passwords hasheadas', async () => {
      // Act
      const users = await service.getAllUsers();

      // Assert
      users.forEach(user => {
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash).toContain('$2a$10$'); // bcrypt hash prefix
        expect(user.passwordHash.length).toBeGreaterThan(50);
      });
    });

    it('deve ter emails únicos', async () => {
      // Act
      const users = await service.getAllUsers();

      // Assert
      const emails = users.map(user => user.email);
      const uniqueEmails = [...new Set(emails)];
      expect(emails).toHaveLength(uniqueEmails.length);
    });

    it('deve ter IDs únicos', async () => {
      // Act
      const users = await service.getAllUsers();

      // Assert
      const ids = users.map(user => user.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids).toHaveLength(uniqueIds.length);
    });
  });

  describe('toPublic method', () => {
    it('deve remover passwordHash do objeto público', async () => {
      // Act
      const user = await service.findUserByEmail('ana.oliveira@rocketcorp.com');
      const publicUser = user?.toPublic();

      // Assert
      expect(publicUser).toBeDefined();
      expect(publicUser).not.toHaveProperty('passwordHash');
      expect(publicUser).toHaveProperty('id');
      expect(publicUser).toHaveProperty('name');
      expect(publicUser).toHaveProperty('email');
      expect(publicUser).toHaveProperty('roles');
    });
  });
}); 