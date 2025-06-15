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
    await this.initializeDatabase();
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
        name: 'Ana Oliveira',
        email: 'ana.oliveira@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador']),
        isActive: true,
      },
      {
        name: 'Bruno Mendes',
        email: 'bruno.mendes@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador', 'gestor']),
        isActive: true,
      },
      {
        name: 'Carla Dias',
        email: 'carla.dias@rocketcorp.com',
        passwordHash: hashedPassword,
        roles: JSON.stringify(['colaborador', 'comite']),
        isActive: true,
      },
    ];

    for (const userData of users) {
      const user = await this.prisma.user.create({
        data: userData
      });
      console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
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
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: JSON.stringify(user.roles),
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
    user.id = prismaUser.id;
    user.name = prismaUser.name;
    user.email = prismaUser.email;
    user.passwordHash = prismaUser.passwordHash;
    user.roles = JSON.parse(prismaUser.roles);
    user.isActive = prismaUser.isActive;
    user.createdAt = prismaUser.createdAt;
    user.updatedAt = prismaUser.updatedAt;
    return user;
  }
} 