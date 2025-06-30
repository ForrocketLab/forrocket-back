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
        title: 'Completar 3 projetos com Next.js',
        description: 'Implementar projetos usando Next.js 14+ com App Router',
        type: 'NUMBER',
        targetValue: 3,
        currentValue: 2,
        unit: 'projetos',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj1_1.id,
        title: 'Implementar 5 componentes reutilizáveis',
        description: 'Criar biblioteca de componentes para o design system',
        type: 'NUMBER',
        targetValue: 5,
        currentValue: 4,
        unit: 'componentes',
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
        title: 'Lighthouse Score acima de 95',
        description: 'Otimizar performance das páginas principais',
        type: 'NUMBER',
        targetValue: 95,
        currentValue: 88,
        unit: 'pontos',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj1_2.id,
        title: 'Reduzir bundle size em 30%',
        description: 'Otimizar tamanho dos bundles JavaScript',
        type: 'PERCENTAGE',
        targetValue: 30,
        currentValue: 18,
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
        title: 'Google UX Design Certificate',
        description: 'Completar certificação do Google em UX Design',
        type: 'BINARY',
        targetValue: 1,
        currentValue: 1,
        status: 'COMPLETED',
      },
      {
        objectiveId: obj2_1.id,
        title: 'Criar 3 protótipos interativos',
        description: 'Desenvolver protótipos usando Figma',
        type: 'NUMBER',
        targetValue: 3,
        currentValue: 3,
        unit: 'protótipos',
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
        title: 'Redesign de 2 interfaces principais',
        description: 'Melhorar UX das telas de login e dashboard',
        type: 'NUMBER',
        targetValue: 2,
        currentValue: 2,
        unit: 'interfaces',
        status: 'COMPLETED',
      },
      {
        objectiveId: obj2_2.id,
        title: 'Aumentar satisfação do usuário para 85%',
        description: 'Melhorar score de satisfação através de pesquisas',
        type: 'PERCENTAGE',
        targetValue: 85,
        currentValue: 87,
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
        title: 'Mentorar 2 desenvolvedores júniores',
        description: 'Acompanhar desenvolvimento de 2 profissionais',
        type: 'NUMBER',
        targetValue: 2,
        currentValue: 1,
        unit: 'pessoas',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj3_1.id,
        title: 'Conduzir 8 sessões de code review',
        description: 'Revisar código e dar feedback construtivo',
        type: 'NUMBER',
        targetValue: 8,
        currentValue: 3,
        unit: 'sessões',
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
      progress: 30,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      {
        objectiveId: obj3_2.id,
        title: 'Propor e implementar 3 melhorias na arquitetura',
        description: 'Sugerir e executar melhorias técnicas',
        type: 'NUMBER',
        targetValue: 3,
        currentValue: 1,
        unit: 'melhorias',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj3_2.id,
        title: 'Apresentar 2 tech talks internas',
        description: 'Compartilhar conhecimento com a equipe',
        type: 'NUMBER',
        targetValue: 2,
        currentValue: 0,
        unit: 'apresentações',
        status: 'NOT_STARTED',
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
        title: 'Fazer 10 pull requests aceitas',
        description: 'Contribuições aceitas em projetos open source',
        type: 'NUMBER',
        targetValue: 10,
        currentValue: 2,
        unit: 'PRs',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj4_1.id,
        title: 'Criar biblioteca própria com 100+ stars',
        description: 'Desenvolver e publicar biblioteca útil',
        type: 'NUMBER',
        targetValue: 100,
        currentValue: 15,
        unit: 'stars',
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
        title: 'Participar de 4 eventos de tecnologia',
        description: 'Conferências, meetups e workshops',
        type: 'NUMBER',
        targetValue: 4,
        currentValue: 2,
        unit: 'eventos',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj5_1.id,
        title: 'Conectar com 20 profissionais no LinkedIn',
        description: 'Expandir network profissional',
        type: 'NUMBER',
        targetValue: 20,
        currentValue: 12,
        unit: 'conexões',
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
        title: 'Praticar exercícios 3x por semana',
        description: 'Manter rotina de atividade física',
        type: 'PERCENTAGE',
        targetValue: 100,
        currentValue: 75,
        unit: '% das semanas',
        status: 'IN_PROGRESS',
      },
      {
        objectiveId: obj5_2.id,
        title: 'Ler 12 livros no ano',
        description: 'Leitura técnica e desenvolvimento pessoal',
        type: 'NUMBER',
        targetValue: 12,
        currentValue: 8,
        unit: 'livros',
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
        title: 'Concluir curso de React Native',
        description: 'Certificação em desenvolvimento mobile',
        type: 'BINARY',
        targetValue: 1,
        currentValue: 0,
        status: 'CANCELLED',
      },
      {
        objectiveId: obj6_1.id,
        title: 'Desenvolver 2 apps mobile',
        description: 'Criar aplicativos para iOS e Android',
        type: 'NUMBER',
        targetValue: 2,
        currentValue: 0,
        unit: 'apps',
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