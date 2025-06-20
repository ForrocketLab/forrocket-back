import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ==========================================
  // SEED - EVALUATION CYCLES
  // ==========================================
  console.log('📅 Criando ciclos de avaliação...');

  const cycles = [
    {
      id: '2024.2',
      name: '2024.2',
      status: 'CLOSED' as const,
      phase: 'EQUALIZATION' as const,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-12-31'),
    },
    {
      id: '2025.1',
      name: '2025.1',
      status: 'OPEN' as const,
      phase: 'ASSESSMENTS' as const,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      assessmentDeadline: new Date('2025-03-15T23:59:59.999Z'),
      managerDeadline: new Date('2025-04-15T23:59:59.999Z'),
      equalizationDeadline: new Date('2025-05-15T23:59:59.999Z'),
    },
    {
      id: '2025.2',
      name: '2025.2',
      status: 'UPCOMING' as const,
      phase: 'ASSESSMENTS' as const,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-12-31'),
    },
  ];

  for (const cycle of cycles) {
    await prisma.evaluationCycle.upsert({
      where: { id: cycle.id },
      update: cycle,
      create: cycle,
    });
  }

  // ==========================================
  // SEED - CRITERIA (CRITÉRIOS DE AVALIAÇÃO)
  // ==========================================
  console.log('📋 Criando critérios de avaliação...');

  const criteria = [
    // BEHAVIOR - Critérios Comportamentais
    {
      id: 'sentimento-de-dono',
      name: 'Sentimento de Dono',
      description: 'Demonstra responsabilidade e cuidado com o trabalho e resultados da empresa',
      pillar: 'BEHAVIOR' as const,
    },
    {
      id: 'resiliencia-adversidades',
      name: 'Resiliência nas Adversidades',
      description: 'Mantém-se firme e adaptável diante de desafios e dificuldades',
      pillar: 'BEHAVIOR' as const,
    },
    {
      id: 'organizacao-trabalho',
      name: 'Organização no Trabalho',
      description: 'Mantém organização pessoal e estruturação eficiente das atividades',
      pillar: 'BEHAVIOR' as const,
    },
    {
      id: 'capacidade-aprender',
      name: 'Capacidade de Aprender',
      description: 'Busca constantemente novos conhecimentos e desenvolvimento pessoal',
      pillar: 'BEHAVIOR' as const,
    },
    {
      id: 'team-player',
      name: 'Ser "Team Player"',
      description: 'Trabalha efetivamente em equipe e contribui para um ambiente colaborativo',
      pillar: 'BEHAVIOR' as const,
    },

    // EXECUTION - Critérios de Execução
    {
      id: 'entregar-qualidade',
      name: 'Entregar com Qualidade',
      description: 'Entrega trabalho com alta qualidade e atenção aos detalhes',
      pillar: 'EXECUTION' as const,
    },
    {
      id: 'atender-prazos',
      name: 'Atender aos Prazos',
      description: 'Entrega tarefas e projetos dentro dos prazos estabelecidos',
      pillar: 'EXECUTION' as const,
    },
    {
      id: 'fazer-mais-menos',
      name: 'Fazer Mais com Menos',
      description: 'Maximiza resultados com recursos disponíveis, otimizando eficiência',
      pillar: 'EXECUTION' as const,
    },
    {
      id: 'pensar-fora-caixa',
      name: 'Pensar Fora da Caixa',
      description: 'Demonstra criatividade e inovação na resolução de problemas',
      pillar: 'EXECUTION' as const,
    },

    // MANAGEMENT - Critérios de Gestão e Liderança (para gestores)
    {
      id: 'gestao-gente',
      name: 'Gente',
      description: 'Desenvolve, motiva e lidera pessoas de forma eficaz',
      pillar: 'MANAGEMENT' as const,
    },
    {
      id: 'gestao-resultados',
      name: 'Resultados',
      description: 'Foca em resultados e entrega valor consistente para a organização',
      pillar: 'MANAGEMENT' as const,
    },
    {
      id: 'evolucao-rocket-corp',
      name: 'Evolução da Rocket Corp',
      description: 'Contribui estrategicamente para o crescimento e evolução da empresa',
      pillar: 'MANAGEMENT' as const,
    },
  ];

  for (const criterion of criteria) {
    await prisma.criterion.upsert({
      where: { id: criterion.id },
      update: criterion,
      create: criterion,
    });
  }

  // ==========================================
  // SEED - PROJECTS
  // ==========================================
  console.log('🏗️ Criando projetos...');

  const projects = [
    {
      id: 'projeto-alpha',
      name: 'Projeto Alpha',
      description: 'Desenvolvimento da nova plataforma de vendas com React e Node.js',
    },
    {
      id: 'projeto-beta',
      name: 'Projeto Beta',
      description: 'Modernização do sistema de RH com migração para microserviços',
    },
    {
      id: 'projeto-gamma',
      name: 'Projeto Gamma',
      description: 'Implementação de BI e analytics com Power BI e Apache Spark',
    },
    {
      id: 'projeto-delta',
      name: 'Projeto Delta',
      description: 'Migração para cloud computing (AWS) e containerização com Docker',
    },
    {
      id: 'projeto-mobile-app',
      name: 'App Mobile RocketCorp',
      description: 'Desenvolvimento do aplicativo móvel nativo para iOS e Android',
    },
    {
      id: 'projeto-api-core',
      name: 'API Core',
      description: 'Refatoração e otimização da API principal do sistema',
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: project,
      create: project,
    });
  }

  // ==========================================
  // LIMPEZA E CRIAÇÃO DE USUÁRIOS
  // ==========================================
  console.log('🧹 Limpando dados existentes...');
  await prisma.userProjectRole.deleteMany();
  await prisma.userProjectAssignment.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.user.deleteMany();

  // Cria senha hasheada
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('👥 Criando usuários com nova estrutura...');

  // ==========================================
  // USUÁRIO 1: EDUARDO TECH - ADMIN PURO
  // ==========================================
  const eduardo = await prisma.user.create({
    data: {
      name: 'Eduardo José Ferreira da Silva',
      email: 'eduardo.tech@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['admin']), // Campo legado - mantido para compatibilidade

      // Dados organizacionais completos
      jobTitle: 'DevOps Engineer',
      seniority: 'Sênior',
      careerTrack: 'Tech',
      businessUnit: 'Operations',

      // Admin puro - sem vínculos de projeto ou hierarquia
      projects: null,
      managerId: null,
      directReports: null,
      mentorId: null,

      isActive: true,
    },
  });

  console.log(`✅ Usuário ADMIN criado: ${eduardo.name} (${eduardo.email})`);

  // ==========================================
  // USUÁRIO 2: DIANA COSTA - RH PURO
  // ==========================================
  const diana = await prisma.user.create({
    data: {
      name: 'Diana Cristina Costa Lima',
      email: 'diana.costa@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['rh']),

      // Dados organizacionais completos
      jobTitle: 'People & Culture Manager',
      seniority: 'Sênior',
      careerTrack: 'Business',
      businessUnit: 'Operations',

      // RH puro - sem vínculos de projeto ou hierarquia
      projects: null,
      managerId: null,
      directReports: null,
      mentorId: null,

      isActive: true,
    },
  });

  console.log(`✅ Usuário RH criado: ${diana.name} (${diana.email})`);

  // ==========================================
  // USUÁRIO 3: CARLA DIAS - COMITÊ PURO
  // ==========================================
  const carla = await prisma.user.create({
    data: {
      name: 'Carla Regina Dias Fernandes',
      email: 'carla.dias@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['comite']),

      // Dados organizacionais completos
      jobTitle: 'Head of Engineering',
      seniority: 'Principal',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Comitê puro - sem vínculos de projeto ou hierarquia
      projects: null,
      managerId: null,
      directReports: null,
      mentorId: null,

      isActive: true,
    },
  });

  console.log(`✅ Usuário COMITÊ criado: ${carla.name} (${carla.email})`);

  // ==========================================
  // USUÁRIO 4: BRUNO MENDES - GESTOR + COLABORADOR
  // ==========================================
  const bruno = await prisma.user.create({
    data: {
      name: 'Bruno André Mendes Carvalho',
      email: 'bruno.mendes@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'gestor']),

      // Dados organizacionais completos
      jobTitle: 'Tech Lead',
      seniority: 'Sênior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Dados de projetos (legado - agora substituído por UserProjectAssignment + UserProjectRole)
      projects: JSON.stringify(['projeto-alpha', 'projeto-api-core']),
      managerId: null,
      directReports: JSON.stringify([]), // Será atualizado após criar Ana e Felipe
      mentorId: null,

      isActive: true,
    },
  });

  console.log(`✅ Usuário GESTOR+COLABORADOR criado: ${bruno.name} (${bruno.email})`);

  // ==========================================
  // USUÁRIO 5: ANA OLIVEIRA - COLABORADORA
  // ==========================================
  const ana = await prisma.user.create({
    data: {
      name: 'Ana Beatriz Oliveira Santos',
      email: 'ana.oliveira@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),

      // Dados organizacionais completos
      jobTitle: 'Desenvolvedora Frontend',
      seniority: 'Pleno',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Dados de projetos
      projects: JSON.stringify(['projeto-alpha', 'projeto-mobile-app']),
      managerId: bruno.id, // Bruno é seu gestor
      directReports: null, // Ana não tem liderados
      mentorId: null, // Sem mentor neste exemplo

      isActive: true,
    },
  });

  console.log(`✅ Usuário COLABORADOR criado: ${ana.name} (${ana.email})`);

  // ==========================================
  // USUÁRIO 6: FELIPE SILVA - COLABORADOR
  // ==========================================
  const felipe = await prisma.user.create({
    data: {
      name: 'Felipe Augusto Silva Rodrigues',
      email: 'felipe.silva@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),

      // Dados organizacionais completos
      jobTitle: 'Desenvolvedor Backend',
      seniority: 'Júnior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Dados de projetos
      projects: JSON.stringify(['projeto-api-core', 'projeto-mobile-app']),
      managerId: bruno.id, // Bruno é seu gestor
      directReports: null, // Felipe não tem liderados
      mentorId: ana.id, // Ana é sua mentora

      isActive: true,
    },
  });

  console.log(`✅ Usuário COLABORADOR criado: ${felipe.name} (${felipe.email})`);

  // ==========================================
  // ATUALIZAR DIRECT REPORTS DO BRUNO
  // ==========================================
  await prisma.user.update({
    where: { id: bruno.id },
    data: {
      directReports: JSON.stringify([ana.id, felipe.id]),
    },
  });
  console.log(`✅ Bruno → Liderados: Ana e Felipe`);

  // ==========================================
  // CONFIGURAÇÃO DE ROLE ASSIGNMENTS (NOVAS ESTRUTURAS)
  // ==========================================
  console.log('👥 Configurando role assignments globais...');

  const roleAssignments = [
    // Eduardo: Admin puro
    { userId: eduardo.id, role: 'ADMIN' as const },

    // Diana: RH puro
    { userId: diana.id, role: 'RH' as const },

    // Carla: Comitê puro
    { userId: carla.id, role: 'COMMITTEE' as const },

    // Bruno: Colaborador + Gestor
    { userId: bruno.id, role: 'COLLABORATOR' as const },
    { userId: bruno.id, role: 'MANAGER' as const },

    // Ana: Colaboradora
    { userId: ana.id, role: 'COLLABORATOR' as const },

    // Felipe: Colaborador
    { userId: felipe.id, role: 'COLLABORATOR' as const },
  ];

  for (const assignment of roleAssignments) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: assignment.userId,
          role: assignment.role,
        },
      },
      update: {},
      create: assignment,
    });
  }

  // ==========================================
  // CONFIGURAÇÃO DE ATRIBUIÇÕES DE PROJETO (APENAS PARA MEMBROS DE PROJETO)
  // ==========================================
  console.log('📋 Configurando atribuições de projeto...');

  const projectAssignments = [
    // Bruno: Projeto Alpha (liderar) e API Core
    { userId: bruno.id, projectId: 'projeto-alpha' },
    { userId: bruno.id, projectId: 'projeto-api-core' },

    // Ana: Projeto Alpha e Mobile App
    { userId: ana.id, projectId: 'projeto-alpha' },
    { userId: ana.id, projectId: 'projeto-mobile-app' },

    // Felipe: API Core e Mobile App
    { userId: felipe.id, projectId: 'projeto-api-core' },
    { userId: felipe.id, projectId: 'projeto-mobile-app' },
  ];

  for (const assignment of projectAssignments) {
    await prisma.userProjectAssignment.upsert({
      where: {
        userId_projectId: {
          userId: assignment.userId,
          projectId: assignment.projectId,
        },
      },
      update: {},
      create: assignment,
    });
  }

  // ==========================================
  // CONFIGURAÇÃO DE ROLES POR PROJETO (UserProjectRole)
  // ==========================================
  console.log('🔑 Configurando roles específicas por projeto...');

  const userProjectRoles = [
    // PROJETO ALPHA - Plataforma de Vendas
    { userId: bruno.id, projectId: 'projeto-alpha', role: 'MANAGER' as const }, // Bruno é gestor no Alpha
    { userId: ana.id, projectId: 'projeto-alpha', role: 'COLLABORATOR' as const }, // Ana colaboradora no Alpha

    // PROJETO API CORE
    { userId: bruno.id, projectId: 'projeto-api-core', role: 'MANAGER' as const }, // Bruno gestor no API Core
    { userId: felipe.id, projectId: 'projeto-api-core', role: 'COLLABORATOR' as const }, // Felipe colaborador no API Core

    // PROJETO MOBILE APP
    { userId: ana.id, projectId: 'projeto-mobile-app', role: 'COLLABORATOR' as const }, // Ana colaboradora no Mobile
    { userId: felipe.id, projectId: 'projeto-mobile-app', role: 'COLLABORATOR' as const }, // Felipe colaborador no Mobile
  ];

  for (const userProjectRole of userProjectRoles) {
    await prisma.userProjectRole.upsert({
      where: {
        userId_projectId_role: {
          userId: userProjectRole.userId,
          projectId: userProjectRole.projectId,
          role: userProjectRole.role,
        },
      },
      update: {},
      create: userProjectRole,
    });
  }

  // ==========================================
  // SEED - DADOS DE AVALIAÇÃO DE EXEMPLO (NOVO)
  // ==========================================
  console.log('📝 Criando dados de avaliação de exemplo para o ciclo 2025.1...');

  // Cenário 1: Ana já submeteu sua autoavaliação.
  await prisma.selfAssessment.create({
    data: {
      authorId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      answers: {
        create: {
          criterionId: 'sentimento-de-dono',
          score: 5,
          justification: 'Sempre assumo a responsabilidade pelos projetos.',
        },
      },
    },
  });

  // Cenário 2: Felipe apenas começou a sua autoavaliação (está em rascunho).
  await prisma.selfAssessment.create({
    data: {
      authorId: felipe.id,
      cycle: '2025.1',
      status: 'DRAFT',
      answers: {
        create: {
          criterionId: 'team-player',
          score: 4,
          justification: 'Colaboro bem com a equipe.',
        },
      },
    },
  });

  // Cenário 3: Bruno (o gestor) já avaliou a Ana.
  await prisma.managerAssessment.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      answers: {
        create: {
          criterionId: 'entregar-qualidade',
          score: 5,
          justification: 'As entregas da Ana são sempre de alta qualidade.',
        },
      },
    },
  });

  // Cenário 4: Ana (colega) já fez uma avaliação 360 do Felipe.
  await prisma.assessment360.create({
    data: {
      authorId: ana.id,
      evaluatedUserId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      overallScore: 4,
      strengths: 'Muito proativo.',
      improvements: 'Pode melhorar a organização das tarefas.',
    },
  });

  console.log('✅ Dados de avaliação de exemplo criados.');

  console.log('✅ Estruturas de relacionamento configuradas!');

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('✅ Seed concluído com sucesso!');
  console.log('📊 Estruturas criadas:');
  console.log(`   - ${cycles.length} ciclos de avaliação com sistema de fases`);
  console.log(
    `   - ${criteria.length} critérios (${criteria.filter((c) => c.pillar === 'BEHAVIOR').length} comportamentais, ${criteria.filter((c) => c.pillar === 'EXECUTION').length} execução, ${criteria.filter((c) => c.pillar === 'MANAGEMENT').length} gestão)`,
  );
  console.log(`   - ${projects.length} projetos`);
  console.log(`   - 6 usuários com perfis separados por escopo`);
  console.log(`   - ${roleAssignments.length} atribuições de role globais`);
  console.log(`   - ${projectAssignments.length} atribuições de projeto`);
  console.log(`   - ${userProjectRoles.length} roles específicas por projeto`);
  console.log('');

  // ==========================================
  // RESUMO DOS CICLOS E FASES
  // ==========================================
  console.log('🔄 Sistema de Fases dos Ciclos:');
  console.log('');
  cycles.forEach((cycle) => {
    const statusIcon = cycle.status === 'OPEN' ? '🟢' : cycle.status === 'CLOSED' ? '🔴' : '🟡';
    let phaseIcon = '❓';
    const phase = cycle.phase as string;
    if (phase === 'ASSESSMENTS') phaseIcon = '📝';
    else if (phase === 'MANAGER_REVIEWS') phaseIcon = '👔';
    else if (phase === 'EQUALIZATION') phaseIcon = '⚖️';

    console.log(`  ${statusIcon} ${cycle.name} | ${cycle.status} | ${phaseIcon} ${cycle.phase}`);
  });

  console.log('');
  console.log('📋 Descrição das Fases:');
  console.log('  📝 ASSESSMENTS (Fase 1): Autoavaliação, 360, Mentoring, Reference');
  console.log('  👔 MANAGER_REVIEWS (Fase 2): Avaliações de Gestor');
  console.log('  ⚖️ EQUALIZATION (Fase 3): Equalização final');
  console.log('');
  console.log('🎯 Ciclo Ativo: 2025.1 na fase ASSESSMENTS');
  console.log('  ✅ Permitidas: Autoavaliação, 360, Mentoring, Reference');
  console.log('  ❌ Bloqueadas: Avaliações de Gestor');
  console.log('');

  console.log('👥 Usuários disponíveis para login:');
  console.log('');
  console.log('🔧 PAPÉIS GLOBAIS (sem vínculos de projeto):');
  console.log('  📧 eduardo.tech@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Eduardo José Ferreira da Silva | 🎯 ADMIN PURO | 💼 DevOps Engineer Sênior | 🏢 Operations',
  );
  console.log('  📧 diana.costa@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Diana Cristina Costa Lima | 🎯 RH PURO | 💼 People & Culture Manager Sênior | 🏢 Operations',
  );
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Carla Regina Dias Fernandes | 🎯 COMITÊ PURO | 💼 Head of Engineering Principal | 🏢 Digital Products',
  );
  console.log('');
  console.log('👥 MEMBROS DE PROJETO (com vínculos de projeto):');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Bruno André Mendes Carvalho | 🎯 Gestor + Colaborador | 💼 Tech Lead Sênior | 🏢 Digital Products',
  );
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Ana Beatriz Oliveira Santos | 🎯 Colaboradora | 💼 Desenvolvedora Frontend Pleno | 🏢 Digital Products',
  );
  console.log('  📧 felipe.silva@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Felipe Augusto Silva Rodrigues | 🎯 Colaborador | 💼 Desenvolvedor Backend Júnior | 🏢 Digital Products',
  );
  console.log('');
  console.log('🏢 Nova Estrutura Organizacional:');
  console.log('  🔧 Eduardo Tech (Admin) - Independente, gerencia sistema');
  console.log('  👥 Diana Costa (RH) - Independente, gerencia pessoas e políticas');
  console.log('  ⚖️ Carla Dias (Comitê) - Independente, equalização de avaliações');
  console.log('  👑 Bruno Mendes (Gestor) → Ana Oliveira & Felipe Silva (Colaboradores)');
  console.log('');
  console.log('🎯 Tipos de Usuário:');
  console.log('  • Admin: Gerenciamento total do sistema (sem vínculos de projeto)');
  console.log('  • RH: Configuração e acompanhamento (sem vínculos de projeto)');
  console.log('  • Comitê: Equalização final (sem vínculos de projeto)');
  console.log('  • Colaborador: Participa como avaliado (vinculado a projetos)');
  console.log('  • Gestor: Avalia liderados + é avaliado (vinculado a projetos)');
  console.log('');
  console.log('🔑 Exemplos de Roles por Projeto:');
  console.log('  • Bruno: MANAGER no Alpha e API Core');
  console.log('  • Ana: COLLABORATOR no Alpha e Mobile App');
  console.log('  • Felipe: COLLABORATOR no API Core e Mobile App');
  console.log('  • Eduardo, Diana, Carla: SEM vínculos de projeto');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
