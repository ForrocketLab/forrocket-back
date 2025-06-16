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

  // Dados dos usuários seguindo a nova estrutura IUser
  const users = [
    {
      // Ana - Colaboradora Simples (Desenvolvedora Frontend)
      name: 'Ana Oliveira',
      email: 'ana.oliveira@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),
      
      // Dados organizacionais
      jobTitle: 'Desenvolvedora Frontend',
      seniority: 'Pleno',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      
      // Relacionamentos
      projects: JSON.stringify(['projeto-app-mobile', 'projeto-dashboard']),
      managerId: 'bruno-mendes-id', // Será o Bruno (gestor)
      directReports: null, // Não é gestora
      mentorId: 'carla-dias-id', // Carla como mentora
      
      isActive: true,
    },
    {
      // Bruno - Colaborador Gestor (Tech Lead)
      name: 'Bruno Mendes',
      email: 'bruno.mendes@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'gestor']),
      
      // Dados organizacionais
      jobTitle: 'Tech Lead',
      seniority: 'Sênior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      
      // Relacionamentos
      projects: JSON.stringify(['projeto-app-mobile', 'projeto-api-core', 'projeto-arquitetura']),
      managerId: 'carla-dias-id', // Carla é sua gestora
      directReports: JSON.stringify(['ana-oliveira-id', 'felipe-novo-id']), // Gerencia Ana e Felipe
      mentorId: 'carla-dias-id', // Carla também é mentora
      
      isActive: true,
    },
    {
      // Carla - Sócia/Comitê (Head of Engineering)
      name: 'Carla Dias',
      email: 'carla.dias@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'comite']),
      
      // Dados organizacionais
      jobTitle: 'Head of Engineering',
      seniority: 'Principal',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      
      // Relacionamentos
      projects: JSON.stringify(['projeto-estrategia-tech', 'projeto-arquitetura', 'projeto-inovacao']),
      managerId: null, // Sócia, não tem gestor direto
      directReports: JSON.stringify(['bruno-mendes-id', 'diana-costa-id']), // Gerencia Bruno e Diana
      mentorId: null, // Sócios podem não ter mentor
      
      isActive: true,
    },
    {
      // Diana - RH (People & Culture Manager)
      name: 'Diana Costa',
      email: 'diana.costa@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'rh']),
      
      // Dados organizacionais
      jobTitle: 'People & Culture Manager',
      seniority: 'Sênior',
      careerTrack: 'Business',
      businessUnit: 'Operations',
      
      // Relacionamentos
      projects: JSON.stringify(['projeto-cultura', 'projeto-onboarding', 'projeto-avaliacao']),
      managerId: 'carla-dias-id', // Reporta para Carla
      directReports: JSON.stringify(['felipe-rh-id']), // Tem um analista de RH
      mentorId: 'carla-dias-id',
      
      isActive: true,
    },
    {
      // Felipe - Desenvolvedor Júnior
      name: 'Felipe Silva',
      email: 'felipe.silva@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),
      
      // Dados organizacionais
      jobTitle: 'Desenvolvedor Backend',
      seniority: 'Júnior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      
      // Relacionamentos
      projects: JSON.stringify(['projeto-onboarding', 'projeto-api-core']),
      managerId: 'bruno-mendes-id', // Bruno é seu gestor
      directReports: null, // Não é gestor
      mentorId: 'ana-oliveira-id', // Ana como mentora
      
      isActive: true,
    },
    {
      // Eduardo - Admin do Sistema
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
      projects: JSON.stringify(['projeto-infraestrutura', 'projeto-seguranca', 'projeto-monitoramento']),
      managerId: null, // Admin pode não ter gestor
      directReports: null, // Foco em infraestrutura
      mentorId: null,
      
      isActive: true,
    },
  ];

  console.log('👥 Criando usuários...');

  // Cria usuários
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`✅ Usuário criado: ${user.name} (${user.email}) - ${JSON.parse(user.roles).join(', ')}`);
  }

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('👥 Usuários disponíveis para login:');
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123 (Colaboradora - Dev Frontend Pleno)');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123 (Gestor - Tech Lead Sênior)');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123 (Comitê - Head of Engineering)');
  console.log('  📧 diana.costa@rocketcorp.com - Senha: password123 (RH - People & Culture Manager)');
  console.log('  📧 felipe.silva@rocketcorp.com - Senha: password123 (Colaborador - Dev Backend Júnior)');
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