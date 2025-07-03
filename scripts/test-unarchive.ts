import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUnarchivePDI() {
  try {
    console.log('🧪 Testando desarquivamento de PDI...');

    // Buscar todos os PDIs
    const pdis = await prisma.pDI.findMany({
      include: { actions: true }
    });

    console.log(`📊 Encontrados ${pdis.length} PDIs no total`);
    
    const archivedPDIs = pdis.filter(pdi => pdi.status === 'ARCHIVED');
    console.log(`📦 PDIs arquivados: ${archivedPDIs.length}`);

    if (archivedPDIs.length === 0) {
      // Criar um PDI arquivado para teste
      console.log('🔨 Criando PDI de teste...');
      
      const testPDI = await prisma.pDI.create({
        data: {
          collaboratorId: 'test-user',
          title: 'PDI Teste Desarquivamento',
          description: 'PDI criado para testar o desarquivamento',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ARCHIVED',
          actions: {
            create: [
              {
                title: 'Ação de Teste',
                description: 'Ação criada para teste',
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                priority: 'MEDIUM',
                status: 'TO_DO'
              }
            ]
          }
        },
        include: { actions: true }
      });

      console.log(`✅ PDI de teste criado: ${testPDI.id}`);
      
      // Testar desarquivamento
      console.log('🔄 Testando desarquivamento...');
      
      const unarchivedPDI = await prisma.pDI.update({
        where: { id: testPDI.id },
        data: { status: 'IN_PROGRESS' },
        include: { actions: true }
      });

      console.log(`✅ PDI desarquivado com sucesso!`);
      console.log(`📋 Status atual: ${unarchivedPDI.status}`);
      console.log(`📝 Título: ${unarchivedPDI.title}`);
      
      // Limpar teste
      await prisma.pDI.delete({ where: { id: testPDI.id } });
      console.log('🧹 PDI de teste removido');
      
    } else {
      // Testar com um PDI existente
      const testPDI = archivedPDIs[0];
      console.log(`🔄 Testando desarquivamento do PDI: ${testPDI.title}`);
      
      const unarchivedPDI = await prisma.pDI.update({
        where: { id: testPDI.id },
        data: { status: 'IN_PROGRESS' },
        include: { actions: true }
      });

      console.log(`✅ PDI desarquivado com sucesso!`);
      console.log(`📋 Status atual: ${unarchivedPDI.status}`);
      
      // Voltar para arquivado
      await prisma.pDI.update({
        where: { id: testPDI.id },
        data: { status: 'ARCHIVED' }
      });
      console.log('🔄 PDI retornado ao status arquivado');
    }

    console.log('🎉 Teste de desarquivamento concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste de desarquivamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testUnarchivePDI(); 