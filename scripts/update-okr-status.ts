import { PrismaClient, OKRStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para atualizar o status dos OKRs existentes baseado no progresso
 */
async function updateOKRStatus() {
  console.log('🔄 Iniciando atualização do status dos OKRs...');

  try {
    // Buscar todos os OKRs com seus objetivos
    const okrs = await prisma.oKR.findMany({
      include: {
        objectives: true,
      },
    });

    console.log(`📊 Encontrados ${okrs.length} OKRs para processar`);

    let updatedCount = 0;

    for (const okr of okrs) {
      if (!okr.objectives.length) {
        console.log(`⚠️  OKR "${okr.title}" não tem objetivos, pulando...`);
        continue;
      }

      // Calcular progresso geral baseado nos objetivos
      let totalProgress = 0;
      okr.objectives.forEach(obj => {
        totalProgress += obj.progress;
      });

      const overallProgress = Math.round(totalProgress / okr.objectives.length);
      
      // Determinar status baseado no progresso
      let newStatus: OKRStatus = okr.status;
      
      if (overallProgress >= 100 && okr.status === OKRStatus.ACTIVE) {
        newStatus = OKRStatus.COMPLETED;
      } else if (overallProgress < 100 && okr.status === OKRStatus.COMPLETED) {
        newStatus = OKRStatus.ACTIVE;
      }

      // Só atualizar se houver mudança no status
      if (newStatus !== okr.status) {
        await prisma.oKR.update({
          where: { id: okr.id },
          data: { status: newStatus },
        });

        console.log(`✅ OKR "${okr.title}" atualizado: ${okr.status} → ${newStatus} (progresso: ${overallProgress}%)`);
        updatedCount++;
      } else {
        console.log(`✨ OKR "${okr.title}" já está com status correto: ${okr.status} (progresso: ${overallProgress}%)`);
      }
    }

    console.log(`\n🎉 Processo concluído! ${updatedCount} OKRs foram atualizados.`);

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
updateOKRStatus(); 