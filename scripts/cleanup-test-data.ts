import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('🧹 Iniciando limpeza de dados de teste...\n');

  try {
    // Padrões que indicam dados de teste
    const testPatterns = ['Test', 'test', 'TESTE', 'Mock', 'Example', 'E2E', 'Fake'];
    let totalDeleted = 0;

    // 1. Limpar ciclos de teste
    console.log('🔄 Limpando ciclos de teste...');
    for (const pattern of testPatterns) {
      const deletedCycles = await prisma.evaluationCycle.deleteMany({
        where: {
          name: { contains: pattern },
        },
      });
      if (deletedCycles.count > 0) {
        console.log(`   ✅ Removidos ${deletedCycles.count} ciclos com padrão "${pattern}"`);
        totalDeleted += deletedCycles.count;
      }
    }

    // 2. Limpar usuários de teste
    console.log('👥 Limpando usuários de teste...');
    for (const pattern of testPatterns) {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          OR: [
            { name: { contains: pattern } },
            { email: { contains: pattern } },
          ],
        },
      });
      if (deletedUsers.count > 0) {
        console.log(`   ✅ Removidos ${deletedUsers.count} usuários com padrão "${pattern}"`);
        totalDeleted += deletedUsers.count;
      }
    }

    // 3. Limpar projetos de teste
    console.log('🏗️ Limpando projetos de teste...');
    for (const pattern of testPatterns) {
      const deletedProjects = await prisma.project.deleteMany({
        where: {
          OR: [
            { name: { contains: pattern } },
            { description: { contains: pattern } },
          ],
        },
      });
      if (deletedProjects.count > 0) {
        console.log(`   ✅ Removidos ${deletedProjects.count} projetos com padrão "${pattern}"`);
        totalDeleted += deletedProjects.count;
      }
    }

    // 4. Limpar avaliações órfãs (sem ciclo ou usuário válido)
    console.log('📝 Limpando avaliações órfãs...');
    
    // Buscar IDs de usuários e ciclos válidos
    const validUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);
    const validCycleNames = (await prisma.evaluationCycle.findMany({ select: { name: true } })).map(c => c.name);

    // Limpar autoavaliações órfãs
    const orphanedSelfAssessments = await prisma.selfAssessment.deleteMany({
      where: {
        OR: [
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    if (orphanedSelfAssessments.count > 0) {
      console.log(`   ✅ Removidas ${orphanedSelfAssessments.count} autoavaliações órfãs`);
      totalDeleted += orphanedSelfAssessments.count;
    }

    // Limpar avaliações 360 órfãs
    const orphanedAssessment360 = await prisma.assessment360.deleteMany({
      where: {
        OR: [
          { evaluatedUserId: { notIn: validUserIds } },
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    if (orphanedAssessment360.count > 0) {
      console.log(`   ✅ Removidas ${orphanedAssessment360.count} avaliações 360 órfãs`);
      totalDeleted += orphanedAssessment360.count;
    }

    // Limpar avaliações de gestor órfãs
    const orphanedManagerAssessments = await prisma.managerAssessment.deleteMany({
      where: {
        OR: [
          { evaluatedUserId: { notIn: validUserIds } },
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    if (orphanedManagerAssessments.count > 0) {
      console.log(`   ✅ Removidas ${orphanedManagerAssessments.count} avaliações de gestor órfãs`);
      totalDeleted += orphanedManagerAssessments.count;
    }

    // Limpar avaliações de comitê órfãs
    const orphanedCommitteeAssessments = await prisma.committeeAssessment.deleteMany({
      where: {
        OR: [
          { evaluatedUserId: { notIn: validUserIds } },
          { authorId: { notIn: validUserIds } },
          { cycle: { notIn: validCycleNames } },
        ],
      },
    });
    if (orphanedCommitteeAssessments.count > 0) {
      console.log(`   ✅ Removidas ${orphanedCommitteeAssessments.count} avaliações de comitê órfãs`);
      totalDeleted += orphanedCommitteeAssessments.count;
    }

    // 5. Verificar estado final
    console.log('\n📊 Estado final do banco:');
    const finalUserCount = await prisma.user.count();
    const finalCycleCount = await prisma.evaluationCycle.count();
    const finalProjectCount = await prisma.project.count();
    
    console.log(`👥 Usuários restantes: ${finalUserCount}`);
    console.log(`📅 Ciclos restantes: ${finalCycleCount}`);
    console.log(`🏗️ Projetos restantes: ${finalProjectCount}`);

    if (totalDeleted > 0) {
      console.log(`\n✅ Limpeza concluída! Total de registros removidos: ${totalDeleted}`);
    } else {
      console.log('\n✅ Nenhum dado de teste encontrado para remover');
    }

    // Listar usuários finais
    const finalUsers = await prisma.user.findMany({
      select: { name: true, email: true },
      orderBy: { name: 'asc' },
    });

    console.log('\n👥 Usuários finais no banco:');
    finalUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData(); 