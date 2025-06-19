import { PrismaService } from '../src/database/prisma.service';
import { CriteriaService } from '../src/evaluations/criteria.service';

async function testNewCriteriaStructure() {
  const prisma = new PrismaService();
  const criteriaService = new CriteriaService(prisma);

  try {
    console.log('🚀 Testando nova estrutura de critérios...\n');

    // 1. Listar todos os critérios
    console.log('1️⃣ Listando todos os critérios:');
    const allCriteria = await criteriaService.findAll();
    console.log(`   📋 Total: ${allCriteria.length} critérios`);
    allCriteria.forEach((criterion) => {
      console.log(
        `   - ${criterion.name} (${criterion.isRequired ? '🔴 Obrigatório' : '🟡 Opcional'})`,
      );
    });

    // 2. Listar apenas critérios obrigatórios
    console.log('\n2️⃣ Listando apenas critérios obrigatórios:');
    const requiredCriteria = await criteriaService.findRequired();
    console.log(`   📋 Total: ${requiredCriteria.length} critérios obrigatórios`);
    requiredCriteria.forEach((criterion) => {
      console.log(`   - ${criterion.name}`);
    });

    // 3. Listar apenas critérios opcionais
    console.log('\n3️⃣ Listando apenas critérios opcionais:');
    const optionalCriteria = await criteriaService.findOptional();
    console.log(`   📋 Total: ${optionalCriteria.length} critérios opcionais`);
    optionalCriteria.forEach((criterion) => {
      console.log(`   - ${criterion.name}`);
    });

    // 4. Testar toggle de obrigatoriedade
    console.log('\n4️⃣ Testando toggle de obrigatoriedade...');

    // Testar toggle em um critério
    const criterionToToggle1 = 'gestao-resultados';
    try {
      const originalCriterion = await criteriaService.findOne(criterionToToggle1);
      const originalState = originalCriterion.isRequired;
      console.log(
        `   🔄 Critério "${originalCriterion.name}" está: ${originalState ? 'Obrigatório' : 'Opcional'}`,
      );

      const updatedCriterion = await criteriaService.toggleRequired(criterionToToggle1);
      console.log(
        `   ✅ Toggle realizado! Agora está: ${updatedCriterion.isRequired ? 'Obrigatório' : 'Opcional'}`,
      );

      // Reverter para o estado original
      await criteriaService.toggleRequired(criterionToToggle1);
      console.log(`   🔄 Estado revertido para: ${originalState ? 'Obrigatório' : 'Opcional'}`);
    } catch (error) {
      console.log(
        `   ❌ Erro ao testar toggle no critério "${criterionToToggle1}": ${error.message}`,
      );
    }

    // Testar toggle em outro critério
    const criterionToToggle2 = 'gestao-gente';
    try {
      const originalCriterion = await criteriaService.findOne(criterionToToggle2);
      const originalState = originalCriterion.isRequired;
      console.log(
        `   🔄 Critério "${originalCriterion.name}" está: ${originalState ? 'Obrigatório' : 'Opcional'}`,
      );

      const updatedCriterion = await criteriaService.toggleRequired(criterionToToggle2);
      console.log(
        `   ✅ Toggle realizado! Agora está: ${updatedCriterion.isRequired ? 'Obrigatório' : 'Opcional'}`,
      );

      // Reverter para o estado original
      await criteriaService.toggleRequired(criterionToToggle2);
      console.log(`   🔄 Estado revertido para: ${originalState ? 'Obrigatório' : 'Opcional'}`);
    } catch (error) {
      console.log(
        `   ❌ Erro ao testar toggle no critério "${criterionToToggle2}": ${error.message}`,
      );
    }

    // 5. Resumo final
    console.log('\n5️⃣ Resumo da nova estrutura:');
    const finalCriteria = await criteriaService.findAll();
    const finalRequired = finalCriteria.filter((c) => c.isRequired);
    const finalOptional = finalCriteria.filter((c) => !c.isRequired);

    console.log(`   📊 Total de critérios: ${finalCriteria.length}`);
    console.log(`   🔴 Obrigatórios: ${finalRequired.length}`);
    console.log(`   🟡 Opcionais: ${finalOptional.length}`);
    console.log('\n   ✨ Nova estrutura implementada com sucesso!');
    console.log('   💡 Todos os critérios sempre aparecem no formulário');
    console.log('   💡 A diferença é apenas entre obrigatórios e opcionais');
    console.log('   🔄 Use toggleRequired() para alternar a obrigatoriedade facilmente');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testNewCriteriaStructure();
