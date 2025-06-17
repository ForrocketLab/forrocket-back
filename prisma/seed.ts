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
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-12-31'),
    },
    {
      id: '2025.1',
      name: '2025.1', 
      status: 'OPEN' as const,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
    },
    {
      id: '2025.2',
      name: '2025.2',
      status: 'UPCOMING' as const,
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
  await prisma.userProjectAssignment.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.user.deleteMany();

  // Cria senha hasheada
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('👥 Criando usuários robustos...');

  // ==========================================
  // USUÁRIO 1: ANA OLIVEIRA - DESENVOLVEDORA FRONTEND PLENO
  // ==========================================
  const ana = await prisma.user.create({
    data: {
      name: 'Ana Beatriz Oliveira Santos',
      email: 'ana.oliveira@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']), // Campo legado - mantido para compatibilidade

      // Dados organizacionais completos
      jobTitle: 'Desenvolvedora Frontend',
      seniority: 'Pleno',
      careerTrack: 'Tecnologia',
      businessUnit: 'Digital Products',

      // Dados de projetos (legado - agora substituído por UserProjectAssignment + UserProjectRole)
      projects: JSON.stringify(['projeto-alpha', 'projeto-mobile-app']),
      managerId: null, // Será preenchido após criar Bruno
      directReports: null, // Ana não tem liderados
      mentorId: null, // Será preenchido após criar Carla

      isActive: true,
    },
  });

  console.log(`✅ Usuário criado: ${ana.name} (${ana.email})`);

  // ==========================================
  // USUÁRIO 2: BRUNO MENDES - TECH LEAD SÊNIOR
  // ==========================================
  const bruno = await prisma.user.create({
    data: {
      name: 'Bruno André Mendes Carvalho',
      email: 'bruno.mendes@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'gestor']),

      // Dados organizacionais completos
      jobTitle: 'Tech Lead Sênior',
      seniority: 'Sênior',
      careerTrack: 'Tecnologia',
      businessUnit: 'Digital Products',

      // Dados de projetos (legado - agora substituído por UserProjectAssignment + UserProjectRole)
      projects: JSON.stringify(['projeto-alpha', 'projeto-api-core', 'projeto-delta']),
      managerId: null, // Será preenchido após criar Carla
      directReports: JSON.stringify([]), // Será atualizado após criar Ana e Felipe
      mentorId: null, // Será preenchido após criar Carla

      isActive: true,
    },
  });

  console.log(`✅ Usuário criado: ${bruno.name} (${bruno.email})`);

  // ==========================================
  // USUÁRIO 3: CARLA DIAS - HEAD OF ENGINEERING PRINCIPAL
  // ==========================================
  const carla = await prisma.user.create({
    data: {
      name: 'Carla Regina Dias Fernandes',
      email: 'carla.dias@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'comite']),

      // Dados organizacionais completos
      jobTitle: 'Head of Engineering',
      seniority: 'Principal',
      careerTrack: 'Tecnologia',
      businessUnit: 'Digital Products',

      // Dados de projetos e relacionamentos
      projects: JSON.stringify(['projeto-beta', 'projeto-gamma', 'projeto-delta']),
      managerId: null, // Carla não tem gestor (C-Level)
      directReports: JSON.stringify([]), // Será atualizado após criar Bruno e Diana
      mentorId: null, // Carla não tem mentor

      isActive: true,
    },
  });

  console.log(`✅ Usuário criado: ${carla.name} (${carla.email})`);

  // ==========================================
  // USUÁRIO 4: DIANA COSTA - PEOPLE & CULTURE MANAGER SÊNIOR
  // ==========================================
  const diana = await prisma.user.create({
    data: {
      name: 'Diana Cristina Costa Lima',
      email: 'diana.costa@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'rh']),

      // Dados organizacionais completos
      jobTitle: 'People & Culture Manager',
      seniority: 'Sênior',
      careerTrack: 'Negócios',
      businessUnit: 'Operações',

      // Dados de projetos e relacionamentos
      projects: JSON.stringify(['projeto-beta']), // Projeto de modernização do RH
      managerId: null, // Será preenchido após atualizar Carla
      directReports: null, // Diana não tem liderados diretos
      mentorId: null, // Será preenchido após atualizar Carla

      isActive: true,
    },
  });

  console.log(`✅ Usuário criado: ${diana.name} (${diana.email})`);

  // ==========================================
  // USUÁRIO 5: FELIPE SILVA - DESENVOLVEDOR BACKEND JÚNIOR
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
      careerTrack: 'Tecnologia',
      businessUnit: 'Digital Products',

      // Dados de projetos e relacionamentos
      projects: JSON.stringify(['projeto-api-core', 'projeto-mobile-app']),
      managerId: null, // Será preenchido após atualizar Bruno
      directReports: null, // Felipe não tem liderados
      mentorId: null, // Será preenchido após atualizar Ana

      isActive: true,
    },
  });

  console.log(`✅ Usuário criado: ${felipe.name} (${felipe.email})`);

  // ==========================================
  // USUÁRIO 6: EDUARDO TECH - DEVOPS ENGINEER SÊNIOR (ADMIN)
  // ==========================================
  const eduardo = await prisma.user.create({
    data: {
      name: 'Eduardo José Ferreira da Silva',
      email: 'eduardo.tech@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['admin']),

      // Dados organizacionais completos
      jobTitle: 'DevOps Engineer',
      seniority: 'Sênior',
      careerTrack: 'Tecnologia',
      businessUnit: 'Operações',

      // Dados de projetos e relacionamentos
      projects: JSON.stringify(['projeto-delta', 'projeto-gamma']), // Projetos de infraestrutura
      managerId: null, // Eduardo reporta diretamente ao CTO (não presente no seed)
      directReports: null, // Eduardo não tem liderados
      mentorId: null, // Eduardo não tem mentor

      isActive: true,
    },
  });

  console.log(`✅ Usuário criado: ${eduardo.name} (${eduardo.email})`);

  // ==========================================
  // CONFIGURAÇÃO DE RELACIONAMENTOS HIERÁRQUICOS
  // ==========================================
  console.log('🔗 Configurando relacionamentos hierárquicos...');

  // Ana: gestor = Bruno, mentor = Carla
  await prisma.user.update({
    where: { id: ana.id },
    data: {
      managerId: bruno.id,
      mentorId: carla.id,
    },
  });
  console.log(`✅ Ana → Gestor: ${bruno.name}, Mentor: ${carla.name}`);

  // Bruno: gestor = Carla, mentor = Carla, liderados = [Ana, Felipe]
  await prisma.user.update({
    where: { id: bruno.id },
    data: {
      managerId: carla.id,
      mentorId: carla.id,
      directReports: JSON.stringify([ana.id, felipe.id]),
    },
  });
  console.log(`✅ Bruno → Gestor: ${carla.name}, Mentor: ${carla.name}, Liderados: Ana e Felipe`);

  // Carla: liderados = [Bruno, Diana]
  await prisma.user.update({
    where: { id: carla.id },
    data: {
      directReports: JSON.stringify([bruno.id, diana.id]),
    },
  });
  console.log(`✅ Carla → Liderados: Bruno e Diana`);

  // Diana: gestor = Carla, mentor = Carla
  await prisma.user.update({
    where: { id: diana.id },
    data: {
      managerId: carla.id,
      mentorId: carla.id,
    },
  });
  console.log(`✅ Diana → Gestor: ${carla.name}, Mentor: ${carla.name}`);

  // Felipe: gestor = Bruno, mentor = Ana
  await prisma.user.update({
    where: { id: felipe.id },
    data: {
      managerId: bruno.id,
      mentorId: ana.id,
    },
  });
  console.log(`✅ Felipe → Gestor: ${bruno.name}, Mentor: ${ana.name}`);

  // ==========================================
  // CONFIGURAÇÃO DE ROLE ASSIGNMENTS (NOVAS ESTRUTURAS)
  // ==========================================
  console.log('👥 Configurando role assignments...');

  const roleAssignments = [
    // Ana: Colaboradora
    { userId: ana.id, role: 'COLLABORATOR' as const },
    
    // Bruno: Colaborador + Gestor
    { userId: bruno.id, role: 'COLLABORATOR' as const },
    { userId: bruno.id, role: 'MANAGER' as const },
    
    // Carla: Colaboradora + Comitê
    { userId: carla.id, role: 'COLLABORATOR' as const },
    { userId: carla.id, role: 'COMMITTEE' as const },
    
    // Diana: Colaboradora + RH
    { userId: diana.id, role: 'COLLABORATOR' as const },
    { userId: diana.id, role: 'RH' as const },
    
    // Felipe: Colaborador
    { userId: felipe.id, role: 'COLLABORATOR' as const },
    
    // Eduardo: Admin
    { userId: eduardo.id, role: 'ADMIN' as const },
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
  // CONFIGURAÇÃO DE ATRIBUIÇÕES DE PROJETO
  // ==========================================
  console.log('📋 Configurando atribuições de projeto...');

  const projectAssignments = [
    // Ana: Projeto Alpha (plataforma de vendas) e Mobile App
    { userId: ana.id, projectId: 'projeto-alpha' },
    { userId: ana.id, projectId: 'projeto-mobile-app' },
    
    // Bruno: Projeto Alpha (liderar), API Core e Delta (infraestrutura)
    { userId: bruno.id, projectId: 'projeto-alpha' },
    { userId: bruno.id, projectId: 'projeto-api-core' },
    { userId: bruno.id, projectId: 'projeto-delta' },
    
    // Carla: Projetos estratégicos (Beta, Gamma, Delta)
    { userId: carla.id, projectId: 'projeto-beta' },
    { userId: carla.id, projectId: 'projeto-gamma' },
    { userId: carla.id, projectId: 'projeto-delta' },
    
    // Diana: Projeto Beta (modernização RH)
    { userId: diana.id, projectId: 'projeto-beta' },
    
    // Felipe: API Core e Mobile App (projetos de aprendizado)
    { userId: felipe.id, projectId: 'projeto-api-core' },
    { userId: felipe.id, projectId: 'projeto-mobile-app' },
    
    // Eduardo: Delta (cloud) e Gamma (infraestrutura BI)
    { userId: eduardo.id, projectId: 'projeto-delta' },
    { userId: eduardo.id, projectId: 'projeto-gamma' },
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
    { userId: ana.id, projectId: 'projeto-alpha', role: 'COLLABORATOR' as const },
    { userId: bruno.id, projectId: 'projeto-alpha', role: 'MANAGER' as const }, // Bruno é gestor no Alpha
    
    // PROJETO BETA - Modernização RH  
    { userId: carla.id, projectId: 'projeto-beta', role: 'COMMITTEE' as const }, // Carla é comitê no Beta
    { userId: diana.id, projectId: 'projeto-beta', role: 'RH' as const }, // Diana é RH no Beta
    
    // PROJETO GAMMA - BI e Analytics
    { userId: carla.id, projectId: 'projeto-gamma', role: 'MANAGER' as const }, // Carla é gestora no Gamma
    { userId: eduardo.id, projectId: 'projeto-gamma', role: 'ADMIN' as const }, // Eduardo é admin no Gamma
    
    // PROJETO DELTA - Cloud Migration
    { userId: bruno.id, projectId: 'projeto-delta', role: 'COLLABORATOR' as const }, // Bruno colaborador no Delta
    { userId: carla.id, projectId: 'projeto-delta', role: 'COMMITTEE' as const }, // Carla comitê no Delta
    { userId: eduardo.id, projectId: 'projeto-delta', role: 'MANAGER' as const }, // Eduardo gestor no Delta
    
    // PROJETO MOBILE APP
    { userId: ana.id, projectId: 'projeto-mobile-app', role: 'COLLABORATOR' as const }, // Ana colaboradora no Mobile
    { userId: felipe.id, projectId: 'projeto-mobile-app', role: 'COLLABORATOR' as const }, // Felipe colaborador no Mobile
    
    // PROJETO API CORE
    { userId: bruno.id, projectId: 'projeto-api-core', role: 'MANAGER' as const }, // Bruno gestor no API Core
    { userId: felipe.id, projectId: 'projeto-api-core', role: 'COLLABORATOR' as const }, // Felipe colaborador no API Core
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

  console.log('✅ Estruturas de relacionamento configuradas!');

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('✅ Seed concluído com sucesso!');
  console.log('📊 Estruturas criadas:');
  console.log(`   - ${cycles.length} ciclos de avaliação`);
  console.log(`   - ${criteria.length} critérios (${criteria.filter(c => c.pillar === 'BEHAVIOR').length} comportamentais, ${criteria.filter(c => c.pillar === 'EXECUTION').length} execução, ${criteria.filter(c => c.pillar === 'MANAGEMENT').length} gestão)`);
  console.log(`   - ${projects.length} projetos`);
  console.log(`   - 6 usuários com perfis completos`);
  console.log(`   - ${roleAssignments.length} atribuições de role globais`);
  console.log(`   - ${projectAssignments.length} atribuições de projeto`);
  console.log(`   - ${userProjectRoles.length} roles específicas por projeto`);
  console.log('');
  console.log('👥 Usuários disponíveis para login:');
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123');
  console.log('     👤 Ana Beatriz Oliveira Santos | 🎯 Colaboradora | 💼 Desenvolvedora Frontend Pleno | 🏢 Digital Products');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123');
  console.log('     👤 Bruno André Mendes Carvalho | 🎯 Gestor + Colaborador | 💼 Tech Lead Sênior | 🏢 Digital Products');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123');
  console.log('     👤 Carla Regina Dias Fernandes | 🎯 Comitê + Colaboradora | 💼 Head of Engineering Principal | 🏢 Digital Products');
  console.log('  📧 diana.costa@rocketcorp.com - Senha: password123');
  console.log('     👤 Diana Cristina Costa Lima | 🎯 RH + Colaboradora | 💼 People & Culture Manager Sênior | 🏢 Operações');
  console.log('  📧 felipe.silva@rocketcorp.com - Senha: password123');
  console.log('     👤 Felipe Augusto Silva Rodrigues | 🎯 Colaborador | 💼 Desenvolvedor Backend Júnior | 🏢 Digital Products');
  console.log('  📧 eduardo.tech@rocketcorp.com - Senha: password123');
  console.log('     👤 Eduardo José Ferreira da Silva | 🎯 Admin | 💼 DevOps Engineer Sênior | 🏢 Operações');
  console.log('');
  console.log('🏢 Estrutura Organizacional:');
  console.log('  👑 Carla Dias (Head) → Bruno Mendes (Tech Lead) → Ana Oliveira & Felipe Silva');
  console.log('  👑 Carla Dias (Head) → Diana Costa (RH)');
  console.log('  🔧 Eduardo Tech (Admin - Independente)');
  console.log('');
  console.log('🎯 Tipos de Usuário:');
  console.log('  • Colaborador: Participa como avaliado');
  console.log('  • Gestor: Avalia liderados + é avaliado');
  console.log('  • Comitê: Equalização final + é avaliado');
  console.log('  • RH: Configuração e acompanhamento');
  console.log('  • Admin: Gerenciamento total do sistema');
  console.log('');
  console.log('🔑 Exemplos de Roles por Projeto:');
  console.log('  • Ana: COLLABORATOR no Alpha e Mobile App');
  console.log('  • Bruno: MANAGER no Alpha/API Core, COLLABORATOR no Delta');
  console.log('  • Carla: MANAGER no Gamma, COMMITTEE no Beta/Delta');
  console.log('  • Eduardo: MANAGER no Delta, ADMIN no Gamma');
  console.log('  • Diana: RH no Beta');
  console.log('  • Felipe: COLLABORATOR no Mobile App e API Core');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
