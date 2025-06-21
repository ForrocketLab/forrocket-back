import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Serviço de banco de dados para SQLite com Prisma
 * Gerencia operações reais do banco de dados
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Não inicializar automaticamente em ambiente de teste
    // Os testes devem usar dados controlados via seed ou setup específico
    if (process.env.NODE_ENV !== 'test') {
      await this.initializeDatabase();
    }
  }

  /**
   * Inicializa o banco de dados com usuários padrão
   */
  private async initializeDatabase() {
    console.log('🔧 Inicializando banco de dados SQLite com Prisma...');
    
    // Verifica se já existem usuários
    const userCount = await this.prisma.user.count();
    
    if (userCount === 0) {
      console.log('👥 Criando usuários padrão...');
      await this.createDefaultUsers();
    } else {
      console.log(`👥 Banco já possui ${userCount} usuários`);
    }
    
    console.log('✅ Banco de dados inicializado com sucesso!');
  }

  /**
   * Cria os usuários padrão no banco
   */
  private async createDefaultUsers() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      {
        // Ana - Colaboradora Simples (Desenvolvedora Frontend)
        name: 'Ana Oliveira',
        email: 'ana.oliveira@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador']),
        
        // Dados organizacionais
        jobTitle: 'Desenvolvedora Frontend',
        seniority: 'Pleno',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        
        // Relacionamentos
        projects: JSON.stringify(['projeto-app-mobile', 'projeto-dashboard']),
        managerId: null, // Será definido após criação dos usuários
        directReports: null,
        mentorId: null,
        
        isActive: true,
      },
      {
        // Bruno - Colaborador Gestor (Tech Lead)
        name: 'Bruno Mendes',
        email: 'bruno.mendes@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador', 'gestor']),
        
        // Dados organizacionais
        jobTitle: 'Tech Lead',
        seniority: 'Sênior',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        
        // Relacionamentos
        projects: JSON.stringify(['projeto-app-mobile', 'projeto-api-core']),
        managerId: null, // Será definido após criação
        directReports: JSON.stringify([]), // Será atualizado após criação
        mentorId: null,
        
        isActive: true,
      },
      {
        // Carla - Sócia/Comitê (Head of Engineering)
        name: 'Carla Dias',
        email: 'carla.dias@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador', 'comite']),
        
        // Dados organizacionais
        jobTitle: 'Head of Engineering',
        seniority: 'Principal',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        
        // Relacionamentos
        projects: JSON.stringify(['projeto-estrategia-tech', 'projeto-arquitetura']),
        managerId: null, // Sócia, não tem gestor
        directReports: JSON.stringify([]), // Será atualizado após criação
        mentorId: null,
        
        isActive: true,
      },
    ];

    for (const userData of users) {
      const user = await this.prisma.user.create({
        data: userData
      });
      console.log(`✅ Usuário criado: ${user.name} (${user.email}) - ${JSON.parse(user.roles).join(', ')}`);
    }
  }

  /**
   * Busca usuário por email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    console.log(`🔍 Buscando usuário por email: ${email}`);
    
    const prismaUser = await this.prisma.user.findUnique({
      where: { email }
    });
    
    if (!prismaUser) {
      console.log(`✅ Usuário encontrado: Não encontrado`);
      return null;
    }

    // Converte do formato Prisma para o formato User entity
    const user = this.prismaToUser(prismaUser);
    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);
    
    return user;
  }

  /**
   * Busca usuário por ID
   */
  async findUserById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id }
    });
    
    return prismaUser ? this.prismaToUser(prismaUser) : null;
  }

  /**
   * Retorna todos os usuários (para debug)
   */
  async getAllUsers(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany();
    return prismaUsers.map(user => this.prismaToUser(user));
  }

  /**
   * Verifica se o email existe
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email }
    });
    return count > 0;
  }

  /**
   * Salva ou atualiza um usuário
   */
  async saveUser(user: User): Promise<User> {
    const userData = {
      // Dados de identificação e acesso
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: JSON.stringify(user.roles),
      
      // Dados organizacionais
      jobTitle: user.jobTitle,
      seniority: user.seniority,
      careerTrack: user.careerTrack,
      businessUnit: user.businessUnit,
      
      // Relacionamentos
      projects: JSON.stringify(user.projects || []),
      managerId: user.managerId,
      directReports: JSON.stringify(user.directReports || []),
      mentorId: user.mentorId,
      
      // Metadados
      isActive: user.isActive,
    };

    const prismaUser = await this.prisma.user.upsert({
      where: { email: user.email },
      update: userData,
      create: userData,
    });

    return this.prismaToUser(prismaUser);
  }

  /**
   * Remove um usuário
   */
  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  /**
   * Converte dados do Prisma para User entity
   */
  private prismaToUser(prismaUser: any): User {
    const user = new User();
    
    // Dados de identificação e acesso
    user.id = prismaUser.id;
    user.name = prismaUser.name;
    user.email = prismaUser.email;
    user.passwordHash = prismaUser.passwordHash;
    user.roles = JSON.parse(prismaUser.roles);
    
    // Dados organizacionais
    user.jobTitle = prismaUser.jobTitle;
    user.seniority = prismaUser.seniority;
    user.careerTrack = prismaUser.careerTrack;
    user.businessUnit = prismaUser.businessUnit;
    
    // Relacionamentos
    user.projects = prismaUser.projects ? JSON.parse(prismaUser.projects) : [];
    user.managerId = prismaUser.managerId;
    user.directReports = prismaUser.directReports ? JSON.parse(prismaUser.directReports) : [];
    user.mentorId = prismaUser.mentorId;
    
    // Metadados
    user.isActive = prismaUser.isActive;
    user.createdAt = prismaUser.createdAt;
    user.updatedAt = prismaUser.updatedAt;
    
    return user;
  }
} 