import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Serviço do Prisma para gerenciar conexões com o banco de dados
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
  async onModuleInit() {
    console.log('🔗 Conectando ao banco SQLite com Prisma...');
    await this.$connect();
    console.log('✅ Conexão com SQLite estabelecida!');
  }

  async onModuleDestroy() {
    console.log('🔌 Desconectando do banco SQLite...');
    await this.$disconnect();
  }
} 