import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testToggleRequired() {
  console.log('🧪 Testando o toggle de obrigatoriedade dos critérios...\n');

  try {
    // Buscar um critério para testar
    const criteria = await prisma.criterion.findMany({
      take: 2,
      orderBy: { name: 'asc' },
    });

    if (criteria.length === 0) {
      console.log('❌ Nenhum critério encontrado para teste');
      return;
    }

    console.log('📋 Critérios disponíveis para teste:');
    criteria.forEach((criterion) => {
      console.log(`   - ${criterion.name} (${criterion.id})`);
      console.log(`     Obrigatório: ${criterion.isRequired ? '✅ Sim' : '❌ Não'}`);
      console.log('');
    });

    // Testar com o primeiro critério
    const testCriterion = criteria[0];
    const originalState = testCriterion.isRequired;

    console.log(`🔄 Testando toggle no critério: "${testCriterion.name}"`);
    console.log(`   Estado atual: ${originalState ? 'Obrigatório' : 'Opcional'}`);

    // Simular o que o endpoint faria
    const newState = !originalState;
    console.log(`   Novo estado: ${newState ? 'Obrigatório' : 'Opcional'}`);

    // Atualizar no banco (simulando o service)
    const updatedCriterion = await prisma.criterion.update({
      where: { id: testCriterion.id },
      data: {
        isRequired: newState,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Toggle realizado com sucesso!`);
    console.log(`   isRequired: ${originalState} → ${updatedCriterion.isRequired}`);

    // Reverter para o estado original
    await prisma.criterion.update({
      where: { id: testCriterion.id },
      data: {
        isRequired: originalState,
        updatedAt: new Date(),
      },
    });

    console.log(`🔄 Estado revertido para o original: ${originalState}`);

    console.log('\n🎉 Teste do toggle concluído com sucesso!');
    console.log('\n📡 Para testar via API:');
    console.log(`   PATCH http://localhost:3000/api/criteria/${testCriterion.id}/toggle-required`);
    console.log('   Authorization: Bearer <seu_token_jwt>');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testToggleRequired();
