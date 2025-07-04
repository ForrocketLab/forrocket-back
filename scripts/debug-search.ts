import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSearch() {
  try {
    console.log('🔍 Iniciando debug da busca...');
    
    // Verificar se há usuários no banco
    const userCount = await prisma.user.count();
    console.log(`👥 Total de usuários no banco: ${userCount}`);
    
    // Verificar se há ciclo ativo
    const activeCycle = await prisma.evaluationCycle.findFirst({
      where: { status: 'OPEN' },
    });
    console.log(`🔄 Ciclo ativo encontrado: ${activeCycle ? activeCycle.name : 'NENHUM'}`);
    
    // Listar alguns usuários para debug
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        businessUnit: true,
        seniority: true,
        careerTrack: true,
        roles: true,
        isActive: true,
      },
    });
    
    console.log('\n📋 Primeiros 5 usuários:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Cargo: ${user.jobTitle}`);
      console.log(`   Área: ${user.businessUnit}`);
      console.log(`   Senioridade: ${user.seniority}`);
      console.log(`   Trilha: ${user.careerTrack}`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   Ativo: ${user.isActive}`);
      console.log('');
    });
    
    // Testar uma busca simples
    console.log('🔍 Testando busca simples por nome "ana"...');
    const searchResult = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'ana' } },
          { email: { contains: 'ana' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
      },
    });
    
    console.log(`📊 Resultado da busca por "ana": ${searchResult.length} usuários encontrados`);
    searchResult.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.jobTitle}`);
    });
    
    // Testar busca por cargo
    console.log('\n🔍 Testando busca por cargo "desenvolvedor"...');
    const jobTitleResult = await prisma.user.findMany({
      where: {
        jobTitle: { contains: 'desenvolvedor' },
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
      },
    });
    
    console.log(`📊 Resultado da busca por cargo "desenvolvedor": ${jobTitleResult.length} usuários encontrados`);
    jobTitleResult.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.jobTitle}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSearch(); 