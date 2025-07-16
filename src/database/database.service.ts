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
    if (process.env.NODE_ENV !== 'test') {
      await this.initializeDatabase();
    }
  }

  private async initializeDatabase() {
    console.log('🔧 Inicializando banco de dados SQLite com Prisma...');

    const userCount = await this.prisma.user.count();

    if (userCount === 0) {
      console.log('👥 Criando usuários padrão...');
      await this.createDefaultUsers();
    } else {
      console.log(`👥 Banco já possui ${userCount} usuários`);
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
  }

  private async createDefaultUsers() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      {
        name: 'Ana Oliveira',
        email: 'ana.oliveira@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador']),
        jobTitle: 'Desenvolvedora Frontend',
        seniority: 'Pleno',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        businessHub: 'Technology Hub',
        projects: JSON.stringify(['projeto-app-mobile', 'projeto-dashboard']),
        managerId: null,
        directReports: null,
        mentorId: null,
        leaderId: null,
        directLeadership: null,
        mentoringIds: null,
        isActive: true,
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null
      },
      {
        name: 'Bruno Mendes',
        email: 'bruno.mendes@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador', 'gestor']),
        jobTitle: 'Tech Lead',
        seniority: 'Sênior',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        businessHub: 'Technology Hub',
        projects: JSON.stringify(['projeto-app-mobile', 'projeto-api-core']),
        managerId: null,
        directReports: JSON.stringify([]),
        mentorId: null,
        leaderId: null,
        directLeadership: JSON.stringify([]),
        mentoringIds: JSON.stringify([]),
        isActive: true,
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null
      },
      {
        name: 'Carla Dias',
        email: 'carla.dias@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador', 'comite']),
        jobTitle: 'Head of Engineering',
        seniority: 'Principal',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        businessHub: 'Technology Hub',
        projects: JSON.stringify(['projeto-estrategia-tech', 'projeto-arquitetura']),
        managerId: null,
        directReports: JSON.stringify([]),
        mentorId: null,
        leaderId: null,
        directLeadership: JSON.stringify([]),
        mentoringIds: JSON.stringify(['cmd5qlffh0003hws4zc1wq0u6', 'cmd5qlfgl0006hws4rb1ued41']),
        isActive: true,
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null
      }
    ];

    for (const userData of users) {
      const user = await this.prisma.user.create({
        data: userData
      });
      console.log(`✅ Usuário criado: ${user.name} (${user.email}) - ${JSON.parse(user.roles).join(', ')}`);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    console.log(`🔍 Buscando usuário por email: ${email}`);

    const prismaUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!prismaUser) {
      console.log(`✅ Usuário encontrado: Não encontrado`);
      return null;
    }

    const user = this.prismaToUser(prismaUser);
    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id }
    });

    return prismaUser ? this.prismaToUser(prismaUser) : null;
  }

  async getAllUsers(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany();
    return prismaUsers.map(user => this.prismaToUser(user));
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email }
    });
    return count > 0;
  }

  async saveUser(user: User): Promise<User> {
    const userData = {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: JSON.stringify(user.roles),
      jobTitle: user.jobTitle,
      seniority: user.seniority,
      careerTrack: user.careerTrack,
      businessUnit: user.businessUnit,
      businessHub: user.businessHub,
      projects: JSON.stringify(user.projects || []),
      managerId: user.managerId,
      directReports: JSON.stringify(user.directReports || []),
      mentorId: user.mentorId,
      leaderId: user.leaderId,
      directLeadership: JSON.stringify(user.directLeadership || []),
      mentoringIds: JSON.stringify(user.mentoringIds || []),
      isActive: user.isActive,
      lastActivityAt: user.lastActivityAt,
      importBatchId: user.importBatchId,
      failedLoginAttempts: user.failedLoginAttempts,
      isLocked: user.isLocked,
      lockUntil: user.lockUntil,
      passwordResetCode: user.passwordResetCode,
      passwordResetCodeExpiresAt: user.passwordResetCodeExpiresAt
    };

    const prismaUser = await this.prisma.user.upsert({
      where: { email: user.email },
      update: userData,
      create: userData
    });

    return this.prismaToUser(prismaUser);
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  private prismaToUser(prismaUser: any): User {
    const user = new User(prismaUser);

    user.id = prismaUser.id;
    user.name = prismaUser.name;
    user.email = prismaUser.email;
    user.passwordHash = prismaUser.passwordHash;
    user.roles = JSON.parse(prismaUser.roles);
    user.jobTitle = prismaUser.jobTitle;
    user.seniority = prismaUser.seniority;
    user.careerTrack = prismaUser.careerTrack;
    user.businessUnit = prismaUser.businessUnit;
    user.businessHub = prismaUser.businessHub;
    user.projects = prismaUser.projects ? JSON.parse(prismaUser.projects) : [];
    user.managerId = prismaUser.managerId;
    user.directReports = prismaUser.directReports ? JSON.parse(prismaUser.directReports) : [];
    user.mentorId = prismaUser.mentorId;
    user.leaderId = prismaUser.leaderId;
    user.directLeadership = prismaUser.directLeadership ? JSON.parse(prismaUser.directLeadership) : [];
    user.mentoringIds = prismaUser.mentoringIds ? JSON.parse(prismaUser.mentoringIds) : [];
    user.importBatchId = prismaUser.importBatchId;
    user.lastActivityAt = prismaUser.lastActivityAt;
    user.isActive = prismaUser.isActive;
    user.failedLoginAttempts = prismaUser.failedLoginAttempts;
    user.isLocked = prismaUser.isLocked;
    user.lockUntil = prismaUser.lockUntil;
    user.passwordResetCode = prismaUser.passwordResetCode;
    user.passwordResetCodeExpiresAt = prismaUser.passwordResetCodeExpiresAt;
    user.createdAt = prismaUser.createdAt;
    user.updatedAt = prismaUser.updatedAt;

    return user;
  }
}
