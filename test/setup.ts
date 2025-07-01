/**
 * Configuração global para os testes Jest
 * Este arquivo é executado antes de cada teste
 */

// Configurar timezone para testes consistentes
process.env.TZ = 'UTC';

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-muito-segura-para-testes';
process.env.JWT_EXPIRATION = '1h';
process.env.DATABASE_PATH = ':memory:';

// Configurar timeout global para testes assíncronos
jest.setTimeout(30000);

// Mock console.log para testes mais limpos (opcional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Configuração para testes de banco de dados
beforeAll(async () => {
  // Limpar ciclos de teste antes de todos os testes E2E
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma: InstanceType<typeof PrismaClient> = new PrismaClient();
    const mainCycles = ['2024.2', '2025.1', '2025.2'];
    await prisma.evaluationCycle.deleteMany({
      where: {
        id: { notIn: mainCycles },
      },
    });
    await prisma.$disconnect();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Aviso: Erro durante limpeza inicial de ciclos:', msg);
  }
});

afterAll(async () => {
  // Limpeza global após todos os testes
  await cleanupTestData();
});

beforeEach(() => {
  // Configurações que devem ser executadas antes de cada teste
});

afterEach(async () => {
  // Limpeza após cada teste
  jest.clearAllMocks();
  await cleanupTestData();
});

// Função de limpeza de dados de teste
async function cleanupTestData() {
  if (process.env.NODE_ENV !== 'test') return;

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma: InstanceType<typeof PrismaClient> = new PrismaClient();

    // Manter apenas os dados principais da seed
    const mainCycles = ['2024.2', '2025.1', '2025.2'];
    const mainUsers = [
      'eduardo.tech@rocketcorp.com',
      'diana.costa@rocketcorp.com',
      'carla.dias@rocketcorp.com',
      'bruno.mendes@rocketcorp.com',
      'ana.oliveira@rocketcorp.com',
      'felipe.silva@rocketcorp.com',
    ];
    const mainProjects = [
      'projeto-alpha',
      'projeto-beta',
      'projeto-gamma',
      'projeto-delta',
      'projeto-mobile-app',
      'projeto-api-core',
    ];

    // Limpar ciclos de teste
    await prisma.evaluationCycle.deleteMany({
      where: {
        id: { notIn: mainCycles },
      },
    });

    // Buscar usuários de teste para limpar relacionamentos
    const testUsers = await prisma.user.findMany({
      where: {
        email: { notIn: mainUsers },
      },
    });

    if (testUsers.length > 0) {
      const testUserIds = testUsers.map((u) => u.id);

      // Limpar relacionamentos de usuários de teste
      await prisma.userProjectRole.deleteMany({
        where: { userId: { in: testUserIds } },
      });

      await prisma.userProjectAssignment.deleteMany({
        where: { userId: { in: testUserIds } },
      });

      await prisma.userRoleAssignment.deleteMany({
        where: { userId: { in: testUserIds } },
      });

      // Limpar avaliações de usuários de teste
      await prisma.selfAssessment.deleteMany({
        where: { authorId: { in: testUserIds } },
      });

      await prisma.assessment360.deleteMany({
        where: {
          OR: [{ authorId: { in: testUserIds } }, { evaluatedUserId: { in: testUserIds } }],
        },
      });

      await prisma.managerAssessment.deleteMany({
        where: {
          OR: [{ authorId: { in: testUserIds } }, { evaluatedUserId: { in: testUserIds } }],
        },
      });

      await prisma.mentoringAssessment.deleteMany({
        where: {
          OR: [{ authorId: { in: testUserIds } }, { mentorId: { in: testUserIds } }],
        },
      });

      await prisma.referenceFeedback.deleteMany({
        where: {
          OR: [{ authorId: { in: testUserIds } }, { referencedUserId: { in: testUserIds } }],
        },
      });

      // Remover usuários de teste
      await prisma.user.deleteMany({
        where: {
          email: { notIn: mainUsers },
        },
      });
    }

    // Buscar projetos de teste para limpar relacionamentos
    const testProjects = await prisma.project.findMany({
      where: {
        id: { notIn: mainProjects },
      },
    });

    if (testProjects.length > 0) {
      const testProjectIds = testProjects.map((p) => p.id);

      // Limpar relacionamentos de projetos de teste
      await prisma.userProjectRole.deleteMany({
        where: { projectId: { in: testProjectIds } },
      });

      await prisma.userProjectAssignment.deleteMany({
        where: { projectId: { in: testProjectIds } },
      });

      // Remover projetos de teste
      await prisma.project.deleteMany({
        where: {
          id: { notIn: mainProjects },
        },
      });
    }

    await prisma.$disconnect();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Aviso: Erro durante limpeza automática:', msg);
  }
}
