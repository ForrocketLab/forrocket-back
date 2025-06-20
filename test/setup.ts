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
  // Configurações globais que devem ser executadas antes de todos os testes
});

afterAll(async () => {
  // Limpeza global após todos os testes
  await cleanupTestData();
});

beforeEach(() => {
  // Configurações que devem ser executadas antes de cada teste
});

afterEach(() => {
  // Limpeza após cada teste
  jest.clearAllMocks();
});

// Função de limpeza de dados de teste
async function cleanupTestData() {
  if (process.env.NODE_ENV !== 'test') return;
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Padrões que indicam dados de teste
    const testPatterns = ['Test', 'test', 'TESTE', 'Mock', 'Example', 'E2E', 'Fake'];
    
    // Limpar ciclos de teste
    for (const pattern of testPatterns) {
      await prisma.evaluationCycle.deleteMany({
        where: { name: { contains: pattern } },
      });
    }
    
    // Limpar usuários de teste
    for (const pattern of testPatterns) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { name: { contains: pattern } },
            { email: { contains: pattern } },
          ],
        },
      });
    }
    
    // Limpar projetos de teste
    for (const pattern of testPatterns) {
      await prisma.project.deleteMany({
        where: {
          OR: [
            { name: { contains: pattern } },
          ],
        },
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    // Silenciar erros de limpeza para não afetar os testes
    console.warn('⚠️ Aviso: Erro durante limpeza automática:', error.message);
  }
} 