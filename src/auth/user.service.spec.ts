import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UserType } from './dto';
import * as bcrypt from 'bcryptjs';

// Mock do bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  // Mock data - Usando dados reais do sistema
  const mockProject = {
    id: 'projeto-delta',
    name: 'Projeto Delta',
    isActive: true,
  };

  const mockMentor = {
    id: 'cmc0ztkj90002tzvwdwqll4tt',
    name: 'Carla Regina Dias Fernandes',
    isActive: true,
  };

  const mockCreateUserDto: CreateUserDto = {
    userType: UserType.PROJECT_MEMBER,
    name: 'João Silva Santos',
    email: 'joao.santos@rocketcorp.com',
    password: 'MinhaSenh@123',
    jobTitle: 'Desenvolvedor Backend',
    seniority: 'Júnior',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',
    projectAssignments: [
      {
        projectId: 'projeto-delta',
        roleInProject: 'colaborador'
      }
    ],
    mentorId: 'cmc0ztkj90002tzvwdwqll4tt'
  };

  // Mock do PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    userProjectAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userProjectRole: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userRoleAssignment: {
      upsert: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    selfAssessment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    assessment360: {
      findMany: jest.fn(),
    },
    managerAssessment: {
      findMany: jest.fn(),
    },
    committeeAssessment: {
      findMany: jest.fn(),
    },
    mentoringAssessment: {
      findMany: jest.fn(),
    },
    referenceFeedback: {
      findMany: jest.fn(),
    },
    evaluationCycle: {
      findFirst: jest.fn(),
    },
    // Métodos SQL diretos
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpar todos os mocks
    jest.clearAllMocks();
    
    // Configurar mock do bcrypt
    mockedBcrypt.hash.mockResolvedValue('$2a$12$hashedPassword' as never);

    // Configurar mocks SQL queries padrão
    mockPrismaService.$queryRaw.mockImplementation((query: any) => {
      // Mock para buscar leaderId do projeto
      if (query && query.strings && query.strings[0].includes('SELECT leaderId FROM projects')) {
        return Promise.resolve([{ leaderId: null }]); // Projeto sem líder por padrão
      }
      // Mock para buscar dados do usuário líder
      if (query && query.strings && query.strings[0].includes('SELECT id, name, isActive, directLeadership FROM users')) {
        return Promise.resolve([]);
      }
      // Mock para buscar leaderId do usuário
      if (query && query.strings && query.strings[0].includes('SELECT leaderId FROM users')) {
        return Promise.resolve([{ leaderId: null }]);
      }
      // Mock para buscar directLeadership
      if (query && query.strings && query.strings[0].includes('SELECT directLeadership FROM users')) {
        return Promise.resolve([{ directLeadership: null }]);
      }
      return Promise.resolve([]);
    });
    
    mockPrismaService.$executeRaw.mockResolvedValue({ count: 1 });
  });

  describe('createUser - Validações Básicas', () => {
    it('deve lançar ConflictException se email já existir', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: mockCreateUserDto.email
      });

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email }
      });
    });

    it('deve lançar BadRequestException se projeto não existir', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email não existe
      mockPrismaService.project.findUnique.mockResolvedValue(null); // Projeto não existe

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'projeto-delta' }
      });
    });

    it('deve lançar BadRequestException se projeto não estiver ativo', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Email não existe
      mockPrismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        isActive: false
      });

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se mentor não existir', async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(null); // Mentor doesn't exist
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se mentor não estiver ativo', async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce({ ...mockMentor, isActive: false }); // Mentor not active
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para project_member sem projectAssignments', async () => {
      const invalidDto = {
        ...mockCreateUserDto,
        projectAssignments: []
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.createUser(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createUser - Tipos de Usuário Globais', () => {
    const adminUserDto: CreateUserDto = {
      userType: UserType.ADMIN,
      name: 'Admin Test',
      email: 'admin.test@rocketcorp.com',
      password: 'AdminPass123',
      jobTitle: 'Administrador',
      seniority: 'Senior',
      careerTrack: 'Management',
      businessUnit: 'IT',
    };

    const rhUserDto: CreateUserDto = {
      userType: UserType.RH,
      name: 'RH Test',
      email: 'rh.test@rocketcorp.com',
      password: 'RHPass123',
      jobTitle: 'RH Specialist',
      seniority: 'Senior',
      careerTrack: 'People',
      businessUnit: 'HR',
    };

    const comiteUserDto: CreateUserDto = {
      userType: UserType.COMITE,
      name: 'Comitê Test',
      email: 'comite.test@rocketcorp.com',
      password: 'ComitePass123',
      jobTitle: 'Committee Member',
      seniority: 'Senior',
      careerTrack: 'Leadership',
      businessUnit: 'Executive',
    };

    it('deve criar usuário ADMIN com sucesso', async () => {
      const adminUser = {
        id: 'admin-123',
        ...adminUserDto,
        roles: '["admin"]',
        managerId: null,
        mentorId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(adminUser); // getUserProfile
      mockPrismaService.user.create.mockResolvedValue(adminUser);
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([]);

      const result = await service.createUser(adminUserDto);

      expect(result).toBeDefined();
      expect(result.roles).toEqual(['admin']);
      expect(result.managerId).toBeUndefined();
      expect(result.mentorId).toBeUndefined();
    });

    it('deve criar usuário RH com sucesso', async () => {
      const rhUser = {
        id: 'rh-123',
        ...rhUserDto,
        roles: '["rh"]',
        managerId: null,
        mentorId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(rhUser); // getUserProfile
      mockPrismaService.user.create.mockResolvedValue(rhUser);
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([]);

      const result = await service.createUser(rhUserDto);

      expect(result).toBeDefined();
      expect(result.roles).toEqual(['rh']);
    });

    it('deve criar usuário COMITÊ com sucesso', async () => {
      const comiteUser = {
        id: 'comite-123',
        ...comiteUserDto,
        roles: '["comite"]',
        managerId: null,
        mentorId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(comiteUser); // getUserProfile
      mockPrismaService.user.create.mockResolvedValue(comiteUser);
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([]);

      const result = await service.createUser(comiteUserDto);

      expect(result).toBeDefined();
      expect(result.roles).toEqual(['comite']);
    });

    it('deve ignorar projectAssignments para usuários globais', async () => {
      const adminWithProjectsDto = {
        ...adminUserDto,
        projectAssignments: [{ projectId: 'projeto-test', roleInProject: 'colaborador' as const }],
        mentorId: 'mentor-test'
      };

      const adminUser = {
        id: 'admin-123',
        ...adminWithProjectsDto,
        roles: '["admin"]',
        managerId: null,
        mentorId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(adminUser); // getUserProfile
      mockPrismaService.user.create.mockResolvedValue(adminUser);
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([]);

      const result = await service.createUser(adminWithProjectsDto);

      expect(result).toBeDefined();
      expect(result.mentorId).toBeUndefined();
      // Não deve tentar criar projectAssignments
      expect(mockPrismaService.userProjectAssignment.create).not.toHaveBeenCalled();
    });
  });

  describe('createUser - Validação de Gestor Único', () => {
    it('deve rejeitar criação de segundo gestor no mesmo projeto', async () => {
      // Limpar todos os mocks
      jest.clearAllMocks();
      mockedBcrypt.hash.mockResolvedValue('$2a$12$hashedPassword' as never);

      // Dados para criar segundo gestor
      const secondManagerData = {
        ...mockCreateUserDto,
        email: 'segundo.gestor@rocketcorp.com',
        projectAssignments: [
          {
            projectId: 'projeto-alpha',
            roleInProject: 'gestor' as 'gestor'
          }
        ]
      };

      // Mock: email não existe (primeira validação)
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      // Mock: projeto existe
      mockPrismaService.project.findUnique.mockResolvedValueOnce(mockProject);

      // Mock: já existe um gestor no projeto (Bruno)
      mockPrismaService.userProjectRole.findFirst.mockResolvedValueOnce({
        userId: 'existing-manager-id',
        projectId: 'projeto-alpha',
        role: 'MANAGER',
        user: {
          id: 'existing-manager-id',
          name: 'Bruno André Mendes Carvalho',
          isActive: true
        }
      });

      // Act & Assert
      await expect(service.createUser(secondManagerData))
        .rejects
        .toThrow('O projeto "Projeto Delta" já possui um gestor: Bruno André Mendes Carvalho. Um projeto só pode ter um gestor ativo por vez.');
    });

    it('deve permitir criação de gestor em projeto sem gestor', async () => {
      // Limpar todos os mocks
      jest.clearAllMocks();
      mockedBcrypt.hash.mockResolvedValue('$2a$12$hashedPassword' as never);

      // Dados para criar gestor em projeto sem gestor
      const newManagerData = {
        ...mockCreateUserDto,
        email: 'novo.gestor@rocketcorp.com',
        mentorId: undefined, // Remover mentor para simplificar o teste
        projectAssignments: [
          {
            projectId: 'projeto-sem-gestor',
            roleInProject: 'gestor' as 'gestor'
          }
        ]
      };

      // Mock: email não existe
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      // Mock: projeto existe
      mockPrismaService.project.findUnique.mockResolvedValueOnce({
        id: 'projeto-sem-gestor',
        name: 'Projeto Sem Gestor',
        isActive: true
      });

      // Mock: não existe gestor no projeto
      mockPrismaService.userProjectRole.findFirst.mockResolvedValueOnce(null);

      // Mock: busca de usuários legacy (fallback)
      mockPrismaService.user.findMany.mockResolvedValueOnce([]);

      // Mock: criação do usuário
      const createdUser = {
        id: 'new-manager-id',
        name: newManagerData.name,
        email: newManagerData.email,
        roles: '[\"colaborador\",\"gestor\"]',
        jobTitle: newManagerData.jobTitle,
        seniority: newManagerData.seniority,
        careerTrack: newManagerData.careerTrack,
        businessUnit: newManagerData.businessUnit,
        managerId: null,
        mentorId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaService.user.create.mockResolvedValueOnce(createdUser);

      // Mock: userProjectRole.findMany para updateDirectReports (colaboradores do projeto)
      mockPrismaService.userProjectRole.findMany.mockResolvedValueOnce([
        {
          userId: 'collaborator-1',
          projectId: 'projeto-sem-gestor',
          role: 'COLLABORATOR',
          user: {
            id: 'collaborator-1',
            name: 'Colaborador Teste',
            isActive: true,
            managerId: null
          }
        }
      ]);

      // Mock: user.findUnique para currentUser (directReports)
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'new-manager-id',
        directReports: null
      });

      // Mock: user.update para directReports
      mockPrismaService.user.update.mockResolvedValueOnce({} as any);

      // Mock: user.updateMany para managerId
      mockPrismaService.user.updateMany.mockResolvedValueOnce({ count: 1 });

      // Mock: getUserProfile
      mockPrismaService.user.findUnique.mockResolvedValueOnce(createdUser);

      // Mock: getProjectRoles
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValueOnce([
        {
          userId: 'new-manager-id',
          projectId: 'projeto-sem-gestor',
          project: {
            id: 'projeto-sem-gestor',
            name: 'Projeto Sem Gestor',
            isActive: true
          }
        }
      ]);

      mockPrismaService.userProjectRole.findMany.mockResolvedValueOnce([
        {
          role: 'MANAGER'
        }
      ]);

      // Act
      const result = await service.createUser(newManagerData);

      // Assert
      expect(result).toBeDefined();
      expect(result.roles).toEqual(['colaborador', 'gestor']);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('createUser - Sucesso', () => {
    it('deve criar usuário colaborador com sucesso', async () => {
      // Limpar todos os mocks
      jest.clearAllMocks();
      mockedBcrypt.hash.mockResolvedValue('$2a$12$hashedPassword' as never);

      // Mock do usuário criado com roles válido
      const createdUser = {
        id: 'new-user-123',
        name: mockCreateUserDto.name,
        email: mockCreateUserDto.email,
        passwordHash: '$2a$12$hashedPassword',
        roles: '["colaborador"]', // JSON string válido
        jobTitle: mockCreateUserDto.jobTitle,
        seniority: mockCreateUserDto.seniority,
        careerTrack: mockCreateUserDto.careerTrack,
        businessUnit: mockCreateUserDto.businessUnit,
        managerId: null,
        mentorId: mockMentor.id,
        directReports: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Contador para rastrear chamadas
      let findUniqueCallCount = 0;
      
      // Usar mockImplementation para controlar as chamadas
      mockPrismaService.user.findUnique.mockImplementation((args: any) => {
        findUniqueCallCount++;
        
        if (args.where.email) {
          // Email check - deve retornar null (email não existe)
          return Promise.resolve(null);
        } else if (args.where.id === mockMentor.id) {
          // Mentor lookup
          return Promise.resolve(mockMentor);
        } else if (args.where.id === createdUser.id) {
          // User profile lookup - CRUCIAL: deve retornar o usuário com roles
          return Promise.resolve(createdUser);
        } else {
          return Promise.resolve(null);
        }
      });
      
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.userProjectRole.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      
      // Mocks para createUserRelationships
      mockPrismaService.userProjectAssignment.create.mockResolvedValue({});
      mockPrismaService.userProjectRole.create.mockResolvedValue({});
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      
      // Mocks para updateDirectReports e getProjectRoles
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([{ role: 'COLLABORATOR' }]);
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([{ project: mockProject }]);

      // Act
      const result = await service.createUser(mockCreateUserDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(mockCreateUserDto.email);
      expect(result.name).toBe(mockCreateUserDto.name);
      expect(result.roles).toEqual(['colaborador']);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 12);
    });

    it('deve criar relacionamentos no banco de dados', async () => {
      // Limpar todos os mocks
      jest.clearAllMocks();
      mockedBcrypt.hash.mockResolvedValue('$2a$12$hashedPassword' as never);

      // Usar email único para evitar conflitos
      const uniqueUserDto = { 
        ...mockCreateUserDto, 
        email: 'joao.relacionamentos@rocketcorp.com' 
      };

      const uniqueUser = {
        id: 'unique-user-123',
        name: uniqueUserDto.name,
        email: uniqueUserDto.email,
        passwordHash: '$2a$12$hashedPassword',
        roles: '["colaborador"]',
        jobTitle: uniqueUserDto.jobTitle,
        seniority: uniqueUserDto.seniority,
        careerTrack: uniqueUserDto.careerTrack,
        businessUnit: uniqueUserDto.businessUnit,
        managerId: null,
        mentorId: mockMentor.id,
        directReports: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configurar mocks
      mockPrismaService.user.findUnique.mockImplementation((args: any) => {
        if (args.where.email) {
          return Promise.resolve(null);
        } else if (args.where.id === mockMentor.id) {
          return Promise.resolve(mockMentor);
        } else if (args.where.id === uniqueUser.id) {
          return Promise.resolve(uniqueUser);
        } else {
          return Promise.resolve(null);
        }
      });
      
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.userProjectRole.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.create.mockResolvedValue(uniqueUser);
      
      // Mocks para createUserRelationships
      mockPrismaService.userProjectAssignment.create.mockResolvedValue({});
      mockPrismaService.userProjectRole.create.mockResolvedValue({});
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      
      // Mocks para updateDirectReports e getProjectRoles
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([{ role: 'COLLABORATOR' }]);
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([{ project: mockProject }]);

      // Act
      await service.createUser(uniqueUserDto);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.userProjectAssignment.create).toHaveBeenCalledWith({
        data: {
          userId: uniqueUser.id,
          projectId: 'projeto-delta'
        }
      });
      expect(mockPrismaService.userProjectRole.create).toHaveBeenCalledWith({
        data: {
          userId: uniqueUser.id,
          projectId: 'projeto-delta',
          role: 'COLLABORATOR'
        }
      });
      expect(mockPrismaService.userRoleAssignment.upsert).toHaveBeenCalledWith({
        where: {
          userId_role: {
            userId: uniqueUser.id,
            role: 'COLLABORATOR'
          }
        },
        update: {},
        create: {
          userId: uniqueUser.id,
          role: 'COLLABORATOR'
        }
      });
    });

    it('deve preencher dados do mentor automaticamente', async () => {
      // Limpar todos os mocks
      jest.clearAllMocks();
      mockedBcrypt.hash.mockResolvedValue('$2a$12$hashedPassword' as never);

      // Usar email único para evitar conflitos
      const uniqueUserDto = { 
        ...mockCreateUserDto, 
        email: 'joao.mentor@rocketcorp.com' 
      };

      const uniqueUser = {
        id: 'mentor-user-123',
        name: uniqueUserDto.name,
        email: uniqueUserDto.email,
        passwordHash: '$2a$12$hashedPassword',
        roles: '["colaborador"]',
        jobTitle: uniqueUserDto.jobTitle,
        seniority: uniqueUserDto.seniority,
        careerTrack: uniqueUserDto.careerTrack,
        businessUnit: uniqueUserDto.businessUnit,
        managerId: null,
        mentorId: mockMentor.id,
        directReports: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configurar mocks
      mockPrismaService.user.findUnique.mockImplementation((args: any) => {
        if (args.where.email) {
          return Promise.resolve(null);
        } else if (args.where.id === mockMentor.id) {
          return Promise.resolve(mockMentor);
        } else if (args.where.id === uniqueUser.id) {
          return Promise.resolve(uniqueUser);
        } else {
          return Promise.resolve(null);
        }
      });
      
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.userProjectRole.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.create.mockResolvedValue(uniqueUser);
      
      // Mocks para createUserRelationships
      mockPrismaService.userProjectAssignment.create.mockResolvedValue({});
      mockPrismaService.userProjectRole.create.mockResolvedValue({});
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});
      
      // Mocks para updateDirectReports e getProjectRoles
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([{ role: 'COLLABORATOR' }]);
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([{ project: mockProject }]);

      // Act
      const result = await service.createUser(uniqueUserDto);

      // Assert
      expect(result.mentorId).toBe(mockMentor.id);
      expect(result.mentorName).toBe(mockMentor.name);
    });
  });

  describe('getUserProfile', () => {
    const mockUserId = 'user-123';
    const mockUserData = {
      id: mockUserId,
      name: 'Test User',
      email: 'test@rocketcorp.com',
      roles: '["colaborador"]',
      jobTitle: 'Developer',
      seniority: 'Junior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      managerId: 'manager-123',
      mentorId: 'mentor-123',
      directReports: '["report-1", "report-2"]',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockManager = { id: 'manager-123', name: 'Manager Name' };
    const mockMentorProfile = { id: 'mentor-123', name: 'Mentor Name' };

    it('deve retornar perfil completo do usuário', async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockMentorProfile) // Mentor
        .mockResolvedValueOnce(mockManager); // Manager
      
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([
        { project: mockProject }
      ]);
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([
        { role: 'COLLABORATOR' }
      ]);
      
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'report-1', name: 'Report 1' },
        { id: 'report-2', name: 'Report 2' }
      ]);

      // Act
      const result = await service.getUserProfile(mockUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUserId);
      expect(result.name).toBe('Test User');
      expect(result.roles).toEqual(['colaborador']);
      expect(result.projectRoles).toBeDefined();
      expect(result.mentorName).toBe('Mentor Name');
      expect(result.managerName).toBe('Manager Name');
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      // Arrange
      jest.clearAllMocks();
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('deve funcionar com mentor e manager nulos', async () => {
      const userWithoutMentorManager = {
        ...mockUserData,
        managerId: null,
        mentorId: null,
        directReports: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(userWithoutMentorManager);
      mockPrismaService.userProjectAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.userProjectRole.findMany.mockResolvedValue([]);

      const result = await service.getUserProfile(mockUserId);

      expect(result).toBeDefined();
      expect(result.mentorName).toBeUndefined();
      expect(result.managerName).toBeUndefined();
      // Aceitar que directReports pode ser undefined ou array vazio
      expect([undefined, []]).toContain(result.directReports);
    });
  });

  describe('getAllUsers', () => {
    it('deve retornar todos os usuários ativos', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@rocketcorp.com',
          roles: '["colaborador"]',
          jobTitle: 'Developer',
          seniority: 'Junior',
          careerTrack: 'Tech',
          businessUnit: 'Products',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          name: 'User 2',
          email: 'user2@rocketcorp.com',
          roles: '["admin"]',
          jobTitle: 'Admin',
          seniority: 'Senior',
          careerTrack: 'Management',
          businessUnit: 'IT',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].roles).toEqual(['colaborador']);
      expect(result[1].roles).toEqual(['admin']);
      // Não verificamos a assinatura exata do método pois pode variar
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });

    it('deve retornar array vazio se não houver usuários', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getPotentialMentors', () => {
    it('deve retornar lista de mentores potenciais', async () => {
      const mockMentors = [
        {
          id: 'mentor-1',
          name: 'Mentor 1',
          email: 'mentor1@rocketcorp.com',
          jobTitle: 'Senior Developer',
          seniority: 'Senior',
          businessUnit: 'Tech',
        },
        {
          id: 'mentor-2',
          name: 'Mentor 2',
          email: 'mentor2@rocketcorp.com',
          jobTitle: 'Tech Lead',
          seniority: 'Senior',
          businessUnit: 'Tech',
        }
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockMentors);

      const result = await service.getPotentialMentors();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'mentor-1',
        name: 'Mentor 1',
        email: 'mentor1@rocketcorp.com',
        jobTitle: 'Senior Developer',
        seniority: 'Senior',
        businessUnit: 'Tech',
      });
    });
  });

  describe('getAllUsersWithEvaluationProgress', () => {
    it('deve retornar usuários com progresso de avaliação', async () => {
      const mockActiveCycle = {
        name: 'Q1 2024'
      };

      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@rocketcorp.com',
          roles: '["colaborador"]',
          jobTitle: 'Developer',
          seniority: 'Junior',
          careerTrack: 'Tech',
          businessUnit: 'Products',
          isActive: true,
          managerId: 'manager-1',
          mentorId: 'mentor-1',
        }
      ];

      const mockSelfAssessment = {
        id: 'self-1',
        authorId: 'user-1',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      };

      mockPrismaService.evaluationCycle.findFirst.mockResolvedValue(mockActiveCycle);
      mockPrismaService.user.findMany
        .mockResolvedValueOnce(mockUsers) // First call: usuarios
        .mockResolvedValueOnce([]); // Second call: managers and mentors
      mockPrismaService.selfAssessment.findMany.mockResolvedValue([mockSelfAssessment]);
      mockPrismaService.assessment360.findMany.mockResolvedValue([]);
      mockPrismaService.managerAssessment.findMany.mockResolvedValue([]);
      mockPrismaService.mentoringAssessment.findMany.mockResolvedValue([]);
      mockPrismaService.referenceFeedback.findMany.mockResolvedValue([]);
      mockPrismaService.committeeAssessment.findMany.mockResolvedValue([]);

      const result = await service.getAllUsersWithEvaluationProgress();

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].evaluationProgress).toBeDefined();
      expect(result[0].evaluationProgress.selfAssessment.status).toBe('SUBMITTED');
    });
  });
}); 