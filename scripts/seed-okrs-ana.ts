import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Criando OKRs para Ana Beatriz...');

  // Buscar a Ana
  const ana = await prisma.user.findUnique({
    where: { email: 'ana.oliveira@rocketcorp.com' },
    select: { id: true, name: true, email: true }
  });

  if (!ana) {
    console.log('❌ Ana não encontrada no banco de dados.');
    return;
  }

  console.log(`👩‍💻 Criando OKRs para: ${ana.name} (${ana.email})`);

  // ==========================================
  // OKR 1: ACTIVE - Desenvolvimento Frontend
  // ==========================================
  const okr1 = await prisma.oKR.create({
    data: {
      title: 'Excelência em Desenvolvimento Frontend',
      description: 'Aprimorar habilidades técnicas e entregar interfaces de alta qualidade com foco na experiência do usuário.',
      quarter: '2025-Q3',
      year: 2025,
      status: 'ACTIVE',
      userId: ana.id,
      createdAt: new Date('2025-07-15'),
      updatedAt: new Date('2025-08-20'),
    },
  });

  // Objetivos para OKR 1
  const obj1_1 = await prisma.objective.create({
    data: {
      okrId: okr1.id,
      title: 'Dominar React avançado e Next.js',
      description: 'Aprofundar conhecimentos em React e frameworks modernos',
      status: 'IN_PROGRESS',
      progress: 75,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj1_1.id,
        title: 'Progresso em projetos com Next.js',
        description: 'Implementar projetos usando Next.js 14+ com App Router',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 67,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj1_1.id,
        title: 'Progresso em componentes reutilizáveis',
        description: 'Criar biblioteca de componentes para o design system',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 80,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  const obj1_2 = await prisma.objective.create({
    data: {
      okrId: okr1.id,
      title: 'Otimizar performance das aplicações',
      description: 'Melhorar métricas de performance e acessibilidade',
      status: 'IN_PROGRESS',
      progress: 60,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj1_2.id,
        title: 'Progresso no Lighthouse Score',
        description: 'Otimizar performance das páginas principais',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 93,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj1_2.id,
        title: 'Progresso na redução do bundle size',
        description: 'Otimizar tamanho dos bundles JavaScript',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 60,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  // ==========================================
  // OKR 2: COMPLETED - Capacitação em UX/UI
  // ==========================================
  const okr2 = await prisma.oKR.create({
    data: {
      title: 'Capacitação em UX/UI Design',
      description: 'Desenvolver habilidades em design de interface e experiência do usuário para criar produtos mais intuitivos.',
      quarter: '2025-Q2',
      year: 2025,
      status: 'COMPLETED',
      userId: ana.id,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-06-30'),
    },
  });

  const obj2_1 = await prisma.objective.create({
    data: {
      okrId: okr2.id,
      title: 'Concluir curso de UX Design',
      description: 'Finalizar certificação em UX Design',
      status: 'COMPLETED',
      progress: 100,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj2_1.id,
        title: 'Progresso no Google UX Design Certificate',
        description: 'Completar certificação do Google em UX Design',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100,
        unit: '%',
        status: 'COMPLETED',
      },
      {
        objectiveId: obj2_1.id,
        title: 'Progresso em protótipos interativos',
        description: 'Desenvolver protótipos usando Figma',
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
      title: 'Aplicar conhecimentos em projetos reais',
      description: 'Implementar melhorias de UX nos projetos atuais',
      status: 'COMPLETED',
      progress: 100,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj2_2.id,
        title: 'Progresso no redesign de interfaces',
        description: 'Melhorar UX das telas de login e dashboard',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100,
        unit: '%',
        status: 'COMPLETED',
      },
      {
        objectiveId: obj2_2.id,
        title: 'Progresso na satisfação do usuário',
        description: 'Melhorar score de satisfação através de pesquisas',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 100,
        unit: '%',
        status: 'COMPLETED',
      },
    ],
  });

  // ==========================================
  // OKR 3: ACTIVE - Liderança Técnica
  // ==========================================
  const okr3 = await prisma.oKR.create({
    data: {
      title: 'Desenvolvimento de Liderança Técnica',
      description: 'Crescer como referência técnica na equipe e desenvolver habilidades de mentoria e liderança.',
      quarter: '2025-Q4',
      year: 2025,
      status: 'ACTIVE',
      userId: ana.id,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-11-20'),
    },
  });

  const obj3_1 = await prisma.objective.create({
    data: {
      okrId: okr3.id,
      title: 'Mentorar desenvolvedores júniores',
      description: 'Guiar e apoiar o crescimento de desenvolvedores iniciantes',
      status: 'IN_PROGRESS',
      progress: 40,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj3_1.id,
        title: 'Progresso na mentoria de desenvolvedores',
        description: 'Acompanhar desenvolvimento de profissionais',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 50,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj3_1.id,
        title: 'Progresso em sessões de code review',
        description: 'Revisar código e dar feedback construtivo',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 38,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  const obj3_2 = await prisma.objective.create({
    data: {
      okrId: okr3.id,
      title: 'Liderar iniciativas técnicas',
      description: 'Tomar frente em projetos e decisões técnicas',
      status: 'IN_PROGRESS',
      progress: 45,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj3_2.id,
        title: 'Progresso em documentação técnica',
        description: 'Criar e manter documentação de arquitetura',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 45,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj3_2.id,
        title: 'Progresso em decisões de arquitetura',
        description: 'Liderar decisões técnicas importantes',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 40,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  // ==========================================
  // OKR 4: PAUSED - Contribuição Open Source
  // ==========================================
  const okr4 = await prisma.oKR.create({
    data: {
      title: 'Contribuição para Projetos Open Source',
      description: 'Contribuir ativamente para a comunidade open source e construir portfólio público.',
      quarter: '2025-Q3',
      year: 2025,
      status: 'PAUSED',
      userId: ana.id,
      createdAt: new Date('2025-07-01'),
      updatedAt: new Date('2025-08-05'),
    },
  });

  const obj4_1 = await prisma.objective.create({
    data: {
      okrId: okr4.id,
      title: 'Contribuir para bibliotecas React',
      description: 'Fazer contribuições significativas para projetos React',
      status: 'IN_PROGRESS',
      progress: 25,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj4_1.id,
        title: 'Progresso em pull requests aceitas',
        description: 'Contribuições aceitas em projetos open source',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 20,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj4_1.id,
        title: 'Progresso na biblioteca própria',
        description: 'Desenvolver e publicar biblioteca útil',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 15,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  // ==========================================
  // OKR 5: ACTIVE - Desenvolvimento Pessoal
  // ==========================================
  const okr5 = await prisma.oKR.create({
    data: {
      title: 'Crescimento Pessoal e Profissional',
      description: 'Investir no desenvolvimento pessoal, networking e equilíbrio vida-trabalho.',
      quarter: '2025-Q4',
      year: 2025,
      status: 'ACTIVE',
      userId: ana.id,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-11-18'),
    },
  });

  const obj5_1 = await prisma.objective.create({
    data: {
      okrId: okr5.id,
      title: 'Expandir rede profissional',
      description: 'Conhecer profissionais da área e trocar experiências',
      status: 'IN_PROGRESS',
      progress: 55,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj5_1.id,
        title: 'Progresso em eventos de tecnologia',
        description: 'Participar de conferências, meetups e workshops',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 50,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj5_1.id,
        title: 'Progresso no networking no LinkedIn',
        description: 'Expandir network profissional',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 60,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  const obj5_2 = await prisma.objective.create({
    data: {
      okrId: okr5.id,
      title: 'Manter equilíbrio vida-trabalho',
      description: 'Cuidar da saúde física e mental',
      status: 'IN_PROGRESS',
      progress: 70,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj5_2.id,
        title: 'Progresso em exercícios regulares',
        description: 'Manter rotina de atividade física',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 75,
        unit: '%',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj5_2.id,
        title: 'Progresso na leitura anual',
        description: 'Leitura técnica e desenvolvimento pessoal',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 67,
        unit: '%',
        status: 'IN_PROGRESS',
      },
    ],
  });

  // ==========================================
  // OKR 6: CANCELLED - Especialização em Mobile
  // ==========================================
  const okr6 = await prisma.oKR.create({
    data: {
      title: 'Especialização em Desenvolvimento Mobile',
      description: 'Desenvolver expertise em React Native para expandir possibilidades de carreira.',
      quarter: '2025-Q3',
      year: 2025,
      status: 'CANCELLED',
      userId: ana.id,
      createdAt: new Date('2025-07-01'),
      updatedAt: new Date('2025-07-20'),
    },
  });

  const obj6_1 = await prisma.objective.create({
    data: {
      okrId: okr6.id,
      title: 'Aprender React Native',
      description: 'Desenvolver habilidades em desenvolvimento mobile',
      status: 'NOT_STARTED',
      progress: 0,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj6_1.id,
        title: 'Progresso no curso de React Native',
        description: 'Certificação em desenvolvimento mobile',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'CANCELLED',
      },
      {
        objectiveId: obj6_1.id,
        title: 'Progresso em apps mobile',
        description: 'Criar aplicativos para iOS e Android',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        status: 'CANCELLED',
      },
    ],
  });

  console.log('✅ OKRs da Ana criados com sucesso!');
  console.log('');
  console.log('📊 Resumo dos OKRs da Ana:');
  console.log('   🟢 3 OKRs ATIVOS');
  console.log('   ✅ 1 OKR CONCLUÍDO');
  console.log('   ⏸️ 1 OKR PAUSADO');
  console.log('   ❌ 1 OKR CANCELADO');
  console.log('');
  console.log('🎯 Total para Ana: 6 OKRs, 12 Objetivos, 24 Key Results');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 