import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpa dados existentes (opcional - remova se quiser manter dados)
  console.log('🧹 Limpando dados existentes...');
  await prisma.user.deleteMany();

  // Cria senha hasheada
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('👥 Criando usuários...');

  // PASSO 1: Criar usuários sem relacionamentos primeiro
  const ana = await prisma.user.create({
    data: {
      name: 'Ana Oliveira',
      email: 'ana.oliveira@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),

      // Dados organizacionais
      jobTitle: 'Desenvolvedora Frontend',
      seniority: 'Pleno',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Relacionamentos temporários (serão atualizados depois)
      projects: JSON.stringify(['projeto-app-mobile', 'projeto-dashboard']),
      managerId: null,
      directReports: null,
      mentorId: null,

      isActive: true,
    },
  });
  console.log(`✅ Usuário criado: ${ana.name} (${ana.email})`);

  const bruno = await prisma.user.create({
    data: {
      name: 'Bruno Mendes',
      email: 'bruno.mendes@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'gestor']),

      // Dados organizacionais
      jobTitle: 'Tech Lead',
      seniority: 'Sênior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Relacionamentos temporários
      projects: JSON.stringify(['projeto-app-mobile', 'projeto-api-core', 'projeto-arquitetura']),
      managerId: null,
      directReports: JSON.stringify([]),
      mentorId: null,

      isActive: true,
    },
  });
  console.log(`✅ Usuário criado: ${bruno.name} (${bruno.email})`);

  const carla = await prisma.user.create({
    data: {
      name: 'Carla Dias',
      email: 'carla.dias@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'comite']),

      // Dados organizacionais
      jobTitle: 'Head of Engineering',
      seniority: 'Principal',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Relacionamentos temporários
      projects: JSON.stringify([
        'projeto-estrategia-tech',
        'projeto-arquitetura',
        'projeto-inovacao',
      ]),
      managerId: null,
      directReports: JSON.stringify([]),
      mentorId: null,

      isActive: true,
    },
  });
  console.log(`✅ Usuário criado: ${carla.name} (${carla.email})`);

  const diana = await prisma.user.create({
    data: {
      name: 'Diana Costa',
      email: 'diana.costa@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'rh']),

      // Dados organizacionais
      jobTitle: 'People & Culture Manager',
      seniority: 'Sênior',
      careerTrack: 'Business',
      businessUnit: 'Operations',

      // Relacionamentos temporários
      projects: JSON.stringify(['projeto-cultura', 'projeto-onboarding', 'projeto-avaliacao']),
      managerId: null,
      directReports: JSON.stringify([]),
      mentorId: null,

      isActive: true,
    },
  });
  console.log(`✅ Usuário criado: ${diana.name} (${diana.email})`);

  const felipe = await prisma.user.create({
    data: {
      name: 'Felipe Silva',
      email: 'felipe.silva@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),

      // Dados organizacionais
      jobTitle: 'Desenvolvedor Backend',
      seniority: 'Júnior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',

      // Relacionamentos temporários
      projects: JSON.stringify(['projeto-onboarding', 'projeto-api-core']),
      managerId: null,
      directReports: null,
      mentorId: null,

      isActive: true,
    },
  });
  console.log(`✅ Usuário criado: ${felipe.name} (${felipe.email})`);

  const eduardo = await prisma.user.create({
    data: {
      name: 'Eduardo Tech',
      email: 'eduardo.tech@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['admin']),

      // Dados organizacionais
      jobTitle: 'DevOps Engineer',
      seniority: 'Sênior',
      careerTrack: 'Tech',
      businessUnit: 'Operations',

      // Relacionamentos
      projects: JSON.stringify([
        'projeto-infraestrutura',
        'projeto-seguranca',
        'projeto-monitoramento',
      ]),
      managerId: null,
      directReports: null,
      mentorId: null,

      isActive: true,
    },
  });
  console.log(`✅ Usuário criado: ${eduardo.name} (${eduardo.email})`);

  console.log('🔗 Configurando relacionamentos...');

  // PASSO 2: Atualizar relacionamentos com os IDs reais

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

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('👥 Usuários disponíveis para login:');
  console.log(
    '  📧 ana.oliveira@rocketcorp.com - Senha: password123 (Colaboradora - Dev Frontend Pleno)',
  );
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123 (Gestor - Tech Lead Sênior)');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123 (Comitê - Head of Engineering)');
  console.log(
    '  📧 diana.costa@rocketcorp.com - Senha: password123 (RH - People & Culture Manager)',
  );
  console.log(
    '  📧 felipe.silva@rocketcorp.com - Senha: password123 (Colaborador - Dev Backend Júnior)',
  );
  console.log('  📧 eduardo.tech@rocketcorp.com - Senha: password123 (Admin - DevOps Engineer)');
  console.log('');
  console.log('🏢 Estrutura Organizacional:');
  console.log('  👑 Carla Dias (Head) → Bruno Mendes (Tech Lead) → Ana Oliveira & Felipe Silva');
  console.log('  👑 Carla Dias (Head) → Diana Costa (RH)');
  console.log('  🔧 Eduardo Tech (Admin - Independente)');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
