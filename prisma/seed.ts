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
      startDate: new Date('2024-07-01T00:00:00.000Z'),
      endDate: new Date('2024-12-31T23:59:59.999Z'),
      assessmentDeadline: new Date('2024-09-15T23:59:59.999Z'),
      managerDeadline: new Date('2024-10-15T23:59:59.999Z'),
      equalizationDeadline: new Date('2024-11-30T23:59:59.999Z'),
    },
    {
      id: '2025.1',
      name: '2025.1',
      status: 'OPEN' as const,
      phase: 'EQUALIZATION' as const,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-07-24T23:59:59.999Z'),
      assessmentDeadline: new Date('2025-03-15T23:59:59.999Z'),
      managerDeadline: new Date('2025-04-15T23:59:59.999Z'),
      equalizationDeadline: new Date('2025-07-20T23:59:59.999Z'),
    },
    {
      id: '2025.2',
      name: '2025.2',
      status: 'UPCOMING' as const,
      phase: 'ASSESSMENTS' as const,
      startDate: new Date('2025-08-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T23:59:59.999Z'),
      assessmentDeadline: new Date('2025-10-31T23:59:59.999Z'),
      managerDeadline: new Date('2025-11-30T23:59:59.999Z'),
      equalizationDeadline: new Date('2025-12-15T23:59:59.999Z'),
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
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'resiliencia-adversidades',
      name: 'Resiliência nas Adversidades',
      description: 'Mantém-se firme e adaptável diante de desafios e dificuldades',
      pillar: 'BEHAVIOR' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'organizacao-trabalho',
      name: 'Organização no Trabalho',
      description: 'Mantém organização pessoal e estruturação eficiente das atividades',
      pillar: 'BEHAVIOR' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'capacidade-aprender',
      name: 'Capacidade de Aprender',
      description: 'Busca constantemente novos conhecimentos e desenvolvimento pessoal',
      pillar: 'BEHAVIOR' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'team-player',
      name: 'Ser "Team Player"',
      description: 'Trabalha efetivamente em equipe e contribui para um ambiente colaborativo',
      pillar: 'BEHAVIOR' as const,
      businessUnit: undefined,
      isBase: true,
    },

    // EXECUTION - Critérios de Execução
    {
      id: 'entregar-qualidade',
      name: 'Entregar com Qualidade',
      description: 'Entrega trabalho com alta qualidade e atenção aos detalhes',
      pillar: 'EXECUTION' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'atender-prazos',
      name: 'Atender aos Prazos',
      description: 'Entrega tarefas e projetos dentro dos prazos estabelecidos',
      pillar: 'EXECUTION' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'fazer-mais-menos',
      name: 'Fazer Mais com Menos',
      description: 'Maximiza resultados com recursos disponíveis, otimizando eficiência',
      pillar: 'EXECUTION' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'pensar-fora-caixa',
      name: 'Pensar Fora da Caixa',
      description: 'Demonstra criatividade e inovação na resolução de problemas',
      pillar: 'EXECUTION' as const,
      businessUnit: undefined,
      isBase: true,
    },

    // MANAGEMENT - Critérios de Gestão e Liderança (para gestores)
    {
      id: 'gestao-gente',
      name: 'Gente',
      description: 'Desenvolve, motiva e lidera pessoas de forma eficaz',
      pillar: 'MANAGEMENT' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'gestao-resultados',
      name: 'Resultados',
      description: 'Foca em resultados e entrega valor consistente para a organização',
      pillar: 'MANAGEMENT' as const,
      businessUnit: undefined,
      isBase: true,
    },
    {
      id: 'evolucao-rocket-corp',
      name: 'Evolução da Rocket Corp',
      description: 'Contribui estrategicamente para o crescimento e evolução da empresa',
      pillar: 'MANAGEMENT' as const,
      businessUnit: undefined,
      isBase: true,
    },
    // EXEMPLO DE CRITÉRIO ESPECÍFICO DE TRILHA
    {
      id: 'inovacao-tecnologica',
      name: 'Inovação Tecnológica',
      description: 'Propõe e implementa soluções inovadoras',
      pillar: 'EXECUTION' as const,
      businessUnit: 'Digital Products',
      isBase: false,
    },
    // ... adicione outros critérios específicos de trilha aqui, sempre com businessUnit e isBase definidos ...
  ];

  // Garante que critérios com businessUnit definida tenham isBase: false
  for (const criterion of criteria) {
    if (criterion.businessUnit && criterion.isBase === undefined) {
      criterion.isBase = false;
    }
  }

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
  await prisma.committeeAssessment.deleteMany();
  await prisma.managerAssessment.deleteMany();
  await prisma.assessment360.deleteMany();
  await prisma.mentoringAssessment.deleteMany();
  await prisma.referenceFeedback.deleteMany();
  await prisma.selfAssessment.deleteMany();
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
      mentorId: null, // Será atualizado depois (Lucas será seu mentor)

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
      mentorId: bruno.id, // Bruno é seu mentor

      isActive: true,
    },
  });

  console.log(`✅ Usuário COLABORADOR criado: ${felipe.name} (${felipe.email})`);

  // ==========================================
  // USUÁRIO 7: LUCAS FERNANDES - LÍDER + COLABORADOR
  // ==========================================
  const lucas = await prisma.user.create({
    data: {
      name: 'Lucas Henrique Fernandes Souza',
      email: 'lucas.fernandes@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'lider']),

      // Dados organizacionais completos
      jobTitle: 'Product Manager',
      seniority: 'Sênior',
      careerTrack: 'Business',
      businessUnit: 'Digital Products',

      // Dados de projetos
      projects: JSON.stringify(['projeto-beta', 'projeto-gamma']),
      managerId: null, // Lucas não tem gestor (é líder)
      directReports: null, // Lucas não gerencia pessoas (só lidera)
      mentorId: null,

      isActive: true,
    },
  });

  console.log(`✅ Usuário LÍDER+COLABORADOR criado: ${lucas.name} (${lucas.email})`);

  // ==========================================
  // USUÁRIO 8: MARINA SANTOS - COLABORADORA
  // ==========================================
  const marina = await prisma.user.create({
    data: {
      name: 'Marina Vitória Santos Oliveira',
      email: 'marina.santos@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),

      // Dados organizacionais completos
      jobTitle: 'Data Analyst',
      seniority: 'Pleno',
      careerTrack: 'Tech',
      businessUnit: 'Operations',

      // Dados de projetos
      projects: JSON.stringify(['projeto-gamma', 'projeto-delta']),
      managerId: null, // Será definido depois
      directReports: null,
      mentorId: null, // Será definido depois

      isActive: true,
    },
  });

  console.log(`✅ Usuário COLABORADOR criado: ${marina.name} (${marina.email})`);

  // ==========================================
  // USUÁRIO 9: RAFAEL COSTA - GESTOR + LÍDER + COLABORADOR
  // ==========================================
  const rafael = await prisma.user.create({
    data: {
      name: 'Rafael Augusto Costa Silva',
      email: 'rafael.costa@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'gestor', 'lider']),

      // Dados organizacionais completos
      jobTitle: 'System Administrator',
      seniority: 'Principal',
      careerTrack: 'Tech',
      businessUnit: 'Operations',

      // Dados de projetos
      projects: JSON.stringify(['projeto-delta']),
      managerId: null, // Rafael é líder sênior
      directReports: JSON.stringify([]), // Será atualizado
      mentorId: null,

      isActive: true,
    },
  });

  console.log(`✅ Usuário GESTOR+LÍDER+COLABORADOR criado: ${rafael.name} (${rafael.email})`);

  // ==========================================
  // ATUALIZAR CAMPOS DE LIDERANÇA E RELACIONAMENTOS
  // ==========================================
  console.log('🔄 Configurando relacionamentos de liderança e mentoria...');

  // ===== ATUALIZAR DIRECT REPORTS DO BRUNO (Gestão) =====
  await prisma.user.update({
    where: { id: bruno.id },
    data: {
      directReports: JSON.stringify([ana.id, felipe.id]),
    },
  });
  console.log(`✅ Bruno → DirectReports (Gestão): Ana e Felipe`);

  // ===== ATUALIZAR CAMPOS DE LIDERANÇA E GESTÃO USANDO SQL DIRETO =====
  
  // Definir Lucas como líder do projeto Beta (RH System)
  await prisma.$executeRaw`UPDATE projects SET leaderId = ${lucas.id} WHERE id = 'projeto-beta'`;
  
  // Definir Lucas como líder do projeto Gamma (BI e Analytics)
  await prisma.$executeRaw`UPDATE projects SET leaderId = ${lucas.id} WHERE id = 'projeto-gamma'`;
  
  // Definir Rafael como líder do projeto Delta (Cloud Migration)
  await prisma.$executeRaw`UPDATE projects SET leaderId = ${rafael.id} WHERE id = 'projeto-delta'`;
  
  // Definir gestores dos projetos
  await prisma.$executeRaw`UPDATE projects SET managerId = ${bruno.id} WHERE id = 'projeto-alpha'`; // Bruno gerencia Alpha
  await prisma.$executeRaw`UPDATE projects SET managerId = ${bruno.id} WHERE id = 'projeto-api-core'`; // Bruno gerencia API Core
  await prisma.$executeRaw`UPDATE projects SET managerId = ${bruno.id} WHERE id = 'projeto-mobile-app'`; // Bruno gerencia Mobile App
  // Projeto Beta: Lucas é líder, sem gestor específico
  // Projeto Gamma: Lucas é líder, sem gestor específico
  await prisma.$executeRaw`UPDATE projects SET managerId = ${rafael.id} WHERE id = 'projeto-delta'`; // Rafael gerencia Delta
  
  // ✅ CORRIGIDO: Marina tem Rafael como gestor (projeto Delta) e líder (projeto Delta)
  // Marina não tem líder no projeto Gamma (apenas colaboradora)
  await prisma.user.update({
    where: { id: marina.id },
    data: { 
      managerId: rafael.id, // Rafael é gestor de Marina (projeto Delta)
      leaderId: rafael.id   // Rafael também é líder de Marina (projeto Delta)
    }
  });
  await prisma.user.update({
    where: { id: rafael.id },
    data: { 
      directReports: JSON.stringify([marina.id]), // Rafael gerencia Marina
      directLeadership: JSON.stringify([marina.id]) // Rafael lidera Marina
    }
  });
  
  // Configurar relacionamentos de mentoria
  // Bruno mentora Felipe (Felipe já foi criado com bruno.id como mentorId)
  await prisma.$executeRaw`UPDATE users SET mentoringIds = ${JSON.stringify([felipe.id])} WHERE id = ${bruno.id}`;
  
  // Lucas mentora Ana (atualizar mentorId de Ana para Lucas)
  await prisma.$executeRaw`UPDATE users SET mentoringIds = ${JSON.stringify([ana.id])} WHERE id = ${lucas.id}`;
  await prisma.$executeRaw`UPDATE users SET mentorId = ${lucas.id} WHERE id = ${ana.id}`;
  
  // Carla (comitê) mentora Bruno e Lucas (atualizar mentorId deles)
  await prisma.$executeRaw`UPDATE users SET mentoringIds = ${JSON.stringify([bruno.id, lucas.id])} WHERE id = ${carla.id}`;
  await prisma.$executeRaw`UPDATE users SET mentorId = ${carla.id} WHERE id = ${bruno.id}`;
  await prisma.$executeRaw`UPDATE users SET mentorId = ${carla.id} WHERE id = ${lucas.id}`;

  console.log(`✅ Relacionamentos de liderança e gestão configurados:`);
  console.log(`   🎯 LÍDERES DE PROJETO:`);
  console.log(`      • Lucas é líder do Projeto Beta`);
  console.log(`      • Lucas é líder do Projeto Gamma`);
  console.log(`      • Rafael é líder do Projeto Delta`);
  console.log(`   👔 GESTORES DE PROJETO:`);
  console.log(`      • Bruno gerencia: Projeto Alpha, API Core e Mobile App`);
  console.log(`      • Rafael gerencia: Projeto Delta`);
  console.log(`      • Projeto Beta: Sem gestor específico (Lucas é líder)`);
  console.log(`      • Projeto Gamma: Sem gestor específico (Lucas é líder)`);
  console.log(`   👥 LIDERANÇA DE PESSOAS:`);
  console.log(`      • Lucas lidera: Marina`);
  console.log(`      • Rafael gerencia: Marina`);
  console.log(`   🎓 MENTORIA:`);
  console.log(`      • Bruno mentora: Felipe`);
  console.log(`      • Lucas mentora: Ana`);
  console.log(`      • Carla mentora: Bruno e Lucas`);

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

    // Lucas: Colaborador + Líder
    { userId: lucas.id, role: 'COLLABORATOR' as const },
    { userId: lucas.id, role: 'LEADER' as any }, // Temporário até regenerar Prisma

    // Marina: Colaboradora
    { userId: marina.id, role: 'COLLABORATOR' as const },

    // Rafael: Colaborador + Gestor + Líder
    { userId: rafael.id, role: 'COLLABORATOR' as const },
    { userId: rafael.id, role: 'MANAGER' as const },
    { userId: rafael.id, role: 'LEADER' as any }, // Temporário até regenerar Prisma
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
    // Bruno: Projeto Alpha (liderar), API Core e Mobile App
    { userId: bruno.id, projectId: 'projeto-alpha' },
    { userId: bruno.id, projectId: 'projeto-api-core' },
    { userId: bruno.id, projectId: 'projeto-mobile-app' },

    // Ana: Projeto Alpha, Mobile App e Gamma
    { userId: ana.id, projectId: 'projeto-alpha' },
    { userId: ana.id, projectId: 'projeto-mobile-app' },
    { userId: ana.id, projectId: 'projeto-gamma' },

    // Felipe: API Core e Mobile App
    { userId: felipe.id, projectId: 'projeto-api-core' },
    { userId: felipe.id, projectId: 'projeto-mobile-app' },

    // Lucas: Projeto Beta (liderar) e Gamma
    { userId: lucas.id, projectId: 'projeto-beta' },
    { userId: lucas.id, projectId: 'projeto-gamma' },

    // Marina: Projeto Gamma e Delta
    { userId: marina.id, projectId: 'projeto-gamma' },
    { userId: marina.id, projectId: 'projeto-delta' },

    // Rafael: Projeto Delta (liderar e gerenciar)
    { userId: rafael.id, projectId: 'projeto-delta' },
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
    { userId: bruno.id, projectId: 'projeto-mobile-app', role: 'MANAGER' as const }, // Bruno é gestor no Mobile App
    { userId: ana.id, projectId: 'projeto-mobile-app', role: 'COLLABORATOR' as const }, // Ana colaboradora no Mobile
    { userId: felipe.id, projectId: 'projeto-mobile-app', role: 'COLLABORATOR' as const }, // Felipe colaborador no Mobile

    // PROJETO BETA - Sistema RH
    { userId: lucas.id, projectId: 'projeto-beta', role: 'LEADER' as any }, // Lucas é líder no Beta
    { userId: lucas.id, projectId: 'projeto-gamma', role: 'LEADER' as any }, // Lucas é líder no Gamma

    // PROJETO GAMMA - BI e Analytics
    { userId: ana.id, projectId: 'projeto-gamma', role: 'COLLABORATOR' as const }, // Ana colaboradora no Gamma
    { userId: marina.id, projectId: 'projeto-gamma', role: 'COLLABORATOR' as const }, // Marina colaboradora no Gamma

    // PROJETO DELTA - Cloud Migration
    { userId: rafael.id, projectId: 'projeto-delta', role: 'MANAGER' as const }, // Rafael é gestor no Delta
    { userId: rafael.id, projectId: 'projeto-delta', role: 'LEADER' as any }, // Rafael também é líder no Delta
    { userId: marina.id, projectId: 'projeto-delta', role: 'COLLABORATOR' as const }, // Marina colaboradora no Delta
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
  // SEED - AVALIAÇÕES COMPLETAS CICLO 2024.2
  // ==========================================
  console.log('📝 Criando avaliações completas para o ciclo 2024.2...');

  // ===== AUTOAVALIAÇÕES COMPLETAS CICLO 2024.2 =====
  console.log('📝 Criando autoavaliações 2024.2...');

  // Ana - Autoavaliação 2024.2
  await prisma.selfAssessment.create({
    data: {
      authorId: ana.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-08T14:30:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Assumo responsabilidade pelos projetos, sempre buscando entregar o melhor resultado',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me firme diante de desafios, buscando sempre soluções',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Mantenho alta organização pessoal e estruturação eficiente das tarefas',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busco constantemente novos conhecimentos e me desenvolvo continuamente',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Trabalho bem em equipe e colaboro efetivamente com colegas',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Entrego com qualidade e atenção aos detalhes',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos estabelecidos de forma consistente',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 3,
              justification: 'Estou aprendendo a otimizar recursos e maximizar resultados',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco soluções criativas para problemas',
            },
          ],
        },
      },
    },
  });

  // Bruno - Autoavaliação 2024.2
  await prisma.selfAssessment.create({
    data: {
      authorId: bruno.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-10T16:45:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Como Tech Lead, assumo responsabilidade pela equipe e resultados',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me firme e apoio a equipe em situações desafiadoras',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 4,
              justification: 'Mantenho boa organização, sempre buscando melhorar processos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Estudo novas tecnologias e práticas de liderança',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Trabalho colaborativamente e facilito a colaboração da equipe',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Garanto qualidade nas entregas da equipe',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Gerencio prazos eficientemente para a equipe',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimizo recursos e processos da equipe',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco soluções inovadoras para desafios técnicos',
            },
            {
              criterionId: 'gestao-gente',
              score: 3,
              justification: 'Desenvolvo e motivo minha equipe, ainda aprendendo a liderar',
            },
            {
              criterionId: 'gestao-resultados',
              score: 4,
              justification: 'Foco em resultados e entrego valor consistente',
            },
            {
              criterionId: 'evolucao-rocket-corp',
              score: 4,
              justification: 'Contribuo para evolução da empresa através da tecnologia',
            },
          ],
        },
      },
    },
  });

  // Felipe - Autoavaliação 2024.2
  await prisma.selfAssessment.create({
    data: {
      authorId: felipe.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-12T11:20:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 3,
              justification: 'Assumo responsabilidade pelos meus projetos, ainda desenvolvendo esse aspecto',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me positivo diante de desafios e busco aprender',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 3,
              justification: 'Estou melhorando minha organização pessoal',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Tenho grande sede de aprender e me desenvolver rapidamente',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colaboro bem com a equipe e ajudo colegas',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 3,
              justification: 'Entrego com qualidade, sempre buscando melhorar',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos estabelecidos',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 3,
              justification: 'Estou aprendendo a otimizar recursos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 3,
              justification: 'Busco soluções criativas, ainda desenvolvendo essa habilidade',
            },
          ],
        },
      },
    },
  });

  // Lucas - Autoavaliação 2024.2
  await prisma.selfAssessment.create({
    data: {
      authorId: lucas.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-14T15:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification: 'Como Product Manager, assumo total responsabilidade pelos produtos e resultados',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me firme e adapto estratégias diante de desafios',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 4,
              justification: 'Mantenho boa organização de produtos e processos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busco constantemente conhecimento em produto e negócio',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Trabalho colaborativamente e facilito alinhamento entre equipes',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Garanto qualidade dos produtos e funcionalidades',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Gerencio cronogramas e entregas eficientemente',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimizo recursos e priorizo funcionalidades de maior valor',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 5,
              justification: 'Busco soluções inovadoras para problemas de produto',
            },
          ],
        },
      },
    },
  });

  // Marina - Autoavaliação 2024.2
  await prisma.selfAssessment.create({
    data: {
      authorId: marina.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-16T13:30:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Assumo responsabilidade pelos dados e análises, sempre buscando precisão',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me focada em encontrar soluções analíticas',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Mantenho alta organização nos dados e processos analíticos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busco constantemente novas técnicas de análise e ferramentas',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colaboro bem com equipes técnicas e de negócio',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Entrego análises precisas e insights valiosos',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos de entregas analíticas',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimizo consultas e processos analíticos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco insights inovadores através dos dados',
            },
          ],
        },
      },
    },
  });

  // Rafael - Autoavaliação 2024.2
  await prisma.selfAssessment.create({
    data: {
      authorId: rafael.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-18T17:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification: 'Como System Administrator, assumo total responsabilidade pela infraestrutura',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 5,
              justification: 'Mantenho-me firme em situações críticas de infraestrutura',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 4,
              justification: 'Mantenho boa organização dos sistemas e processos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busco constantemente novas tecnologias de infraestrutura',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colaboro bem com equipes técnicas e suporte',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Garanto alta qualidade e disponibilidade dos sistemas',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos de implementação e manutenção',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimizo recursos de infraestrutura e custos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco soluções inovadoras para desafios de infraestrutura',
            },
            {
              criterionId: 'gestao-gente',
              score: 3,
              justification: 'Desenvolvo pessoas, ainda aprendendo a liderar efetivamente',
            },
            {
              criterionId: 'gestao-resultados',
              score: 4,
              justification: 'Foco em resultados de infraestrutura e disponibilidade',
            },
            {
              criterionId: 'evolucao-rocket-corp',
              score: 4,
              justification: 'Contribuo para evolução da empresa através da infraestrutura',
            },
          ],
        },
      },
    },
  });

  // ==========================================
  // SEED - AVALIAÇÕES COMPLETAS CICLO 2025.1
  // ==========================================
  console.log('📝 Criando avaliações completas para o ciclo 2025.1...');

  // ===== AUTOAVALIAÇÕES COMPLETAS =====
  console.log('📝 Criando autoavaliações...');

  // Ana - Autoavaliação
  await prisma.selfAssessment.create({
    data: {
      authorId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-10T14:30:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification: 'Sempre assumo total responsabilidade pelos projetos e resultados',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me firme diante de desafios, sempre buscando soluções',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Mantenho alta organização pessoal e estruturação eficiente',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Busco constantemente novos conhecimentos e tecnologias',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Trabalho muito bem em equipe e contribuo para ambiente colaborativo',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Entrego sempre com alta qualidade e atenção aos detalhes',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos estabelecidos de forma consistente',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimizo recursos e maximizo resultados',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Demonstro criatividade na resolução de problemas',
            },
          ],
        },
      },
    },
  });

  // Bruno - Autoavaliação
  await prisma.selfAssessment.create({
    data: {
      authorId: bruno.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-12T16:45:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification:
                'Como Tech Lead, assumo total responsabilidade pela equipe e resultados',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 5,
              justification: 'Mantenho-me firme e apoio a equipe em situações desafiadoras',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 4,
              justification: 'Mantenho boa organização, sempre buscando melhorar',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Estudo constantemente novas tecnologias e práticas de liderança',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Trabalho colaborativamente e facilito a colaboração da equipe',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Garanto alta qualidade nas entregas da equipe',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Gerencio prazos eficientemente para toda a equipe',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 5,
              justification: 'Otimizo recursos e processos da equipe',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco soluções inovadoras para desafios técnicos',
            },
            {
              criterionId: 'gestao-gente',
              score: 4,
              justification: 'Desenvolvo e motivo minha equipe, sempre buscando melhorar',
            },
            {
              criterionId: 'gestao-resultados',
              score: 5,
              justification: 'Foco em resultados e entrego valor consistente',
            },
            {
              criterionId: 'evolucao-rocket-corp',
              score: 4,
              justification: 'Contribuo estrategicamente para evolução da empresa',
            },
          ],
        },
      },
    },
  });

  // Felipe - Autoavaliação
  await prisma.selfAssessment.create({
    data: {
      authorId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-14T11:20:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Assumo responsabilidade pelos meus projetos e busco sempre melhorar',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me positivo diante de desafios e busco aprender',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 3,
              justification: 'Estou melhorando minha organização pessoal continuamente',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Tenho grande sede de aprender e me desenvolver',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Colaboro muito bem com a equipe e ajudo colegas',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Entrego com qualidade e atenção aos detalhes',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos estabelecidos de forma consistente',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 3,
              justification: 'Estou aprendendo a otimizar recursos e processos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco soluções criativas para problemas técnicos',
            },
          ],
        },
      },
    },
  });

  // Lucas - Autoavaliação 2025.1
  await prisma.selfAssessment.create({
    data: {
      authorId: lucas.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-16T15:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification: 'Como Product Manager, assumo total responsabilidade pelos produtos e resultados',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 5,
              justification: 'Mantenho-me firme e adapto estratégias diante de desafios complexos',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 4,
              justification: 'Mantenho boa organização de produtos e processos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Busco constantemente conhecimento em produto e negócio',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Trabalho colaborativamente e facilito alinhamento entre equipes',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Garanto qualidade dos produtos e funcionalidades',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Gerencio cronogramas e entregas eficientemente',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 5,
              justification: 'Otimizo recursos e priorizo funcionalidades de maior valor',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 5,
              justification: 'Busco soluções inovadoras para problemas de produto',
            },
          ],
        },
      },
    },
  });

  // Marina - Autoavaliação 2025.1
  await prisma.selfAssessment.create({
    data: {
      authorId: marina.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-18T13:30:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Assumo responsabilidade pelos dados e análises, sempre buscando precisão',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantenho-me focada em encontrar soluções analíticas',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Mantenho alta organização nos dados e processos analíticos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Busco constantemente novas técnicas de análise e ferramentas',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colaboro bem com equipes técnicas e de negócio',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Entrego análises precisas e insights valiosos',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos de entregas analíticas',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimizo consultas e processos analíticos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco insights inovadores através dos dados',
            },
          ],
        },
      },
    },
  });

  // Rafael - Autoavaliação 2025.1
  await prisma.selfAssessment.create({
    data: {
      authorId: rafael.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-20T17:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification: 'Como System Administrator, assumo total responsabilidade pela infraestrutura',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 5,
              justification: 'Mantenho-me firme em situações críticas de infraestrutura',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 4,
              justification: 'Mantenho boa organização dos sistemas e processos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busco constantemente novas tecnologias de infraestrutura',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colaboro bem com equipes técnicas e suporte',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Garanto alta qualidade e disponibilidade dos sistemas',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpro prazos de implementação e manutenção',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 5,
              justification: 'Otimizo recursos de infraestrutura e custos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busco soluções inovadoras para desafios de infraestrutura',
            },
            {
              criterionId: 'gestao-gente',
              score: 4,
              justification: 'Desenvolvo pessoas, melhorando minhas habilidades de liderança',
            },
            {
              criterionId: 'gestao-resultados',
              score: 5,
              justification: 'Foco em resultados de infraestrutura e disponibilidade',
            },
            {
              criterionId: 'evolucao-rocket-corp',
              score: 4,
              justification: 'Contribuo para evolução da empresa através da infraestrutura',
            },
          ],
        },
      },
    },
  });

  // ===== AVALIAÇÕES 360° COMPLETAS CICLO 2024.2 =====
  console.log('🔄 Criando avaliações 360° para 2024.2...');

  // Ana avalia Bruno - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: ana.id,
      evaluatedUserId: bruno.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-20T10:30:00Z'),
      overallScore: 4,
      strengths: 'Boa liderança técnica, disponível para ajudar a equipe, visão clara dos objetivos',
      improvements: 'Poderia melhorar a comunicação de expectativas e dar mais autonomia para a equipe',
    },
  });

  // Ana avalia Felipe - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: ana.id,
      evaluatedUserId: felipe.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-20T11:00:00Z'),
      overallScore: 3,
      strengths: 'Muito proativo, vontade de aprender, colaborativo e receptivo a feedbacks',
      improvements: 'Precisa melhorar a organização pessoal e planejamento de tarefas',
    },
  });

  // Bruno avalia Ana - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: ana.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-22T14:15:00Z'),
      overallScore: 4,
      strengths: 'Boa qualidade técnica, organizada, senso de responsabilidade',
      improvements: 'Poderia assumir mais iniciativas e compartilhar mais conhecimento',
    },
  });

  // Bruno avalia Felipe - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: felipe.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-22T14:45:00Z'),
      overallScore: 3,
      strengths: 'Dedicado, aprende rapidamente, boa colaboração',
      improvements: 'Precisa melhorar organização e desenvolver mais autonomia',
    },
  });

  // Felipe avalia Ana - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: felipe.id,
      evaluatedUserId: ana.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-24T09:20:00Z'),
      overallScore: 4,
      strengths: 'Muito organizada, sempre disposta a ajudar, boa qualidade técnica',
      improvements: 'Poderia ser mais proativa em compartilhar conhecimento',
    },
  });

  // Felipe avalia Bruno - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: felipe.id,
      evaluatedUserId: bruno.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-24T09:45:00Z'),
      overallScore: 4,
      strengths: 'Bom líder, disponível, ensina bem, visão técnica',
      improvements: 'Poderia delegar mais tarefas e dar mais autonomia',
    },
  });

  // Lucas avalia Marina - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: lucas.id,
      evaluatedUserId: marina.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-26T11:00:00Z'),
      overallScore: 4,
      strengths: 'Excelente em análises, muito organizada, entrega insights valiosos',
      improvements: 'Poderia ser mais proativa em sugerir melhorias de processo',
    },
  });

  // Marina avalia Lucas - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: marina.id,
      evaluatedUserId: lucas.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-26T11:30:00Z'),
      overallScore: 4,
      strengths: 'Boa visão de produto, organizado, facilita colaboração entre áreas',
      improvements: 'Poderia ser mais direto na comunicação de prioridades',
    },
  });

  // Rafael avalia Marina - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: rafael.id,
      evaluatedUserId: marina.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-28T15:00:00Z'),
      overallScore: 4,
      strengths: 'Excelente trabalho com dados, organizada, entrega análises precisas',
      improvements: 'Poderia se envolver mais em discussões técnicas de infraestrutura',
    },
  });

  // Marina avalia Rafael - 2024.2
  await prisma.assessment360.create({
    data: {
      authorId: marina.id,
      evaluatedUserId: rafael.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-28T15:30:00Z'),
      overallScore: 4,
      strengths: 'Sólido conhecimento técnico, resolve problemas complexos, confiável',
      improvements: 'Poderia melhorar a comunicação e documentação dos processos',
    },
  });

  // ===== AVALIAÇÕES 360° COMPLETAS CICLO 2025.1 =====
  console.log('🔄 Criando avaliações 360° para 2025.1...');

  // Ana avalia Bruno
  await prisma.assessment360.create({
    data: {
      authorId: ana.id,
      evaluatedUserId: bruno.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-11T10:30:00Z'),
      overallScore: 5,
      strengths:
        'Excelente liderança técnica, sempre disponível para ajudar a equipe, visão estratégica clara',
      improvements: 'Poderia delegar mais algumas tarefas para desenvolver ainda mais a equipe',
    },
  });

  // Ana avalia Felipe
  await prisma.assessment360.create({
    data: {
      authorId: ana.id,
      evaluatedUserId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-11T11:00:00Z'),
      overallScore: 3,
      strengths: 'Muito proativo, grande vontade de aprender, colaborativo e receptivo a feedbacks',
      improvements: 'Pode melhorar a organização pessoal e planejamento de tarefas',
    },
  });

  // Bruno avalia Ana
  await prisma.assessment360.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-13T14:15:00Z'),
      overallScore: 4,
      strengths: 'Excelente qualidade técnica, muito organizada, grande senso de responsabilidade',
      improvements: 'Poderia assumir mais iniciativas de liderança técnica em projetos',
    },
  });

  // Bruno avalia Felipe
  await prisma.assessment360.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-13T14:45:00Z'),
      overallScore: 4,
      strengths: 'Muito dedicado, aprende rapidamente, boa colaboração em equipe',
      improvements: 'Pode melhorar organização e autonomia em tarefas complexas',
    },
  });

  // Felipe avalia Ana
  await prisma.assessment360.create({
    data: {
      authorId: felipe.id,
      evaluatedUserId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-15T09:20:00Z'),
      overallScore: 5,
      strengths: 'Muito organizada, sempre disposta a ajudar, excelente qualidade técnica',
      improvements: 'Já está em um nível muito bom, poderia compartilhar mais conhecimento',
    },
  });

  // Felipe avalia Bruno
  await prisma.assessment360.create({
    data: {
      authorId: felipe.id,
      evaluatedUserId: bruno.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-15T09:45:00Z'),
      overallScore: 5,
      strengths: 'Excelente líder, sempre disponível, ensina muito bem, visão técnica forte',
      improvements: 'Está em um nível muito alto, talvez poderia focar mais em estratégia',
    },
  });

  // Lucas avalia Marina - 2025.1
  await prisma.assessment360.create({
    data: {
      authorId: lucas.id,
      evaluatedUserId: marina.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-22T11:00:00Z'),
      overallScore: 5,
      strengths: 'Excelente em análises, muito organizada, entrega insights valiosos e proativa',
      improvements: 'Poderia liderar mais iniciativas de melhoria de processos analíticos',
    },
  });

  // Marina avalia Lucas - 2025.1
  await prisma.assessment360.create({
    data: {
      authorId: marina.id,
      evaluatedUserId: lucas.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-22T11:30:00Z'),
      overallScore: 5,
      strengths: 'Excelente visão de produto, muito organizado, facilita colaboração entre áreas',
      improvements: 'Já está em um nível muito alto, talvez poderia se envolver mais em mentoria',
    },
  });

  // Rafael avalia Marina - 2025.1
  await prisma.assessment360.create({
    data: {
      authorId: rafael.id,
      evaluatedUserId: marina.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-24T15:00:00Z'),
      overallScore: 4,
      strengths: 'Excelente trabalho com dados, organizada, entrega análises precisas',
      improvements: 'Poderia se envolver mais em discussões técnicas de infraestrutura',
    },
  });

  // Marina avalia Rafael - 2025.1
  await prisma.assessment360.create({
    data: {
      authorId: marina.id,
      evaluatedUserId: rafael.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-24T15:30:00Z'),
      overallScore: 4,
      strengths: 'Sólido conhecimento técnico, resolve problemas complexos, confiável',
      improvements: 'Poderia melhorar a comunicação e documentação dos processos',
    },
  });

  // ===== MENTORING ASSESSMENT CICLO 2024.2 =====
  console.log('🎓 Criando avaliações de mentoring para 2024.2...');

  // Felipe avalia Bruno (como mentor) - 2024.2
  await prisma.mentoringAssessment.create({
    data: {
      authorId: felipe.id,
      mentorId: bruno.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-30T16:30:00Z'),
      score: 4,
      justification:
        'Bruno tem sido um bom mentor, sempre disposto a ajudar e orientar meu desenvolvimento técnico',
    },
  });

  // Ana avalia Lucas (como mentor) - 2024.2
  await prisma.mentoringAssessment.create({
    data: {
      authorId: ana.id,
      mentorId: lucas.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-30T17:00:00Z'),
      score: 4,
      justification:
        'Lucas tem sido um mentor útil, me orientando em questões de produto e visão estratégica',
    },
  });

  // Bruno avalia Carla (como mentor) - 2024.2
  await prisma.mentoringAssessment.create({
    data: {
      authorId: bruno.id,
      mentorId: carla.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-30T17:30:00Z'),
      score: 4,
      justification:
        'Carla tem sido uma mentora valiosa, me orientando em questões de liderança e visão técnica estratégica',
    },
  });

  // Lucas avalia Carla (como mentor) - 2024.2
  await prisma.mentoringAssessment.create({
    data: {
      authorId: lucas.id,
      mentorId: carla.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-09-30T18:00:00Z'),
      score: 4,
      justification:
        'Carla tem sido uma mentora importante, me orientando em questões de liderança e evolução de carreira',
    },
  });

  // ===== MENTORING ASSESSMENT CICLO 2025.1 =====
  console.log('🎓 Criando avaliações de mentoring para 2025.1...');

  // Felipe avalia Bruno (como mentor) - 2025.1
  await prisma.mentoringAssessment.create({
    data: {
      authorId: felipe.id,
      mentorId: bruno.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-16T16:30:00Z'),
      score: 5,
      justification:
        'Bruno tem sido um mentor excepcional, sempre disponível para tirar dúvidas e me orientar no desenvolvimento técnico',
    },
  });

  // Ana avalia Lucas (como mentor) - 2025.1
  await prisma.mentoringAssessment.create({
    data: {
      authorId: ana.id,
      mentorId: lucas.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-16T17:00:00Z'),
      score: 5,
      justification:
        'Lucas tem sido um mentor excepcional, me orientando em questões de produto e visão estratégica',
    },
  });

  // Bruno avalia Carla (como mentor) - 2025.1
  await prisma.mentoringAssessment.create({
    data: {
      authorId: bruno.id,
      mentorId: carla.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-16T17:30:00Z'),
      score: 5,
      justification:
        'Carla tem sido uma mentora excepcional, me orientando em questões de liderança e visão técnica estratégica',
    },
  });

  // Lucas avalia Carla (como mentor) - 2025.1
  await prisma.mentoringAssessment.create({
    data: {
      authorId: lucas.id,
      mentorId: carla.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-16T18:00:00Z'),
      score: 5,
      justification:
        'Carla tem sido uma mentora excepcional, me orientando em questões de liderança e evolução de carreira',
    },
  });

  // ===== REFERENCE FEEDBACKS CICLO 2024.2 =====
  console.log('💭 Criando reference feedbacks para 2024.2...');

  // Ana dá referência para Bruno - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: ana.id,
      referencedUserId: bruno.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T10:00:00Z'),
      topic: 'Liderança Técnica',
      justification:
        'Bruno demonstra boa liderança técnica, sempre orientando a equipe com clareza',
    },
  });

  // Ana dá referência para Felipe - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: ana.id,
      referencedUserId: felipe.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T10:15:00Z'),
      topic: 'Crescimento e Aprendizado',
      justification:
        'Felipe tem mostrado crescimento constante e grande proatividade para aprender',
    },
  });

  // Bruno dá referência para Ana - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: bruno.id,
      referencedUserId: ana.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T11:00:00Z'),
      topic: 'Qualidade e Organização',
      justification:
        'Ana é referência em qualidade técnica e organização, sempre entrega trabalho de qualidade',
    },
  });

  // Bruno dá referência para Felipe - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: bruno.id,
      referencedUserId: felipe.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T11:15:00Z'),
      topic: 'Dedicação e Desenvolvimento',
      justification:
        'Felipe demonstra grande dedicação e velocidade de aprendizado, sempre busca melhorar',
    },
  });

  // Felipe dá referência para Ana - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: felipe.id,
      referencedUserId: ana.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T14:00:00Z'),
      topic: 'Colaboração e Suporte',
      justification: 'Ana é uma excelente colega, sempre disposta a ajudar e ensinar',
    },
  });

  // Felipe dá referência para Bruno - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: felipe.id,
      referencedUserId: bruno.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T14:15:00Z'),
      topic: 'Liderança e Orientação',
      justification:
        'Bruno é um líder dedicado, sempre nos desenvolve e apoia nosso crescimento',
    },
  });

  // Lucas dá referência para Marina - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: lucas.id,
      referencedUserId: marina.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T15:00:00Z'),
      topic: 'Análise e Insights',
      justification:
        'Marina entrega análises muito precisas e insights valiosos para o produto',
    },
  });

  // Marina dá referência para Lucas - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: marina.id,
      referencedUserId: lucas.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T15:30:00Z'),
      topic: 'Visão de Produto',
      justification:
        'Lucas tem excelente visão de produto e facilita muito a colaboração entre áreas',
    },
  });

  // Rafael dá referência para Marina - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: rafael.id,
      referencedUserId: marina.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T16:00:00Z'),
      topic: 'Precisão e Confiabilidade',
      justification:
        'Marina entrega análises muito precisas e é muito confiável em suas entregas',
    },
  });

  // Marina dá referência para Rafael - 2024.2
  await prisma.referenceFeedback.create({
    data: {
      authorId: marina.id,
      referencedUserId: rafael.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-01T16:30:00Z'),
      topic: 'Expertise Técnica',
      justification:
        'Rafael tem sólido conhecimento técnico e sempre resolve problemas complexos',
    },
  });

  // ===== REFERENCE FEEDBACKS CICLO 2025.1 =====
  console.log('💭 Criando reference feedbacks para 2025.1...');

  // Ana dá referência para Bruno
  await prisma.referenceFeedback.create({
    data: {
      authorId: ana.id,
      referencedUserId: bruno.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-17T10:00:00Z'),
      topic: 'Liderança Técnica',
      justification:
        'Bruno demonstra excelente liderança técnica, sempre orientando a equipe com clareza e paciência',
    },
  });

  // Ana dá referência para Felipe
  await prisma.referenceFeedback.create({
    data: {
      authorId: ana.id,
      referencedUserId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-17T10:15:00Z'),
      topic: 'Crescimento e Proatividade',
      justification:
        'Felipe tem mostrado crescimento constante e grande proatividade para aprender',
    },
  });

  // Bruno dá referência para Ana
  await prisma.referenceFeedback.create({
    data: {
      authorId: bruno.id,
      referencedUserId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-17T11:00:00Z'),
      topic: 'Qualidade e Organização',
      justification:
        'Ana é referência em qualidade técnica e organização, sempre entrega trabalho impecável',
    },
  });

  // Bruno dá referência para Felipe
  await prisma.referenceFeedback.create({
    data: {
      authorId: bruno.id,
      referencedUserId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-17T11:15:00Z'),
      topic: 'Dedicação e Aprendizado',
      justification:
        'Felipe demonstra grande dedicação e velocidade de aprendizado, sempre busca melhorar',
    },
  });

  // Felipe dá referência para Ana
  await prisma.referenceFeedback.create({
    data: {
      authorId: felipe.id,
      referencedUserId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-17T14:00:00Z'),
      topic: 'Mentoria e Colaboração',
      justification: 'Ana é uma excelente colega, sempre disposta a ajudar e ensinar',
    },
  });

  // Felipe dá referência para Bruno
  await prisma.referenceFeedback.create({
    data: {
      authorId: felipe.id,
      referencedUserId: bruno.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-17T14:15:00Z'),
      topic: 'Liderança e Desenvolvimento',
      justification:
        'Bruno é um líder excepcional, sempre nos desenvolve e apoia nosso crescimento',
    },
  });

  // Lucas dá referência para Marina - 2025.1
  await prisma.referenceFeedback.create({
    data: {
      authorId: lucas.id,
      referencedUserId: marina.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-18T15:00:00Z'),
      topic: 'Análise e Insights',
      justification:
        'Marina entrega análises excepcionais e insights valiosos para o produto',
    },
  });

  // Marina dá referência para Lucas - 2025.1
  await prisma.referenceFeedback.create({
    data: {
      authorId: marina.id,
      referencedUserId: lucas.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-18T15:30:00Z'),
      topic: 'Visão de Produto',
      justification:
        'Lucas tem excelente visão de produto e facilita muito a colaboração entre áreas',
    },
  });

  // Rafael dá referência para Marina - 2025.1
  await prisma.referenceFeedback.create({
    data: {
      authorId: rafael.id,
      referencedUserId: marina.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-19T16:00:00Z'),
      topic: 'Precisão e Confiabilidade',
      justification:
        'Marina entrega análises muito precisas e é muito confiável em suas entregas',
    },
  });

  // Marina dá referência para Rafael - 2025.1
  await prisma.referenceFeedback.create({
    data: {
      authorId: marina.id,
      referencedUserId: rafael.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-19T16:30:00Z'),
      topic: 'Expertise Técnica',
      justification:
        'Rafael tem sólido conhecimento técnico e sempre resolve problemas complexos',
    },
  });

  // ===== AVALIAÇÕES DE GESTOR COMPLETAS CICLO 2024.2 =====
  console.log('👔 Criando avaliações de gestor para 2024.2...');

  // Bruno avalia Ana (como gestor) - 2024.2
  await prisma.managerAssessment.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: ana.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-08T15:30:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Ana sempre assume responsabilidade pelos projetos',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantém-se firme e positiva diante de desafios',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Muito organizada, referência para a equipe',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busca novos conhecimentos e tecnologias',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Boa colaboração e ajuda colegas',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Entregas com boa qualidade',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpre prazos estabelecidos',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimiza recursos e busca eficiência',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Apresenta soluções criativas',
            },
          ],
        },
      },
    },
  });

  // Bruno avalia Felipe (como gestor) - 2024.2
  await prisma.managerAssessment.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: felipe.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-08T16:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 3,
              justification: 'Felipe está desenvolvendo o senso de responsabilidade',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantém-se positivo e busca soluções',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 3,
              justification: 'Ainda melhorando organização pessoal',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Excepcional velocidade de aprendizado',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Boa colaboração e espírito de equipe',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 3,
              justification: 'Entrega com qualidade, sempre melhorando',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpre prazos estabelecidos',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 3,
              justification: 'Aprendendo a otimizar recursos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 3,
              justification: 'Demonstra criatividade, ainda desenvolvendo',
            },
          ],
        },
      },
    },
  });

  // Rafael avalia Marina (como gestor) - 2024.2
  await prisma.managerAssessment.create({
    data: {
      authorId: rafael.id,
      evaluatedUserId: marina.id,
      cycle: '2024.2',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-10-08T17:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Marina assume responsabilidade pelas análises',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantém-se focada em encontrar soluções',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Excelente organização nos dados e processos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busca novas técnicas de análise',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colabora bem com equipes técnicas',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Entrega análises precisas e valiosas',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpre prazos de entregas analíticas',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimiza consultas e processos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busca insights inovadores',
            },
          ],
        },
      },
    },
  });

  // ===== AVALIAÇÕES DE GESTOR COMPLETAS CICLO 2025.1 =====
  console.log('👔 Criando avaliações de gestor para 2025.1...');

  // Bruno avalia Ana (como gestor)
  await prisma.managerAssessment.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-04-10T15:30:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 5,
              justification: 'Ana sempre assume total responsabilidade pelos projetos',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 5,
              justification: 'Mantém-se firme e positiva diante de qualquer desafio',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Extremamente organizada, referência para a equipe',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Sempre busca novos conhecimentos e tecnologias',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Excelente colaboração e sempre ajuda colegas',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Entregas sempre impecáveis e com alta qualidade',
            },
            {
              criterionId: 'atender-prazos',
              score: 5,
              justification: 'Sempre cumpre prazos, até antecipa entregas',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimiza recursos e busca eficiência',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Apresenta soluções criativas para problemas',
            },
          ],
        },
      },
    },
  });

  // Bruno avalia Felipe (como gestor)
  await prisma.managerAssessment.create({
    data: {
      authorId: bruno.id,
      evaluatedUserId: felipe.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-04-10T16:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Felipe tem desenvolvido bem o senso de responsabilidade',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantém-se positivo e busca soluções',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 3,
              justification: 'Está melhorando organização, ainda há espaço para crescer',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 5,
              justification: 'Excepcional velocidade de aprendizado',
            },
            {
              criterionId: 'team-player',
              score: 5,
              justification: 'Excelente colaboração e espírito de equipe',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 4,
              justification: 'Entrega com boa qualidade, sempre melhorando',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpre prazos de forma consistente',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 3,
              justification: 'Está aprendendo a otimizar recursos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Demonstra criatividade em soluções técnicas',
            },
          ],
        },
      },
    },
  });

  // Rafael avalia Marina (como gestor) - 2025.1
  await prisma.managerAssessment.create({
    data: {
      authorId: rafael.id,
      evaluatedUserId: marina.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-04-10T17:00:00Z'),
      answers: {
        createMany: {
          data: [
            {
              criterionId: 'sentimento-de-dono',
              score: 4,
              justification: 'Marina assume responsabilidade pelas análises e demonstra comprometimento',
            },
            {
              criterionId: 'resiliencia-adversidades',
              score: 4,
              justification: 'Mantém-se focada em encontrar soluções analíticas',
            },
            {
              criterionId: 'organizacao-trabalho',
              score: 5,
              justification: 'Excelente organização nos dados e processos analíticos',
            },
            {
              criterionId: 'capacidade-aprender',
              score: 4,
              justification: 'Busca constantemente novas técnicas de análise',
            },
            {
              criterionId: 'team-player',
              score: 4,
              justification: 'Colabora bem com equipes técnicas e de negócio',
            },
            {
              criterionId: 'entregar-qualidade',
              score: 5,
              justification: 'Entrega análises precisas e insights valiosos',
            },
            {
              criterionId: 'atender-prazos',
              score: 4,
              justification: 'Cumpre prazos de entregas analíticas',
            },
            {
              criterionId: 'fazer-mais-menos',
              score: 4,
              justification: 'Otimiza consultas e processos analíticos',
            },
            {
              criterionId: 'pensar-fora-caixa',
              score: 4,
              justification: 'Busca insights inovadores através dos dados',
            },
          ],
        },
      },
    },
  });

  // ===== AVALIAÇÕES DO COMITÊ DE EQUALIZAÇÃO CICLO 2024.2 =====
  console.log('⚖️ Criando avaliações do comitê para 2024.2...');

  // Comitê avalia Ana - 2024.2
  await prisma.committeeAssessment.create({
    data: {
      id: 'committee-ana-2024-2',
      cycle: '2024.2',
      authorId: carla.id,
      evaluatedUserId: ana.id,
      finalScore: 4,
      justification: 'Ana demonstrou excelente organização e qualidade técnica. Pontos de melhoria: assumir mais iniciativas de liderança e compartilhar mais conhecimento com a equipe.',
      observations: 'Pontos fortes: Organização exemplar, qualidade técnica consistente, colaboração efetiva. Pontos de desenvolvimento: Desenvolver habilidades de liderança, ser mais proativa em compartilhar conhecimento.',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-11-20T10:00:00Z'),
      createdAt: new Date('2024-11-20T09:30:00Z'),
      updatedAt: new Date('2024-11-20T10:00:00Z'),
    },
  });

  // Comitê avalia Bruno - 2024.2
  await prisma.committeeAssessment.create({
    data: {
      id: 'committee-bruno-2024-2',
      cycle: '2024.2',
      authorId: carla.id,
      evaluatedUserId: bruno.id,
      finalScore: 4,
      justification: 'Bruno mostrou boa liderança técnica e gestão de equipe. Pontos de melhoria: melhorar comunicação de expectativas e desenvolver mais autonomia na equipe.',
      observations: 'Pontos fortes: Liderança técnica sólida, gestão eficaz, disponibilidade para a equipe. Pontos de desenvolvimento: Comunicação mais clara de expectativas, desenvolvimento de autonomia da equipe.',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-11-20T10:30:00Z'),
      createdAt: new Date('2024-11-20T10:00:00Z'),
      updatedAt: new Date('2024-11-20T10:30:00Z'),
    },
  });

  // Comitê avalia Felipe - 2024.2
  await prisma.committeeAssessment.create({
    data: {
      id: 'committee-felipe-2024-2',
      cycle: '2024.2',
      authorId: carla.id,
      evaluatedUserId: felipe.id,
      finalScore: 3,
      justification: 'Felipe demonstrou excelente capacidade de aprendizado e colaboração. Pontos de melhoria: organização pessoal e desenvolvimento de maior autonomia.',
      observations: 'Pontos fortes: Velocidade de aprendizado excepcional, colaboração efetiva, receptividade a feedbacks. Pontos de desenvolvimento: Organização pessoal, desenvolvimento de autonomia, planejamento de tarefas.',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-11-20T11:00:00Z'),
      createdAt: new Date('2024-11-20T10:30:00Z'),
      updatedAt: new Date('2024-11-20T11:00:00Z'),
    },
  });

  // Comitê avalia Lucas - 2024.2
  await prisma.committeeAssessment.create({
    data: {
      id: 'committee-lucas-2024-2',
      cycle: '2024.2',
      authorId: carla.id,
      evaluatedUserId: lucas.id,
      finalScore: 4,
      justification: 'Lucas mostrou excelente visão de produto e facilitação entre equipes. Pontos de melhoria: comunicação mais direta de prioridades e maior envolvimento em mentoria.',
      observations: 'Pontos fortes: Visão estratégica de produto, facilitação entre áreas, pensamento inovador. Pontos de desenvolvimento: Comunicação mais direta, desenvolver habilidades de mentoria.',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-11-20T11:30:00Z'),
      createdAt: new Date('2024-11-20T11:00:00Z'),
      updatedAt: new Date('2024-11-20T11:30:00Z'),
    },
  });

  // Comitê avalia Marina - 2024.2
  await prisma.committeeAssessment.create({
    data: {
      id: 'committee-marina-2024-2',
      cycle: '2024.2',
      authorId: carla.id,
      evaluatedUserId: marina.id,
      finalScore: 4,
      justification: 'Marina entregou análises precisas e insights valiosos. Pontos de melhoria: maior proatividade em sugestões de melhorias e envolvimento em discussões técnicas.',
      observations: 'Pontos fortes: Precisão analítica, organização exemplar, insights valiosos. Pontos de desenvolvimento: Proatividade em melhorias de processo, participação em discussões técnicas.',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-11-20T12:00:00Z'),
      createdAt: new Date('2024-11-20T11:30:00Z'),
      updatedAt: new Date('2024-11-20T12:00:00Z'),
    },
  });

  // Comitê avalia Rafael - 2024.2
  await prisma.committeeAssessment.create({
    data: {
      id: 'committee-rafael-2024-2',
      cycle: '2024.2',
      authorId: carla.id,
      evaluatedUserId: rafael.id,
      finalScore: 4,
      justification: 'Rafael demonstrou sólido conhecimento técnico e resolução de problemas complexos. Pontos de melhoria: comunicação e documentação de processos, desenvolvimento de habilidades de liderança.',
      observations: 'Pontos fortes: Expertise técnica sólida, resolução de problemas complexos, confiabilidade. Pontos de desenvolvimento: Comunicação e documentação, desenvolvimento de liderança de pessoas.',
      status: 'SUBMITTED',
      submittedAt: new Date('2024-11-20T12:30:00Z'),
      createdAt: new Date('2024-11-20T12:00:00Z'),
      updatedAt: new Date('2024-11-20T12:30:00Z'),
    },
  });

  console.log('✅ Estruturas de relacionamento configuradas!');

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('✅ Seed concluído com sucesso!');
  console.log('📊 Estruturas criadas:');
  console.log(`   - ${cycles.length} ciclos de avaliação`);
  console.log(
    `   - ${criteria.length} critérios (${criteria.filter((c) => c.pillar === 'BEHAVIOR').length} comportamentais, ${criteria.filter((c) => c.pillar === 'EXECUTION').length} execução, ${criteria.filter((c) => c.pillar === 'MANAGEMENT').length} gestão)`,
  );
  console.log(`   - ${projects.length} projetos (2 com líderes definidos)`);
  console.log(`   - 9 usuários com perfis diversos incluindo líderes`);
  console.log(`   - ${roleAssignments.length} atribuições de role globais (incluindo LEADER)`);
  console.log(`   - ${projectAssignments.length} atribuições de projeto`);
  console.log(`   - ${userProjectRoles.length} roles específicas por projeto`);
  console.log('   - ✨ Relacionamentos de liderança e mentoria configurados');
  console.log('');

  // ==========================================
  // RESUMO DOS CICLOS E FASES
  // ==========================================
  console.log('🔄 Estado dos Ciclos:');
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
  console.log('🔴 Ciclo Fechado: 2024.2 na fase EQUALIZATION');
  console.log('  ✅ Todas as avaliações completas para todos os colaboradores');
  console.log('  📝 6 Autoavaliações (Ana, Bruno, Felipe, Lucas, Marina, Rafael)');
  console.log('  🔄 10 Avaliações 360° (todas as combinações entre colaboradores de projetos)');
  console.log('  🎓 4 Mentoring Assessments (Felipe→Bruno, Ana→Lucas, Bruno→Carla, Lucas→Carla)');
  console.log('  💭 10 Reference Feedbacks (todos os pares de colaboradores)');
  console.log('  👔 3 Avaliações de Gestor (Bruno→Ana/Felipe, Rafael→Marina)');
  console.log('  ⚖️ 6 Avaliações do Comitê (Carla equalizou todos os colaboradores)');
  console.log('  ✅ Ciclo Encerrado e Completamente Equalizado');
  console.log('');
  console.log('🎯 Ciclo Ativo: 2025.1 na fase EQUALIZATION');
  console.log('  ✅ Todas as avaliações completas para todos os colaboradores');
  console.log('  📝 6 Autoavaliações (Ana, Bruno, Felipe, Lucas, Marina, Rafael)');
  console.log('  🔄 10 Avaliações 360° (todas as combinações entre colaboradores de projetos)');
  console.log('  🎓 4 Mentoring Assessments (Felipe→Bruno, Ana→Lucas, Bruno→Carla, Lucas→Carla)');
  console.log('  💭 10 Reference Feedbacks (todos os pares de colaboradores)');
  console.log('  👔 3 Avaliações de Gestor (Bruno→Ana/Felipe, Rafael→Marina)');
  console.log('  ⚖️ Pronto para Equalização pelo Comitê (Carla)');
  console.log('');

  console.log('👥 Usuários disponíveis para teste:');
  console.log('');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Carla Dias | 🎯 Comitê | 💼 Head of Engineering Principal | ⚖️ Pode fazer equalização',
  );
  console.log('     🎓 Mentora: Bruno e Lucas');
  console.log('');
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Ana Oliveira | 🎯 Colaboradora | 💼 Desenvolvedora Frontend Pleno | ✅ Avaliações completas',
  );
  console.log('     👤 Gestor: Bruno | 🎓 Mentor: Lucas');
  console.log('');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Bruno Mendes | 🎯 Gestor + Colaborador | 💼 Tech Lead Sênior | ✅ Avaliações completas',
  );
  console.log('     👥 Liderados: Ana e Felipe | 🎓 Mentora: Felipe | 🎓 Mentor: Carla');
  console.log('');
  console.log('  📧 felipe.silva@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Felipe Silva | 🎯 Colaborador | 💼 Desenvolvedor Backend Júnior | ✅ Avaliações completas',
  );
  console.log('     👤 Gestor: Bruno | 🎓 Mentor: Bruno');
  console.log('');
  console.log('  📧 lucas.fernandes@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Lucas Fernandes | 🎯 Líder + Colaborador | 💼 Product Manager Sênior | 🎯 Líder do Projeto Beta',
  );
  console.log('     👥 Lidera: Marina | 🎓 Mentora: Ana | 🎓 Mentor: Carla');
  console.log('');
  console.log('  📧 marina.santos@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Marina Santos | 🎯 Colaboradora | 💼 Data Analyst Pleno',
  );
  console.log('     👤 Gestor: Rafael | 🎯 Líder: Lucas');
  console.log('');
  console.log('  📧 rafael.costa@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Rafael Costa | 🎯 Gestor + Líder + Colaborador | 💼 System Administrator Principal | 🎯 Líder do Projeto Delta',
  );
  console.log('     👥 Liderados: Marina | 👥 Lidera: Marina');
  console.log('');
  console.log('  📧 diana.costa@rocketcorp.com - Senha: password123');
  console.log('     👤 Diana Costa | 🎯 RH | 💼 People & Culture Manager Sênior');
  console.log('');
  console.log('  📧 eduardo.tech@rocketcorp.com - Senha: password123');
  console.log('     👤 Eduardo Tech | 🎯 Admin | 💼 DevOps Engineer Sênior');
  console.log('');
  console.log('🔄 Estado dos Ciclos de Avaliação:');
  console.log('  🔴 2024.2 | CLOSED | ⚖️ EQUALIZATION (Finalizado)');
  console.log('    📅 2024-07-01 a 2024-12-31 | ⏰ Equalização até 2024-11-15');
  console.log('  🟢 2025.1 | OPEN | ⚖️ EQUALIZATION (Ativo - Pronto para Comitê)');
  console.log('    📅 2024-10-01 a 2024-12-31 | ⏰ Equalização até 2024-12-30');
  console.log('  🟡 2025.2 | UPCOMING | 📝 ASSESSMENTS (Futuro)');
  console.log('    📅 2025-08-01 a 2025-12-31 | ⏰ Prazos configurados');
  console.log('');
  console.log('📋 Cronograma de Fases 2025.1:');
  console.log('  📝 Fase 1 - Avaliações: até 15/03/2025 ✅ COMPLETA');
  console.log('  👔 Fase 2 - Gestores: até 15/04/2025 ✅ COMPLETA');
  console.log('  ⚖️ Fase 3 - Equalização: até 31/05/2025 🔄 ATUAL');
  console.log('');
  console.log('✅ Sistema pronto para equalização!');
  console.log('   Carla pode fazer login e equalizar as avaliações de todos os colaboradores');
  console.log('');
  console.log('📊 TOTAL DE AVALIAÇÕES CRIADAS:');
  console.log('  📝 Autoavaliações: 12 (6 por ciclo x 2 ciclos)');
  console.log('  🔄 Avaliações 360°: 20 (10 por ciclo x 2 ciclos)');
  console.log('  🎓 Mentoring Assessments: 8 (4 por ciclo x 2 ciclos)');
  console.log('  💭 Reference Feedbacks: 20 (10 por ciclo x 2 ciclos)');
  console.log('  👔 Avaliações de Gestor: 6 (3 por ciclo x 2 ciclos)');
  console.log('  ⚖️ Avaliações do Comitê: 6 (ciclo 2024.2 finalizado)');
  console.log('  🎯 TOTAL GERAL: 72 avaliações completas!');
  console.log('');
  console.log('🎯 NOVIDADES: Funcionalidades de Liderança e Mentoria');
  console.log('');
  console.log('  👑 PROJETOS COM LÍDERES E GESTORES:');
  console.log('     🏗️ Projeto Alpha → Gestor: Bruno | Líder: -');
  console.log('     🏗️ Projeto Beta → Gestor: Diana | Líder: Lucas');
  console.log('     🏗️ Projeto Gamma → Gestor: Lucas | Líder: -');
  console.log('     ☁️ Projeto Delta → Gestor: Rafael | Líder: Rafael');
  console.log('     📱 Projeto Mobile → Gestor: Ana | Líder: -');
  console.log('     🔧 Projeto API Core → Gestor: Bruno | Líder: -');
  console.log('');
  console.log('  👥 HIERARQUIA DE LIDERANÇA:');
  console.log('     • Lucas lidera Marina no contexto do projeto');
  console.log('     • Rafael é GESTOR e LÍDER de Marina (duplo papel)');
  console.log('     • Diferentes hierarquias: gestão (Bruno→Ana/Felipe) vs liderança (Lucas→Marina)');
  console.log('');
  console.log('  🎓 REDE DE MENTORIA:');
  console.log('     • Carla (Comitê) mentora Bruno e Lucas');
  console.log('     • Bruno mentora Felipe');
  console.log('     • Lucas mentora Ana');
  console.log('');
  console.log('  🔧 TESTE AS FUNCIONALIDADES:');
  console.log('     1. Criar novos colaboradores em projetos com gestores e líderes');
  console.log('     2. Verificar atualização automática dos campos directLeadership');
  console.log('     3. Testar criação de usuários com múltiplos papéis (gestor+líder)');
  console.log('     4. Validar relacionamentos de mentoria');
  console.log('     5. Testar gestão de projetos com gestores definidos');
  console.log('     6. Verificar diferença entre gestão de pessoas vs gestão de projeto');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
