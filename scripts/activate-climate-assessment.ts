import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateClimateAssessment() {
  try {
    console.log('🔧 Ativando avaliação de clima organizacional...');

    // Buscar um usuário RH para ser o ativador
    const rhUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'RH'
        }
      }
    });

    if (!rhUser) {
      console.log('❌ Nenhum usuário RH encontrado. Criando configuração sem ativador...');
    }

    // Buscar ciclo ativo
    const activeCycle = await prisma.evaluationCycle.findFirst({
      where: {
        status: 'OPEN'
      }
    });

    if (!activeCycle) {
      console.log('❌ Nenhum ciclo ativo encontrado. Criando configuração para ciclo padrão...');
    }

    const cycleName = activeCycle?.name || '2025.1';

    // Criar ou atualizar configuração
    const config = await prisma.climateAssessmentConfig.upsert({
      where: {
        cycle: cycleName
      },
      update: {
        isActive: true,
        deactivatedAt: null
      },
      create: {
        cycle: cycleName,
        isActive: true,
        activatedBy: rhUser?.id || 'system',
        activatedAt: new Date()
      }
    });

    console.log('✅ Avaliação de clima organizacional ativada com sucesso!');
    console.log('📊 Configuração:', {
      id: config.id,
      cycle: config.cycle,
      isActive: config.isActive,
      activatedAt: config.activatedAt
    });

  } catch (error) {
    console.error('❌ Erro ao ativar avaliação de clima:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateClimateAssessment(); 