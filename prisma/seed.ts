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

  // Dados dos usuários
  const users = [
    {
      name: 'Ana Oliveira',
      email: 'ana.oliveira@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador']),
      isActive: true,
    },
    {
      name: 'Bruno Mendes',
      email: 'bruno.mendes@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'gestor']),
      isActive: true,
    },
    {
      name: 'Carla Dias',
      email: 'carla.dias@rocketcorp.com',
      passwordHash: hashedPassword,
      roles: JSON.stringify(['colaborador', 'comite']),
      isActive: true,
    },
  ];

  console.log('👥 Criando usuários...');

  // Cria usuários
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
  }

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('👥 Usuários disponíveis para login:');
  console.log('  📧 ana.oliveira@rocketcorp.com - Senha: password123 (Colaborador)');
  console.log('  📧 bruno.mendes@rocketcorp.com - Senha: password123 (Gestor)');
  console.log('  📧 carla.dias@rocketcorp.com - Senha: password123 (Comitê)');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 