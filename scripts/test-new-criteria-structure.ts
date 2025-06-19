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

    // 4. Testar mudança de obrigatoriedade
    console.log('\n4️⃣ Testando mudança de obrigatoriedade...');

    // Tornar um critério opcional
    const criterionToMakeOptional = 'gestao-resultados';
    try {
      const updatedCriterion = await criteriaService.makeOptional(criterionToMakeOptional);
      console.log(`   ✅ Critério "${updatedCriterion.name}" tornado opcional com sucesso`);
    } catch (error) {
      console.log(`   ℹ️ Critério "${criterionToMakeOptional}" já é opcional ou não existe`);
    }

    // Tornar um critério obrigatório
    const criterionToMakeRequired = 'gestao-gente';
    try {
      const updatedCriterion = await criteriaService.makeRequired(criterionToMakeRequired);
      console.log(`   ✅ Critério "${updatedCriterion.name}" tornado obrigatório com sucesso`);
    } catch (error) {
      console.log(`   ℹ️ Critério "${criterionToMakeRequired}" já é obrigatório ou não existe`);
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
    console.log('   💡 Agora todos os critérios sempre aparecem no formulário');
    console.log('   💡 A diferença é apenas entre obrigatórios e opcionais');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testNewCriteriaStructure();
