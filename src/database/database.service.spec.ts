import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { PrismaService } from './prisma.service';
import { User } from '../auth/entities/user.entity';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let prismaService: any;

  const mockUsers = [
    {
      id: '1',
      name: 'Ana Beatriz Oliveira Santos',
      email: 'ana.oliveira@rocketcorp.com',
      passwordHash: '$2a$10$test.hash.for.ana.very.long.hash.string.that.is.more.than.50.characters',
      roles: JSON.stringify(['colaborador']),
      jobTitle: 'Desenvolvedora Frontend',
      seniority: 'Pleno',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      projects: JSON.stringify(['projeto-app-mobile', 'projeto-dashboard']),
      managerId: null,
      directReports: null,
      mentorId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Bruno André Mendes Carvalho',
      email: 'bruno.mendes@rocketcorp.com',
      passwordHash: '$2a$10$test.hash.for.bruno.very.long.hash.string.that.is.more.than.50.characters',
      roles: JSON.stringify(['colaborador', 'gestor']),
      jobTitle: 'Tech Lead',
      seniority: 'Sênior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      projects: JSON.stringify(['projeto-app-mobile', 'projeto-api-core']),
      managerId: null,
      directReports: JSON.stringify([]),
      mentorId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Carla Regina Dias Fernandes',
      email: 'carla.dias@rocketcorp.com',
      passwordHash: '$2a$10$test.hash.for.carla.very.long.hash.string.that.is.more.than.50.characters',
      roles: JSON.stringify(['comite']),
      jobTitle: 'Head of Engineering',
      seniority: 'Principal',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      projects: JSON.stringify(['projeto-estrategia-tech', 'projeto-arquitetura']),
      managerId: null,
      directReports: JSON.stringify([]),
      mentorId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    // Mock console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    prismaService = module.get(PrismaService);

    // Configurar mocks padrão
    prismaService.user.findUnique.mockResolvedValue(mockUsers[0]);
    prismaService.user.findMany.mockResolvedValue(mockUsers);
    prismaService.user.count.mockResolvedValue(mockUsers.length);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findUserByEmail', () => {
    it('deve encontrar usuário Ana Oliveira por email', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUsers[0]);

      // Act
      const user = await service.findUserByEmail('ana.oliveira@rocketcorp.com');

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe('Ana Beatriz Oliveira Santos');
      expect(user?.email).toBe('ana.oliveira@rocketcorp.com');
      expect(user?.roles).toContain('colaborador');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ana.oliveira@rocketcorp.com' }
      });
    });

    it('deve encontrar usuário Bruno Mendes por email', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUsers[1]);

      // Act
      const user = await service.findUserByEmail('bruno.mendes@rocketcorp.com');

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe('Bruno André Mendes Carvalho');
      expect(user?.email).toBe('bruno.mendes@rocketcorp.com');
      expect(user?.roles).toContain('colaborador');
      expect(user?.roles).toContain('gestor');
    });

    it('deve encontrar usuário Carla Dias por email', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUsers[2]);

      // Act
      const user = await service.findUserByEmail('carla.dias@rocketcorp.com');

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe('Carla Regina Dias Fernandes');
      expect(user?.email).toBe('carla.dias@rocketcorp.com');
      expect(user?.roles).toContain('comite');
    });

    it('deve retornar null para email inexistente', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const user = await service.findUserByEmail('inexistente@rocketcorp.com');

      // Assert
      expect(user).toBeNull();
    });

    it('deve ser case-sensitive para emails', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const user = await service.findUserByEmail('ANA.OLIVEIRA@ROCKETCORP.COM');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('deve encontrar usuário por ID válido', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUsers[0]);

      // Act
      const user = await service.findUserById('1');

      // Assert
      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
      expect(user?.email).toBe('ana.oliveira@rocketcorp.com');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('deve retornar null para ID inexistente', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const user = await service.findUserById('00000000-0000-0000-0000-000000000000');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('deve retornar todos os usuários', async () => {
      // Arrange
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const users = await service.getAllUsers();

      // Assert
      expect(users).toHaveLength(3);
      expect(users[0].name).toBe('Ana Beatriz Oliveira Santos');
      expect(users[1].name).toBe('Bruno André Mendes Carvalho');
      expect(users[2].name).toBe('Carla Regina Dias Fernandes');
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });

    it('deve ter todos os usuários ativos', async () => {
      // Arrange
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const users = await service.getAllUsers();

      // Assert
      users.forEach((user) => {
        expect(user.isActive).toBe(true);
      });
    });

    it('deve ter todos os usuários com passwords hasheadas', async () => {
      // Arrange
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const users = await service.getAllUsers();

      // Assert
      users.forEach((user) => {
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash).toMatch(/^\$2a\$1[02]\$/);
        expect(user.passwordHash.length).toBeGreaterThan(50);
      });
    });

    it('deve ter emails únicos', async () => {
      // Arrange
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const users = await service.getAllUsers();

      // Assert
      const emails = users.map((user) => user.email);
      const uniqueEmails = [...new Set(emails)];
      expect(emails).toHaveLength(uniqueEmails.length);
    });

    it('deve ter IDs únicos', async () => {
      // Arrange
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const users = await service.getAllUsers();

      // Assert
      const ids = users.map((user) => user.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids).toHaveLength(uniqueIds.length);
    });
  });

  describe('emailExists', () => {
    it('deve retornar true para email existente', async () => {
      // Arrange
      prismaService.user.count.mockResolvedValue(1);

      // Act
      const exists = await service.emailExists('ana.oliveira@rocketcorp.com');

      // Assert
      expect(exists).toBe(true);
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { email: 'ana.oliveira@rocketcorp.com' }
      });
    });

    it('deve retornar false para email inexistente', async () => {
      // Arrange
      prismaService.user.count.mockResolvedValue(0);

      // Act
      const exists = await service.emailExists('inexistente@rocketcorp.com');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('saveUser', () => {
    it('deve criar novo usuário', async () => {
      // Arrange
      const newUser = new User();
      newUser.name = 'Novo Usuário';
      newUser.email = 'novo@rocketcorp.com';
      newUser.passwordHash = '$2a$10$test.hash.very.long.hash.string.that.is.more.than.50.characters';
      newUser.roles = '["colaborador"]';
      newUser.isActive = true;

      prismaService.user.upsert.mockResolvedValue({
        ...mockUsers[0],
        name: 'Novo Usuário',
        email: 'novo@rocketcorp.com',
      });

      // Act
      const savedUser = await service.saveUser(newUser);

      // Assert
      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe('Novo Usuário');
      expect(prismaService.user.upsert).toHaveBeenCalledWith({
        where: { email: 'novo@rocketcorp.com' },
        update: expect.any(Object),
        create: expect.any(Object),
      });
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário por ID', async () => {
      // Arrange
      prismaService.user.delete.mockResolvedValue(mockUsers[0]);

      // Act
      await service.deleteUser('1');

      // Assert
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });
  });

  describe('toPublic method', () => {
    it('deve remover passwordHash do objeto público', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(mockUsers[0]);

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
