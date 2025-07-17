import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Iniciando seed de OKRs...');

  // Buscar usuários existentes
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });

  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado. Execute o seed principal primeiro.');
    return;
  }

  console.log(`📋 Encontrados ${users.length} usuários:`);
  users.forEach(user => console.log(`   - ${user.name} (${user.email})`));

  // Limpar OKRs existentes
  console.log('🧹 Limpando OKRs existentes...');
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.oKR.deleteMany();

  // Criar OKRs de exemplo
  console.log('🎯 Criando OKRs de exemplo...');

  // ==========================================
  // OKR 1: ACTIVE - Crescimento da Plataforma
  // ==========================================
  const okr1 = await prisma.oKR.create({
    data: {
      title: 'Crescimento da Plataforma Digital',
      description: 'Acelerar o crescimento da nossa plataforma digital através de melhorias na experiência do usuário e expansão de funcionalidades.',
      quarter: '2025-Q3',
      year: 2025,
      status: 'ACTIVE',
      userId: users[0].id,
      createdAt: new Date('2025-07-01'),
      updatedAt: new Date('2025-08-15'),
    },
  });

  // Objetivos para OKR 1
  const obj1_1 = await prisma.objective.create({
    data: {
      okrId: okr1.id,
      title: 'Aumentar a base de usuários ativos',
      description: 'Crescer a base de usuários ativos mensais da plataforma',
      status: 'IN_PROGRESS',
      progress: 65,
    },
  });

  // Key Results para Objetivo 1.1
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj1_1.id,
        title: 'Progresso em usuários ativos mensais',
        description: 'Meta de crescimento de usuários ativos na plataforma (50.000)',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 65, // 32.500 de 50.000 = 65%
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj1_1.id,
        title: 'Aumentar retenção de usuários',
        description: 'Melhorar a taxa de retenção de usuários em 30 dias',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 68,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  const obj1_2 = await prisma.objective.create({
    data: {
      okrId: okr1.id,
      title: 'Otimizar performance da aplicação',
      description: 'Melhorar a velocidade e responsividade da plataforma',
      status: 'IN_PROGRESS',
      progress: 80,
    },
  });

  // Key Results para Objetivo 1.2
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj1_2.id,
        title: 'Progresso na redução do tempo de carregamento',
        description: 'Otimizar performance das páginas principais (meta: 2s)',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 71, // 2.8s de 2s = ~71%
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj1_2.id,
        title: 'Progresso na implementação do cache distribuído',
        description: 'Implementar sistema de cache Redis',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100,
        unit: '%',
        status: 'COMPLETED',
      },
    ],
  });

  // ==========================================
  // OKR 2: COMPLETED - Modernização do Backend
  // ==========================================
  const okr2 = await prisma.oKR.create({
    data: {
      title: 'Modernização da Arquitetura Backend',
      description: 'Migrar nossa arquitetura para microserviços e implementar práticas DevOps modernas.',
      quarter: '2025-Q2',
      year: 2025,
      status: 'COMPLETED',
      userId: users[1]?.id || users[0].id,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-06-30'),
    },
  });

  // Objetivos para OKR 2
  const obj2_1 = await prisma.objective.create({
    data: {
      okrId: okr2.id,
      title: 'Migrar para arquitetura de microserviços',
      description: 'Dividir monolito em serviços independentes',
      status: 'COMPLETED',
      progress: 100,
    },
  });

  // Key Results para Objetivo 2.1
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj2_1.id,
        title: 'Progresso na implementação dos microserviços',
        description: 'Auth, Users, Orders, Products, Notifications (5 serviços)',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100, // 5 de 5 = 100%
        unit: '%',
        status: 'COMPLETED',
      },
      {
        objectiveId: obj2_1.id,
        title: 'Progresso na migração das funcionalidades',
        description: 'Migrar todas as funcionalidades do monolito',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100,
        unit: '%',
        status: 'COMPLETED',
      },
    ],
  });

  const obj2_2 = await prisma.objective.create({
    data: {
      okrId: okr2.id,
      title: 'Implementar CI/CD completo',
      description: 'Automatizar deploy e testes',
      status: 'COMPLETED',
      progress: 100,
    },
  });

  // Key Results para Objetivo 2.2
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj2_2.id,
        title: 'Progresso na implementação do CI/CD',
        description: 'Deploy automatizado em produção',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100,
        unit: '%',
        status: 'COMPLETED',
      },
      {
        objectiveId: obj2_2.id,
        title: 'Cobertura de testes',
        description: 'Testes automatizados cobrindo o código',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 94,
        unit: '%',
        status: 'COMPLETED',
      },
    ],
  });

  // ==========================================
  // OKR 3: PAUSED - Expansão Mobile
  // ==========================================
  const okr3 = await prisma.oKR.create({
    data: {
      title: 'Expansão para Plataformas Mobile',
      description: 'Desenvolver aplicativos nativos para iOS e Android para expandir nosso alcance.',
      quarter: '2025-Q3',
      year: 2025,
      status: 'PAUSED',
      userId: users[2]?.id || users[0].id,
      createdAt: new Date('2025-07-01'),
      updatedAt: new Date('2025-08-10'),
    },
  });

  // Objetivos para OKR 3
  const obj3_1 = await prisma.objective.create({
    data: {
      okrId: okr3.id,
      title: 'Desenvolver MVP dos aplicativos',
      description: 'Criar versão inicial dos apps iOS e Android',
      status: 'IN_PROGRESS',
      progress: 35,
    },
  });

  // Key Results para Objetivo 3.1
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj3_1.id,
        title: 'Progresso no desenvolvimento do app iOS',
        description: 'Publicar versão beta do app iOS',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'NOT_STARTED',
      },
      {
        objectiveId: obj3_1.id,
        title: 'Progresso no desenvolvimento do app Android',
        description: 'Publicar versão beta do app Android',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'NOT_STARTED',
      },
    ],
  });

  const obj3_2 = await prisma.objective.create({
    data: {
      okrId: okr3.id,
      title: 'Garantir qualidade dos aplicativos',
      description: 'Implementar testes e monitoramento',
      status: 'IN_PROGRESS',
      progress: 45,
    },
  });

  // Key Results para Objetivo 3.2
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj3_2.id,
        title: 'Progresso na implementação de testes',
        description: 'Testes unitários e de integração',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 45,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj3_2.id,
        title: 'Progresso na implementação do monitoramento',
        description: 'Monitoramento de crashes e performance',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 30,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  // ==========================================
  // OKR 4: CANCELLED - Integração ERP
  // ==========================================
  const okr4 = await prisma.oKR.create({
    data: {
      title: 'Integração com Sistema ERP Legacy',
      description: 'Integrar nossa plataforma com o sistema ERP existente da empresa.',
      quarter: '2025-Q3',
      year: 2025,
      status: 'CANCELLED',
      userId: users[3]?.id || users[0].id,
      createdAt: new Date('2025-07-01'),
      updatedAt: new Date('2025-07-25'),
    },
  });

  // Objetivos para OKR 4 (cancelado)
  const obj4_1 = await prisma.objective.create({
    data: {
      okrId: okr4.id,
      title: 'Desenvolver conectores de integração',
      description: 'Criar APIs de integração com ERP',
      status: 'NOT_STARTED',
      progress: 0,
    },
  });

  // Key Results para Objetivo 4.1
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj4_1.id,
        title: 'Conector para módulo financeiro',
        description: 'Integração com dados financeiros do ERP',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'CANCELLED',
      },
      {
        objectiveId: obj4_1.id,
        title: 'Sincronização de dados em tempo real',
        description: 'Implementar sync bidirecional',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'CANCELLED',
      },
    ],
  });

  // ==========================================
  // OKR 5: ACTIVE - Melhoria da Experiência do Cliente
  // ==========================================
  const okr5 = await prisma.oKR.create({
    data: {
      title: 'Transformação da Experiência do Cliente',
      description: 'Revolucionar a jornada do cliente através de design centrado no usuário e automação inteligente.',
      quarter: '2025-Q4',
      year: 2025,
      status: 'ACTIVE',
      userId: users[0].id,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-11-15'),
    },
  });

  // Objetivos para OKR 5
  const obj5_1 = await prisma.objective.create({
    data: {
      okrId: okr5.id,
      title: 'Implementar sistema de feedback inteligente',
      description: 'Sistema automatizado de coleta e análise de feedback',
      status: 'IN_PROGRESS',
      progress: 25,
    },
  });

  // Key Results para Objetivo 5.1
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj5_1.id,
        title: 'NPS acima de 70 pontos',
        description: 'Melhorar satisfação do cliente',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 58,
        unit: 'pontos',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj5_1.id,
        title: 'Reduzir tempo de resposta',
        description: 'Melhorar tempo de resposta do suporte',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 6,
        unit: 'horas',
        status: 'IN_PROGRESS',
      },
    ],
  });

  const obj5_2 = await prisma.objective.create({
    data: {
      okrId: okr5.id,
      title: 'Automatizar processos de onboarding',
      description: 'Criar jornada automatizada para novos clientes',
      status: 'NOT_STARTED',
      progress: 0,
    },
  });

  // Key Results para Objetivo 5.2
  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj5_2.id,
        title: 'Implementar fluxo de onboarding automatizado',
        description: 'Jornada guiada para novos usuários',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'NOT_STARTED',
      },
      {
        objectiveId: obj5_2.id,
        title: 'Taxa de ativação',
        description: 'Usuários que completam o onboarding',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 45,
        unit: '%',
        status: 'NOT_STARTED',
      },
    ],
  });

  console.log('✅ Seed de OKRs concluído com sucesso!');
  console.log('');
  console.log('📊 Resumo dos OKRs criados:');
  console.log('   🟢 2 OKRs ATIVOS');
  console.log('   ✅ 1 OKR CONCLUÍDO');
  console.log('   ⏸️ 1 OKR PAUSADO');
  console.log('   ❌ 1 OKR CANCELADO');
  console.log('');
  console.log('🎯 Total: 5 OKRs, 8 Objetivos, 18 Key Results');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 