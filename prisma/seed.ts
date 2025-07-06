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
      phase: 'MANAGER_REVIEWS' as const,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-07-19T23:59:59.999Z'),
      assessmentDeadline: new Date('2025-03-15T23:59:59.999Z'),
      managerDeadline: new Date('2025-07-15T23:59:59.999Z'),
      equalizationDeadline: new Date('2025-07-15T23:59:59.999Z'),
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

  // ===== AVALIAÇÕES 360° COMPLETAS =====
  console.log('🔄 Criando avaliações 360°...');

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

  // ===== MENTORING ASSESSMENT =====
  console.log('🎓 Criando avaliação de mentoring...');

  // Felipe avalia Ana (como mentora)
  await prisma.mentoringAssessment.create({
    data: {
      authorId: felipe.id,
      mentorId: ana.id,
      cycle: '2025.1',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-03-16T16:30:00Z'),
      score: 5,
      justification:
        'Ana tem sido uma mentora excepcional, sempre disponível para tirar dúvidas e me orientar no desenvolvimento técnico',
    },
  });

  // ===== REFERENCE FEEDBACKS =====
  console.log('💭 Criando reference feedbacks...');

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

  // ===== AVALIAÇÕES DE GESTOR COMPLETAS =====
  console.log('👔 Criando avaliações de gestor...');

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
  console.log(`   - ${projects.length} projetos`);
  console.log(`   - 6 usuários com perfis separados por escopo`);
  console.log(`   - ${roleAssignments.length} atribuições de role globais`);
  console.log(`   - ${projectAssignments.length} atribuições de projeto`);
  console.log(`   - ${userProjectRoles.length} roles específicas por projeto`);
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
  console.log('🎯 Ciclo Ativo: 2025.1 na fase EQUALIZATION');
  console.log('  ✅ Todas as avaliações completas para Bruno, Ana e Felipe');
  console.log('  📝 3 Autoavaliações (Ana, Bruno, Felipe)');
  console.log('  🔄 6 Avaliações 360° (todas as combinações)');
  console.log('  🎓 1 Mentoring Assessment (Felipe → Ana)');
  console.log('  💭 6 Reference Feedbacks (todos os pares)');
  console.log('  👔 2 Avaliações de Gestor (Bruno → Ana, Felipe)');
  console.log('  ⚖️ Pronto para Equalização pelo Comitê (Carla)');
  console.log('');

  console.log('👥 Usuários disponíveis para teste:');
  console.log('');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Carla Dias | 🎯 Comitê | 💼 Head of Engineering Principal | ⚖️ Pode fazer equalização',
  );
  console.log('');
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Ana Oliveira | 🎯 Colaboradora | 💼 Desenvolvedora Frontend Pleno | ✅ Avaliações completas',
  );
  console.log('');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Bruno Mendes | 🎯 Gestor + Colaborador | 💼 Tech Lead Sênior | ✅ Avaliações completas',
  );
  console.log('');
  console.log('  📧 felipe.silva@rocketcorp.com - Senha: password123');
  console.log(
    '     👤 Felipe Silva | 🎯 Colaborador | 💼 Desenvolvedor Backend Júnior | ✅ Avaliações completas',
  );
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
  console.log('   Carla pode fazer login e equalizar as avaliações de Bruno, Ana e Felipe');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
