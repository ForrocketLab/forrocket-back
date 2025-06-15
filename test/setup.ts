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
});

beforeEach(() => {
  // Configurações que devem ser executadas antes de cada teste
});

afterEach(() => {
  // Limpeza após cada teste
  jest.clearAllMocks();
}); 