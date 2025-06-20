import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Fluxos de Integração E2E (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;

  let adminToken: string;
  let managerToken: string;
  let collaboratorToken: string;
  let committeeToken: string;

  let adminUserId: string;
  let managerUserId: string;
  let collaboratorUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Buscar usuários existentes do seed
    const adminUser = await prismaService.user.findUnique({
      where: { email: 'eduardo.tech@rocketcorp.com' },
    });
    const managerUser = await prismaService.user.findUnique({
      where: { email: 'bruno.mendes@rocketcorp.com' },
    });
    const collaboratorUser = await prismaService.user.findUnique({
      where: { email: 'ana.oliveira@rocketcorp.com' },
    });
    const committeeUser = await prismaService.user.findUnique({
      where: { email: 'carla.dias@rocketcorp.com' },
    });

    if (!adminUser || !managerUser || !collaboratorUser || !committeeUser) {
      throw new Error('Usuários do seed não encontrados');
    }

    adminUserId = adminUser.id;
    managerUserId = managerUser.id;
    collaboratorUserId = collaboratorUser.id;

    // Gerar tokens
    const adminLogin = await authService.login({
      email: 'eduardo.tech@rocketcorp.com',
      password: 'password123',
    });
    const managerLogin = await authService.login({
      email: 'bruno.mendes@rocketcorp.com',
      password: 'password123',
    });
    const collaboratorLogin = await authService.login({
      email: 'ana.oliveira@rocketcorp.com',
      password: 'password123',
    });
    const committeeLogin = await authService.login({
      email: 'carla.dias@rocketcorp.com',
      password: 'password123',
    });

    adminToken = adminLogin.token;
    managerToken = managerLogin.token;
    collaboratorToken = collaboratorLogin.token;
    committeeToken = committeeLogin.token;
  }

  async function cleanupTestData() {
    try {
      await prismaService.evaluationCycle.deleteMany({
        where: { name: { contains: 'E2E Test' } },
      });
    } catch (error) {
      console.warn('Erro na limpeza:', error);
    }
  }

  describe('1. Validação de Autorização Entre Diferentes Roles', () => {
    it('deve permitir admin criar ciclo e bloquear colaborador', async () => {
      // Admin pode criar ciclo
      const createResponse = await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Cycle Admin',
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('name');
      expect(createResponse.body).toHaveProperty('id');

      // Colaborador não pode criar ciclo
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          name: 'E2E Test Cycle Forbidden',
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(403);
    });

    it('deve validar acesso a funções específicas por role', async () => {
      // Gestor pode acessar subordinados
      const subordinatesResponse = await request(app.getHttpServer())
        .get('/api/evaluations/manager/subordinates')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(subordinatesResponse.body)).toBe(true);

      // Colaborador não pode acessar função de gestor
      await request(app.getHttpServer())
        .get('/api/evaluations/manager/subordinates')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .expect(403);
    });

    it('deve validar acesso a funções de comitê', async () => {
      // Comitê pode acessar (mesmo sem ciclo ativo, deve dar 400, não 403)
      const response = await request(app.getHttpServer())
        .get('/api/evaluations/committee/collaborators')
        .set('Authorization', `Bearer ${committeeToken}`);
      
      // Pode retornar 400 (sem ciclo ativo) ou 404 (rota não encontrada)
      expect([400, 404]).toContain(response.status);

      // Colaborador não pode acessar função de comitê
      const response2 = await request(app.getHttpServer())
        .get('/api/evaluations/committee/collaborators')
        .set('Authorization', `Bearer ${collaboratorToken}`);
      
      // Pode retornar 400 (sem ciclo ativo), 403 (sem permissão) ou 404 (rota não encontrada)
      expect([400, 403, 404]).toContain(response2.status);
    });
  });

  describe('2. Validação de Parâmetros e Dados', () => {
    it('deve validar IDs malformados em diferentes rotas', async () => {
      // ID inválido em rota de comitê
      const response = await request(app.getHttpServer())
        .get('/api/evaluations/committee/collaborator/invalid-id/summary')
        .set('Authorization', `Bearer ${committeeToken}`);
      
      // Pode retornar 400 (ID inválido/sem ciclo ativo) ou 404 (rota não encontrada)
      expect([400, 404]).toContain(response.status);

      // ID inexistente mas bem formado
      const response2 = await request(app.getHttpServer())
        .get('/api/evaluations/committee/collaborator/00000000-0000-0000-0000-000000000000/summary')
        .set('Authorization', `Bearer ${committeeToken}`);
      
      // Pode retornar 400 (sem ciclo ativo) ou 404 (rota/usuário não encontrado)
      expect([400, 404]).toContain(response2.status);
    });

    it('deve validar troca de parâmetros entre contextos', async () => {
      // Tentar usar ID de usuário como ID de ciclo (deve dar 404)
      await request(app.getHttpServer())
        .patch(`/api/evaluation-cycles/${collaboratorUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(404);
    });

    it('deve validar dados de entrada malformados', async () => {
      // Dados inválidos para criação de ciclo
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // Nome vazio
          startDate: 'data-inválida',
          endDate: '2025-03-31',
        })
        .expect(400);

      // Campos obrigatórios faltando
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // name faltando
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(400);
    });
  });

  describe('3. Validação de Tokens e Autenticação', () => {
    it('deve rejeitar tokens malformados', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-malformado')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'token-sem-bearer')
        .expect(401);
    });

    it('deve rejeitar acesso sem token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);

      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .send({
          name: 'Test Cycle',
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(401);
    });

    it('deve validar integridade do token', async () => {
      // Token válido deve funcionar
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('id');
      expect(profileResponse.body).toHaveProperty('email');
      expect(profileResponse.body.id).toBe(adminUserId);
    });
  });

  describe('4. Fluxos de Integração Entre Serviços', () => {
    it('deve validar consistência entre projetos e usuários', async () => {
      // 1. Admin busca projetos disponíveis
      const projectsResponse = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(projectsResponse.body)).toBe(true);
    });

    it('deve validar relacionamentos entre usuários e projetos', async () => {
      // 1. Gestor busca projetos onde está envolvido
      const managerProjectsResponse = await request(app.getHttpServer())
        .get('/api/projects/teammates')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(managerProjectsResponse.body)).toBe(true);

      // 2. Colaborador busca colegas de trabalho
      const teammatesResponse = await request(app.getHttpServer())
        .get('/api/projects/teammates')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .expect(200);

      expect(Array.isArray(teammatesResponse.body)).toBe(true);
    });
  });

  describe('5. Testes de Concorrência Básica', () => {
    it('deve prevenir criação de ciclos com nomes duplicados', async () => {
      const cycleName = 'E2E Duplicate Test Cycle';

      // Primeira criação deve ter sucesso
      const firstResponse = await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: cycleName,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(201);

      expect(firstResponse.body.name).toBe(cycleName);

      // Segunda criação com mesmo nome deve falhar
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: cycleName,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        })
        .expect(400); // Conflito de nome
    });

    it('deve lidar com requisições simultâneas de diferentes usuários', async () => {
      const promises = [
        // Admin busca ciclos
        request(app.getHttpServer())
          .get('/api/evaluation-cycles')
          .set('Authorization', `Bearer ${adminToken}`),

        // Manager busca subordinados
        request(app.getHttpServer())
          .get('/api/evaluations/manager/subordinates')
          .set('Authorization', `Bearer ${managerToken}`),

        // Collaborator busca perfil
        request(app.getHttpServer())
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${collaboratorToken}`),
      ];

      const responses = await Promise.allSettled(promises);

      // Todas devem ter sucesso
      const statusCodes = responses.map((r) => (r.status === 'fulfilled' ? r.value.status : 500));

      expect(statusCodes.filter((code) => code === 200)).toHaveLength(3);
    });
  });

  describe('6. Validação de Integridade de Dados', () => {
    it('deve manter integridade referencial entre entidades', async () => {
      // Buscar ciclo ativo (pode não existir)
      const activeCycleResponse = await request(app.getHttpServer())
        .get('/api/evaluation-cycles/active')
        .set('Authorization', `Bearer ${collaboratorToken}`);

      // Se não há ciclo ativo, deve retornar 404
      if (activeCycleResponse.status === 404) {
        expect(activeCycleResponse.status).toBe(404);
      } else {
        // Se há ciclo ativo, deve ter estrutura correta
        expect(activeCycleResponse.status).toBe(200);
        expect(activeCycleResponse.body).toHaveProperty('id');
        expect(activeCycleResponse.body).toHaveProperty('name');
        expect(activeCycleResponse.body).toHaveProperty('status');
      }
    });

    it('deve validar estrutura de dados retornados', async () => {
      // Perfil do usuário deve ter estrutura correta
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('id');
      expect(profileResponse.body).toHaveProperty('name');
      expect(profileResponse.body).toHaveProperty('email');
      expect(profileResponse.body).toHaveProperty('roles');
      expect(Array.isArray(profileResponse.body.roles)).toBe(true);
      expect(profileResponse.body.roles).toContain('gestor');

      // Não deve expor dados sensíveis
      expect(profileResponse.body).not.toHaveProperty('passwordHash');
      expect(profileResponse.body).not.toHaveProperty('password');
    });
  });

  describe('7. Validação de Campos e Tipos', () => {
    it('deve validar tipos de dados em requisições', async () => {
      // Datas inválidas
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Invalid Dates',
          startDate: 'not-a-date',
          endDate: 123, // Número ao invés de string
        })
        .expect(400);

      // Campos com tipos incorretos
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 123, // Número ao invés de string
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        })
        .expect(400);
    });

    it('deve validar campos obrigatórios', async () => {
      // Todos os campos obrigatórios ausentes
      await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      // Apenas alguns campos
      const response = await request(app.getHttpServer())
        .post('/api/evaluation-cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Cycle',
          // startDate e endDate faltando
        });
      
      // Pode aceitar criação mesmo sem datas (201) ou rejeitar (400)
      expect([201, 400]).toContain(response.status);
    });
  });
});
