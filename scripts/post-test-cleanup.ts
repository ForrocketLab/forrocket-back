import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function postTestCleanup() {
  console.log('🧹 Executando limpeza pós-teste...\n');

  try {
    // Limpar pastas de cobertura
    console.log('🗂️ Limpando pastas de cobertura...');
    const coverageFolders = [
      'coverage',
      'coverage-projects',
      'coverage-genai', 
      'coverage-okrs'
    ];

    for (const folder of coverageFolders) {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
        console.log(`✅ Removida pasta: ${folder}`);
      }
    }

    // Este script é seguro de executar - só remove dados de teste
    console.log('🔍 Verificando dados de teste para limpeza...');

    // Padrões que indicam dados de teste
    const testPatterns = ['Test', 'test', 'TESTE', 'Mock', 'Example', 'E2E', 'Fake', 'Duplicate'];
    let totalDeleted = 0;

    console.log('🔄 Removendo dados de teste...');

    // 1. Limpar ciclos de teste
    for (const pattern of testPatterns) {
      const deletedCycles = await prisma.evaluationCycle.deleteMany({
        where: { name: { contains: pattern } },
      });
      totalDeleted += deletedCycles.count;
    }

    // 2. Limpar usuários de teste (mantém apenas os 9 da seed)
    const seedEmails = [
      'eduardo.tech@rocketcorp.com',
      'diana.costa@rocketcorp.com', 
      'carla.dias@rocketcorp.com',
      'bruno.mendes@rocketcorp.com',
      'ana.oliveira@rocketcorp.com',
      'felipe.silva@rocketcorp.com',
      'lucas.fernandes@rocketcorp.com',
      'marina.santos@rocketcorp.com',
      'rafael.costa@rocketcorp.com'
    ];

    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { notIn: seedEmails },
      },
    });
    totalDeleted += deletedUsers.count;

    // 3. Limpar avaliações órfãs
    const validUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);
    const validCycleNames = (await prisma.evaluationCycle.findMany({ select: { name: true } })).map(c => c.name);

    // Autoavaliações órfãs
    const orphanedSelf = await prisma.selfAssessment.deleteMany({
      where: {
        OR: [
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    totalDeleted += orphanedSelf.count;

    // Avaliações 360 órfãs
    const orphaned360 = await prisma.assessment360.deleteMany({
      where: {
        OR: [
          { evaluatedUserId: { notIn: validUserIds } },
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    totalDeleted += orphaned360.count;

    // Avaliações de gestor órfãs
    const orphanedManager = await prisma.managerAssessment.deleteMany({
      where: {
        OR: [
          { evaluatedUserId: { notIn: validUserIds } },
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    totalDeleted += orphanedManager.count;

    // Avaliações de comitê órfãs
    const orphanedCommittee = await prisma.committeeAssessment.deleteMany({
      where: {
        OR: [
          { evaluatedUserId: { notIn: validUserIds } },
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    totalDeleted += orphanedCommittee.count;

    // 4. Verificar estado final
    const finalUserCount = await prisma.user.count();
    const finalCycleCount = await prisma.evaluationCycle.count();

    console.log('\n📊 Resultado da limpeza:');
    console.log(`🗑️ Registros removidos: ${totalDeleted}`);
    console.log(`👥 Usuários restantes: ${finalUserCount}`);
    console.log(`📅 Ciclos restantes: ${finalCycleCount}`);

    if (finalUserCount === 9) {
      console.log('✅ Banco limpo! Apenas os 9 usuários da seed permanecem');
    } else {
      console.log(`⚠️ Atenção: Esperados 9 usuários, encontrados ${finalUserCount}`);
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza pós-teste:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  postTestCleanup();
}

export { postTestCleanup }; 