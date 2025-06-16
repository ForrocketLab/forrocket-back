import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Sistema de Autenticação (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configurar ValidationPipe como na aplicação real
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/status (GET)', () => {
    it('deve retornar status da API sem autenticação', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/status').expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        message: 'API de autenticação RPE funcionando',
        timestamp: expect.any(String),
        version: '1.0.0',
      });
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('deve fazer login com Ana Oliveira', async () => {
      const loginData = {
        email: 'ana.oliveira@rocketcorp.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual({
        id: expect.any(String),
        name: 'Ana Oliveira',
        email: 'ana.oliveira@rocketcorp.com',
        roles: ['colaborador'],
      });

      // Salvar token para próximos testes
      authToken = response.body.token;
    });

    it('deve fazer login com Bruno Mendes (gestor)', async () => {
      const loginData = {
        email: 'bruno.mendes@rocketcorp.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user).toEqual({
        id: expect.any(String),
        name: 'Bruno Mendes',
        email: 'bruno.mendes@rocketcorp.com',
        roles: ['colaborador', 'gestor'],
      });
    });

    it('deve fazer login com Carla Dias (comitê)', async () => {
      const loginData = {
        email: 'carla.dias@rocketcorp.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user).toEqual({
        id: expect.any(String),
        name: 'Carla Dias',
        email: 'carla.dias@rocketcorp.com',
        roles: ['colaborador', 'comite'],
      });
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const loginData = {
        email: 'ana.oliveira@rocketcorp.com',
        password: 'senhaerrada',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toEqual({
        message: 'Senha incorreta',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve rejeitar login com usuário inexistente', async () => {
      const loginData = {
        email: 'inexistente@rocketcorp.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body).toEqual({
        message: 'Usuário não encontrado',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('deve validar formato do email', async () => {
      const loginData = {
        email: 'email-inválido',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Email deve ter um formato válido');
    });

    it('deve validar senha obrigatória', async () => {
      const loginData = {
        email: 'ana.oliveira@rocketcorp.com',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Senha é obrigatória');
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        name: 'Ana Oliveira',
        email: 'ana.oliveira@rocketcorp.com',
        roles: ['colaborador'],
        jobTitle: 'Desenvolvedora Frontend',
        seniority: 'Pleno',
        careerTrack: 'Tech',
        businessUnit: 'Digital Products',
        projects: ['projeto-app-mobile', 'projeto-dashboard'],
        managerId: expect.any(String),
        mentorId: expect.any(String),
        directReports: [],
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('deve rejeitar acesso sem token', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/profile').expect(401);

      expect(response.body).toEqual({
        message: 'Token inválido ou expirado',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve rejeitar token inválido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-inválido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Token inválido ou expirado',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('Fluxo completo de autenticação', () => {
    it('deve executar fluxo completo: login -> profile -> status', async () => {
      // 1. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'bruno.mendes@rocketcorp.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.token;

      // 2. Acessar profile
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.name).toBe('Bruno Mendes');
      expect(profileResponse.body.roles).toContain('gestor');

      // 3. Verificar status
      const statusResponse = await request(app.getHttpServer()).get('/api/auth/status').expect(200);

      expect(statusResponse.body.status).toBe('ok');
    });
  });
});
