import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 Verificando status do banco de dados...\n');

  try {
    // Contagem de usuários
    const userCount = await prisma.user.count();
    console.log(`👥 Total de usuários: ${userCount}`);

    // Listar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('\n📋 Lista de usuários:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.isActive ? '✅ Ativo' : '❌ Inativo'}`);
      console.log(`     Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
    });

    // Contagem de outros registros
    const cycleCount = await prisma.evaluationCycle.count();
    const criteriaCount = await prisma.criterion.count();
    const projectCount = await prisma.project.count();
    const selfAssessmentCount = await prisma.selfAssessment.count();
    const assessment360Count = await prisma.assessment360.count();
    const managerAssessmentCount = await prisma.managerAssessment.count();
    const committeeAssessmentCount = await prisma.committeeAssessment.count();

    console.log('\n📊 Contadores de registros:');
    console.log(`📅 Ciclos de avaliação: ${cycleCount}`);
    console.log(`📋 Critérios: ${criteriaCount}`);
    console.log(`🏗️ Projetos: ${projectCount}`);
    console.log(`📝 Autoavaliações: ${selfAssessmentCount}`);
    console.log(`🔄 Avaliações 360: ${assessment360Count}`);
    console.log(`👔 Avaliações de gestor: ${managerAssessmentCount}`);
    console.log(`⚖️ Avaliações de comitê: ${committeeAssessmentCount}`);

    // Verificar dados de teste (baseado em padrões comuns)
    const testDataPatterns = ['Test', 'test', 'TESTE', 'Mock', 'Example'];
    let testDataFound = false;

    for (const pattern of testDataPatterns) {
      const testUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: pattern } },
            { email: { contains: pattern } },
          ],
        },
      });

      const testCycles = await prisma.evaluationCycle.findMany({
        where: { name: { contains: pattern } },
      });

      if (testUsers.length > 0 || testCycles.length > 0) {
        testDataFound = true;
        console.log(`\n⚠️ Dados de teste encontrados com padrão "${pattern}":`);
        if (testUsers.length > 0) {
          console.log(`   👥 Usuários de teste: ${testUsers.length}`);
          testUsers.forEach(user => {
            console.log(`      - ${user.name} (${user.email})`);
          });
        }
        if (testCycles.length > 0) {
          console.log(`   📅 Ciclos de teste: ${testCycles.length}`);
          testCycles.forEach(cycle => {
            console.log(`      - ${cycle.name}`);
          });
        }
      }
    }

    if (!testDataFound) {
      console.log('\n✅ Nenhum dado de teste óbvio encontrado');
    }

    // Verificar últimas criações
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentUsers.length > 0) {
      console.log('\n🕒 Usuários criados nas últimas 24 horas:');
      recentUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.createdAt.toLocaleString('pt-BR')}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus(); 