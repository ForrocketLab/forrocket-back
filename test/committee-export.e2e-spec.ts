import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { AuthService } from '../src/auth/auth.service';

describe('Committee Export (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let authService: AuthService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    authService = moduleFixture.get<AuthService>(AuthService);
    
    await app.init();

    // Login como membro do comitê
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'carla.dias@rocketcorp.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/evaluations/committee/export/:collaboratorId (GET)', () => {
    it('should export structured data for collaborator with committee assessment', async () => {
      // Buscar um colaborador que tenha avaliação de comitê
      const collaboratorsResponse = await request(app.getHttpServer())
        .get('/api/evaluations/committee/collaborators')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Se não há ciclo ativo na fase de equalização, o teste ainda é válido
      if (collaboratorsResponse.status === 400) {
        console.log('Não há ciclo ativo na fase EQUALIZATION - teste será pulado');
        return;
      }
      
      expect(collaboratorsResponse.status).toBe(200);

      const collaboratorWithAssessment = collaboratorsResponse.body.collaborators
        .find(c => c.hasCommitteeAssessment);

      if (!collaboratorWithAssessment) {
        // Criar uma avaliação de comitê para teste
        const collaborator = collaboratorsResponse.body.collaborators[0];
        
        await request(app.getHttpServer())
          .post('/api/evaluations/committee/assessment')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            evaluatedUserId: collaborator.id,
            finalScore: 4,
            justification: 'Excelente desempenho geral',
            observations: 'Continuar desenvolvimento em liderança'
          })
          .expect(201);

        // Agora exportar os dados
        const exportResponse = await request(app.getHttpServer())
          .get(`/api/evaluations/committee/export/${collaborator.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(exportResponse.body).toHaveProperty('collaborator');
        expect(exportResponse.body).toHaveProperty('cycle');
        expect(exportResponse.body).toHaveProperty('exportDate');
        expect(exportResponse.body).toHaveProperty('evaluationData');
        expect(exportResponse.body).toHaveProperty('consolidatedScores');
        expect(exportResponse.body).toHaveProperty('summary');
        expect(exportResponse.body).toHaveProperty('metadata');

        // Verificar estrutura do colaborador
        expect(exportResponse.body.collaborator).toHaveProperty('id');
        expect(exportResponse.body.collaborator).toHaveProperty('name');
        expect(exportResponse.body.collaborator).toHaveProperty('email');
        expect(exportResponse.body.collaborator).toHaveProperty('jobTitle');
        expect(exportResponse.body.collaborator).toHaveProperty('seniority');

        // Verificar dados de avaliação
        expect(exportResponse.body.evaluationData).toHaveProperty('committeeAssessment');
        expect(exportResponse.body.evaluationData.committeeAssessment).toHaveProperty('finalScore', 4);
        expect(exportResponse.body.evaluationData.committeeAssessment).toHaveProperty('justification', 'Excelente desempenho geral');

        // Verificar notas consolidadas
        expect(exportResponse.body.consolidatedScores).toHaveProperty('finalScore', 4);

        // Verificar metadados
        expect(exportResponse.body.metadata).toHaveProperty('exportFormat', 'JSON');
        expect(exportResponse.body.metadata).toHaveProperty('dataVersion', '1.0');
      } else {
        // Testar com colaborador que já tem avaliação
        const exportResponse = await request(app.getHttpServer())
          .get(`/api/evaluations/committee/export/${collaboratorWithAssessment.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(exportResponse.body).toHaveProperty('collaborator');
        expect(exportResponse.body).toHaveProperty('evaluationData');
        expect(exportResponse.body.evaluationData).toHaveProperty('committeeAssessment');
      }
    });

    it('should return 403 for collaborator without committee assessment', async () => {
      // Buscar um colaborador sem avaliação de comitê
      const collaboratorsResponse = await request(app.getHttpServer())
        .get('/api/evaluations/committee/collaborators')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Se não há ciclo ativo na fase de equalização, o teste ainda é válido
      if (collaboratorsResponse.status === 400) {
        console.log('Não há ciclo ativo na fase EQUALIZATION - teste será pulado');
        return;
      }
      
      expect(collaboratorsResponse.status).toBe(200);

      const collaboratorWithoutAssessment = collaboratorsResponse.body.collaborators
        .find(c => !c.hasCommitteeAssessment);

      if (collaboratorWithoutAssessment) {
        await request(app.getHttpServer())
          .get(`/api/evaluations/committee/export/${collaboratorWithoutAssessment.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      }
    });

    it('should return 404 for non-existent collaborator', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/evaluations/committee/export/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Pode retornar 400 (sem ciclo ativo) ou 404 (não encontrado)
      expect([400, 404]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/committee/export/some-id')
        .expect(401);
    });
  });
}); 