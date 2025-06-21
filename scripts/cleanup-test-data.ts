import { PrismaService } from '../src/database/prisma.service';

async function main() {
  const prisma = new PrismaService();

  try {
    console.log('🧹 Iniciando limpeza de dados de teste...');

    // ==========================================
    // LIMPEZA DE CICLOS DE TESTE
    // ==========================================
    console.log('\n🔄 Limpando ciclos de teste...');
    
    // Manter apenas os 3 ciclos principais da seed
    const mainCycles = ['2024.2', '2025.1', '2025.2'];
    
    // Buscar todos os ciclos
    const allCycles = await prisma.evaluationCycle.findMany();
    console.log(`   📊 Total de ciclos encontrados: ${allCycles.length}`);
    
    // Identificar ciclos de teste (que não são os principais)
    const testCycles = allCycles.filter(cycle => !mainCycles.includes(cycle.id));
    
    if (testCycles.length > 0) {
      console.log(`   🗑️ Removendo ${testCycles.length} ciclos de teste:`);
      for (const cycle of testCycles) {
        console.log(`      - ${cycle.name} (${cycle.id})`);
      }
      
      // Remover ciclos de teste
      const deletedCycles = await prisma.evaluationCycle.deleteMany({
        where: {
          id: {
            notIn: mainCycles
          }
        }
      });
      
      console.log(`   ✅ ${deletedCycles.count} ciclos de teste removidos`);
    } else {
      console.log('   ✅ Nenhum ciclo de teste encontrado');
    }

    // ==========================================
    // LIMPEZA DE USUÁRIOS DE TESTE
    // ==========================================
    console.log('\n👥 Limpando usuários de teste...');
    
    // Manter apenas os 6 usuários principais da seed
    const mainUsers = [
      'eduardo.tech@rocketcorp.com',
      'diana.costa@rocketcorp.com', 
      'carla.dias@rocketcorp.com',
      'bruno.mendes@rocketcorp.com',
      'ana.oliveira@rocketcorp.com',
      'felipe.silva@rocketcorp.com'
    ];

    // Buscar usuários de teste
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          notIn: mainUsers
        }
      }
    });

    if (testUsers.length > 0) {
      console.log(`   🗑️ Removendo ${testUsers.length} usuários de teste:`);
      for (const user of testUsers) {
        console.log(`      - ${user.name} (${user.email})`);
      }

      // Limpar relacionamentos primeiro
      await prisma.userProjectRole.deleteMany({
        where: {
          userId: {
            in: testUsers.map(u => u.id)
          }
        }
      });

      await prisma.userProjectAssignment.deleteMany({
        where: {
          userId: {
            in: testUsers.map(u => u.id)
          }
        }
      });

      await prisma.userRoleAssignment.deleteMany({
        where: {
          userId: {
            in: testUsers.map(u => u.id)
          }
        }
      });

      // Remover usuários de teste
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          email: {
            notIn: mainUsers
          }
        }
      });

      console.log(`   ✅ ${deletedUsers.count} usuários de teste removidos`);
    } else {
      console.log('   ✅ Nenhum usuário de teste encontrado');
    }

    // ==========================================
    // LIMPEZA DE PROJETOS DE TESTE
    // ==========================================
    console.log('\n🏗️ Limpando projetos de teste...');
    
    // Manter apenas os 6 projetos principais da seed
    const mainProjects = [
      'projeto-alpha',
      'projeto-beta', 
      'projeto-gamma',
      'projeto-delta',
      'projeto-mobile-app',
      'projeto-api-core'
    ];

    const testProjects = await prisma.project.findMany({
      where: {
        id: {
          notIn: mainProjects
        }
      }
    });

    if (testProjects.length > 0) {
      console.log(`   🗑️ Removendo ${testProjects.length} projetos de teste:`);
      for (const project of testProjects) {
        console.log(`      - ${project.name} (${project.id})`);
      }

      // Limpar relacionamentos primeiro
      await prisma.userProjectRole.deleteMany({
        where: {
          projectId: {
            in: testProjects.map(p => p.id)
          }
        }
      });

      await prisma.userProjectAssignment.deleteMany({
        where: {
          projectId: {
            in: testProjects.map(p => p.id)
          }
        }
      });

      // Remover projetos de teste
      const deletedProjects = await prisma.project.deleteMany({
        where: {
          id: {
            notIn: mainProjects
          }
        }
      });

      console.log(`   ✅ ${deletedProjects.count} projetos de teste removidos`);
    } else {
      console.log('   ✅ Nenhum projeto de teste encontrado');
    }

    // ==========================================
    // LIMPEZA DE AVALIAÇÕES ÓRFÃS
    // ==========================================
    console.log('\n📝 Limpando avaliações órfãs...');
    
    // Buscar usuários válidos
    const validUsers = await prisma.user.findMany({
      where: {
        email: {
          in: mainUsers
        }
      }
    });
    
    const validUserIds = validUsers.map(u => u.id);

    // Limpar avaliações de usuários que não existem mais
    const deletedSelfAssessments = await prisma.selfAssessment.deleteMany({
      where: {
        authorId: {
          notIn: validUserIds
        }
      }
    });

    const deletedAssessments360 = await prisma.assessment360.deleteMany({
      where: {
        OR: [
          { authorId: { notIn: validUserIds } },
          { evaluatedUserId: { notIn: validUserIds } }
        ]
      }
    });

    const deletedManagerAssessments = await prisma.managerAssessment.deleteMany({
      where: {
        OR: [
          { authorId: { notIn: validUserIds } },
          { evaluatedUserId: { notIn: validUserIds } }
        ]
      }
    });

    const deletedMentoringAssessments = await prisma.mentoringAssessment.deleteMany({
      where: {
        OR: [
          { authorId: { notIn: validUserIds } },
          { mentorId: { notIn: validUserIds } }
        ]
      }
    });

    const deletedReferenceFeedbacks = await prisma.referenceFeedback.deleteMany({
      where: {
        OR: [
          { authorId: { notIn: validUserIds } },
          { referencedUserId: { notIn: validUserIds } }
        ]
      }
    });

    const totalDeletedAssessments = 
      deletedSelfAssessments.count + 
      deletedAssessments360.count + 
      deletedManagerAssessments.count + 
      deletedMentoringAssessments.count + 
      deletedReferenceFeedbacks.count;

    if (totalDeletedAssessments > 0) {
      console.log(`   ✅ ${totalDeletedAssessments} avaliações órfãs removidas`);
    } else {
      console.log('   ✅ Nenhuma avaliação órfã encontrada');
    }

    // ==========================================
    // VERIFICAÇÃO FINAL
    // ==========================================
    console.log('\n📊 Estado final do banco:');
    
    const finalUsers = await prisma.user.count();
    const finalCycles = await prisma.evaluationCycle.count();
    const finalProjects = await prisma.project.count();
    
    console.log(`👥 Usuários restantes: ${finalUsers}`);
    console.log(`📅 Ciclos restantes: ${finalCycles}`);
    console.log(`🏗️ Projetos restantes: ${finalProjects}`);

    // Verificar se há dados de teste restantes
    const remainingTestUsers = await prisma.user.count({
      where: {
        email: {
          notIn: mainUsers
        }
      }
    });

    const remainingTestCycles = await prisma.evaluationCycle.count({
      where: {
        id: {
          notIn: mainCycles
        }
      }
    });

    if (remainingTestUsers === 0 && remainingTestCycles === 0) {
      console.log('\n✅ Nenhum dado de teste encontrado para remover');
    } else {
      console.log(`\n⚠️ Ainda há ${remainingTestUsers} usuários e ${remainingTestCycles} ciclos de teste restantes`);
    }

    // Mostrar usuários finais
    const finalUsersList = await prisma.user.findMany({
      select: { name: true, email: true },
      orderBy: { name: 'asc' }
    });

    console.log('\n👥 Usuários finais no banco:');
    finalUsersList.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
    });

    // Mostrar ciclos finais
    const finalCyclesList = await prisma.evaluationCycle.findMany({
      select: { id: true, name: true, status: true, phase: true },
      orderBy: { name: 'asc' }
    });

    console.log('\n📅 Ciclos finais no banco:');
    finalCyclesList.forEach((cycle, index) => {
      console.log(`  ${index + 1}. ${cycle.name} (${cycle.id}) - ${cycle.status}/${cycle.phase}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 