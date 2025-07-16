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
        businessHub: 'Technology Hub',
        // Relacionamentos
        projects: JSON.stringify(['projeto-app-mobile', 'projeto-dashboard']),
        managerId: null,
        directReports: null, 
        mentorId: null,
        leaderId: null,
        directLeadership: null, 
        mentoringIds: null, 
        // Metadados
        isActive: true,
        // Novos campos de segurança
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null,
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
        businessHub: 'Technology Hub',
        // Relacionamentos
        projects: JSON.stringify(['projeto-app-mobile', 'projeto-api-core']),
        managerId: null,
        directReports: JSON.stringify([]), 
        mentorId: null,
        leaderId: null,
        directLeadership: JSON.stringify([]), 
        mentoringIds: JSON.stringify([]), 
        // Metadados
        isActive: true,
        // Novos campos de segurança
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null,
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
        businessHub: 'Technology Hub',
        // Relacionamentos
        projects: JSON.stringify(['projeto-estrategia-tech', 'projeto-arquitetura']),
        managerId: null,
        directReports: JSON.stringify([]),
        mentorId: null,
        leaderId: null,
        directLeadership: JSON.stringify([]),
        mentoringIds: JSON.stringify(['cmd5qlffh0003hws4zc1wq0u6', 'cmd5qlfgl0006hws4rb1ued41']), 
        // Metadados
        isActive: true,
        // Novos campos de segurança
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null,
      },
      // Adicione outros usuários padrão se necessário, garantindo todos os novos campos
    ];

    for (const userData of users) {
      const user = await this.prisma.user.create({
        data: userData,
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
      where: { email },
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
      where: { id },
    });

    return prismaUser ? this.prismaToUser(prismaUser) : null;
  }

  /**
   * Retorna todos os usuários (para debug)
   */
  async getAllUsers(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany();
    return prismaUsers.map((user) => this.prismaToUser(user));
  }

  /**
   * Verifica se o email existe
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Salva ou atualiza um usuário
   */
  async saveUser(user: User): Promise<User> {

    const dataToSave: any = {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: typeof user.roles === 'string' ? user.roles : JSON.stringify(user.roles),

      jobTitle: user.jobTitle,
      seniority: user.seniority,
      careerTrack: user.careerTrack,
      businessUnit: user.businessUnit,
      businessHub: user.businessHub, 

      projects: user.projects ? (typeof user.projects === 'string' ? user.projects : JSON.stringify(user.projects)) : null,
      managerId: user.managerId, 
      directReports: user.directReports ? (typeof user.directReports === 'string' ? user.directReports : JSON.stringify(user.directReports)) : null,
      mentorId: user.mentorId, 
      leaderId: user.leaderId, 
      directLeadership: user.directLeadership ? (typeof user.directLeadership === 'string' ? user.directLeadership : JSON.stringify(user.directLeadership)) : null,
      mentoringIds: user.mentoringIds ? (typeof user.mentoringIds === 'string' ? user.mentoringIds : JSON.stringify(user.mentoringIds)) : null,

      isActive: user.isActive,
      lastActivityAt: user.lastActivityAt, 
      importBatchId: user.importBatchId, 

      // Novos campos de segurança
      failedLoginAttempts: user.failedLoginAttempts,
      isLocked: user.isLocked,
      lockUntil: user.lockUntil, 
      passwordResetCode: user.passwordResetCode, 
      passwordResetCodeExpiresAt: user.passwordResetCodeExpiresAt, 
    };

    const prismaUser = await this.prisma.user.upsert({
      where: { email: user.email },
      update: dataToSave,
      create: dataToSave,
    });

    return this.prismaToUser(prismaUser);
  }

  /**
   * Remove um usuário
   */
  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Converte dados do Prisma para User entity
   */
  private prismaToUser(prismaUser: any): User {
    // Instancia User passando o objeto prismaUser para o construtor
    // Isso mapeia automaticamente todas as propriedades que têm o mesmo nome e tipo
    const user = new User(prismaUser);

    user.businessHub = prismaUser.businessHub || null;
    user.managerId = prismaUser.managerId || null;
    user.mentorId = prismaUser.mentorId || null;
    user.leaderId = prismaUser.leaderId || null;
    user.importBatchId = prismaUser.importBatchId || null;
    user.lastActivityAt = prismaUser.lastActivityAt || null;
    user.lockUntil = prismaUser.lockUntil || null;
    user.passwordResetCode = prismaUser.passwordResetCode || null;
    user.passwordResetCodeExpiresAt = prismaUser.passwordResetCodeExpiresAt || null;

    return user;
  }
}
