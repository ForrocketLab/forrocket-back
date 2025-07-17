import { PrismaService } from '../src/database/prisma.service';
import { seedCriteria } from '../src/evaluations/seeds/criteria.seed';

async function main() {
  const prisma = new PrismaService();

  try {
    await seedCriteria(prisma);
    console.log('✅ Seed de critérios executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed dos critérios:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
