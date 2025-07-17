import { PrismaService } from '../src/database/prisma.service';

async function main() {
  const prisma = new PrismaService();

  try {
    console.log('🔍 Verificando ciclos de avaliação...\n');

    const cycles = await prisma.evaluationCycle.findMany({
      orderBy: { name: 'asc' }
    });

    cycles.forEach(cycle => {
      console.log(`📅 Ciclo: ${cycle.name} (ID: ${cycle.id})`);
      console.log(`   Status: ${cycle.status}`);
      console.log(`   Fase: ${cycle.phase}`);
      console.log(`   Início: ${cycle.startDate?.toISOString()}`);
      console.log(`   Fim: ${cycle.endDate?.toISOString()}`);
      console.log(`   Assessment Deadline: ${cycle.assessmentDeadline?.toISOString()}`);
      console.log(`   Manager Deadline: ${cycle.managerDeadline?.toISOString()}`);
      console.log(`   Equalization Deadline: ${cycle.equalizationDeadline?.toISOString()}`);
      console.log('');
    });

    console.log(`✅ Total de ciclos: ${cycles.length}`);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 