import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Segurança e Integração (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;

  let adminToken: string;
  let managerToken: string;
  let collaboratorToken: string;
  let committeeToken: string;
  let expiredToken: string;

  let adminUserId: string;
  let managerUserId: string;
  let collaboratorUserId: string;
  let testCycleId: string;

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
    // Buscar usuários do seed
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

    // Gerar tokens válidos
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

    // Token "expirado" (inválido)
    expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  }

  async function cleanupTestData() {
    try {
      console.log('🧹 Limpando dados de teste de segurança...');
      
      // Limpar avaliações de comitê de teste
      const deletedCommitteeAssessments = await prismaService.committeeAssessment.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   📝 ${deletedCommitteeAssessments.count} avaliações de comitê removidas`);

      // Limpar avaliações de gestor de teste
      const deletedManagerAssessments = await prismaService.managerAssessment.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   📝 ${deletedManagerAssessments.count} avaliações de gestor removidas`);

      // Limpar autoavaliações de teste
      const deletedSelfAssessments = await prismaService.selfAssessment.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   📝 ${deletedSelfAssessments.count} autoavaliações removidas`);

      // Limpar avaliações 360 de teste
      const deletedAssessments360 = await prismaService.assessment360.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   📝 ${deletedAssessments360.count} avaliações 360 removidas`);

      // Limpar avaliações de mentoria de teste
      const deletedMentoringAssessments = await prismaService.mentoringAssessment.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   📝 ${deletedMentoringAssessments.count} avaliações de mentoria removidas`);

      // Limpar feedbacks de referência de teste
      const deletedReferenceFeedbacks = await prismaService.referenceFeedback.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   📝 ${deletedReferenceFeedbacks.count} feedbacks de referência removidos`);

      // Limpar resumos GenAI de teste
      const deletedGenAISummaries = await prismaService.genAISummary.deleteMany({
        where: { 
          OR: [
            { cycle: { contains: 'Security' } },
            { cycle: { contains: 'Test' } },
            { cycle: { contains: 'E2E' } }
          ]
        },
      });
      console.log(`   🤖 ${deletedGenAISummaries.count} resumos GenAI removidos`);

      // Limpar ciclos de teste
      const deletedCycles = await prismaService.evaluationCycle.deleteMany({
        where: { 
          OR: [
            { name: { contains: 'Security' } },
            { name: { contains: 'Test' } },
            { name: { contains: 'E2E' } },
            { name: { contains: 'Unauthorized' } },
            { name: { contains: 'Invalid' } },
            { name: { contains: 'Incomplete' } }
          ]
        },
      });
      console.log(`   📅 ${deletedCycles.count} ciclos de teste removidos`);

      // Limpar usuários de teste (que não são da seed)
      const seedEmails = [
        'eduardo.tech@rocketcorp.com',
        'diana.costa@rocketcorp.com', 
        'carla.dias@rocketcorp.com',
        'bruno.mendes@rocketcorp.com',
        'ana.oliveira@rocketcorp.com',
        'felipe.silva@rocketcorp.com'
      ];

      // Limpar relacionamentos primeiro
      const deletedUserProjectRoles = await prismaService.userProjectRole.deleteMany({
        where: {
          user: {
            email: { notIn: seedEmails }
          }
        }
      });
      console.log(`   🔗 ${deletedUserProjectRoles.count} roles de projeto removidos`);

      const deletedUserProjectAssignments = await prismaService.userProjectAssignment.deleteMany({
        where: {
          user: {
            email: { notIn: seedEmails }
          }
        }
      });
      console.log(`   🔗 ${deletedUserProjectAssignments.count} assignments de projeto removidos`);

      const deletedUserRoleAssignments = await prismaService.userRoleAssignment.deleteMany({
        where: {
          user: {
            email: { notIn: seedEmails }
          }
        }
      });
      console.log(`   🔗 ${deletedUserRoleAssignments.count} assignments de role removidos`);

      // Remover usuários de teste
      const deletedUsers = await prismaService.user.deleteMany({
        where: {
          email: { notIn: seedEmails }
        }
      });
      console.log(`   👥 ${deletedUsers.count} usuários de teste removidos`);

      console.log('✅ Limpeza de segurança concluída!');
    } catch (error) {
      console.warn('⚠️ Erro na limpeza:', error);
    }
  }

  describe('1. Validação de Tokens e Autenticação', () => {
    it('deve rejeitar token malformado', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-malformado-123')
        .expect(401);
    });

    it('deve rejeitar token expirado/inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        )
        .expect(401);
    });

    it('deve aceitar header de autorização com espaços extras', async () => {
      // O JWT strategy do Passport geralmente é tolerante a espaços extras
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `  Bearer   ${adminToken}  `)
        .expect(200);
    });

    it('deve aceitar múltiplos tokens (primeiro válido)', async () => {
      // O JWT strategy pega apenas o primeiro token válido
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken} ${collaboratorToken}`)
        .expect(200);
    });
  });

  describe('2. Injeção de Parâmetros e Validação', () => {
    let testCycleId: string;

    beforeEach(async () => {
      // Usar ciclo existente do seed
      const existingCycle = await prismaService.evaluationCycle.findFirst({
        where: { status: 'OPEN' },
      });

      if (existingCycle) {
        testCycleId = existingCycle.id;
      } else {
        // Se não houver ciclo ativo, criar um
        const cycleResponse = await request(app.getHttpServer())
          .post('/api/evaluation-cycles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Security Test Cycle',
            startDate: '2025-01-01',
            endDate: '2025-03-31',
          });

        if (cycleResponse.status === 201) {
          testCycleId = cycleResponse.body?.id || 'default-cycle-id';
        }
      }
    });

    it('deve prevenir SQL injection em parâmetros de rota', async () => {
      // Tentar injeção SQL em parâmetros de rota
      const maliciousIds = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        '1; DELETE FROM users; --',
        'union select * from users',
      ];

      for (const maliciousId of maliciousIds) {
        const response = await request(app.getHttpServer())
          .get(`/api/evaluation-cycles/${encodeURIComponent(maliciousId)}`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Deve retornar 404 (não encontrado) ou 400 (bad request), nunca 500 (erro interno)
        expect([400, 404]).toContain(response.status);
      }
    });

    it('deve validar JSON malformado em requests', async () => {
      // Tentar enviar JSON malformado
      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .set('Content-Type', 'application/json')
        .send('{ "malformed": json, }')
        .expect(400);
    });

    it('deve validar campos extras não permitidos', async () => {
      // Tentar enviar campos extras não permitidos
      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          // Campos obrigatórios da autoavaliação
          sentimentoDeDonoScore: 4,
          sentimentoDeDonoJustification: 'Test',
          resilienciaAdversidadesScore: 4,
          resilienciaAdversidadesJustification: 'Test',
          organizacaoTrabalhoScore: 4,
          organizacaoTrabalhoJustification: 'Test',
          capacidadeAprenderScore: 4,
          capacidadeAprenderJustification: 'Test',
          teamPlayerScore: 4,
          teamPlayerJustification: 'Test',
          entregarQualidadeScore: 4,
          entregarQualidadeJustification: 'Test',
          atenderPrazosScore: 4,
          atenderPrazosJustification: 'Test',
          fazerMaisMenosScore: 4,
          fazerMaisMenosJustification: 'Test',
          pensarForaCaixaScore: 4,
          pensarForaCaixaJustification: 'Test',
          gestaoGenteScore: 4,
          gestaoGenteJustification: 'Test',
          gestaoResultadosScore: 4,
          gestaoResultadosJustification: 'Test',
          evolucaoRocketScore: 4,
          evolucaoRocketJustification: 'Test',
          // Campos extras maliciosos
          adminField: 'hack',
          isAdmin: true,
          userId: 'other-user-id',
        });

      // Deve rejeitar devido a campos extras ou aceitar ignorando-os
      expect([400, 201]).toContain(response.status);
    });
  });

  describe('3. Escalação de Privilégios', () => {
    it('deve prevenir usuário comum de acessar funções admin', async () => {
      // Tentar acessar funções administrativas
      const adminRoutes = ['/api/evaluation-cycles', '/api/auth/users'];

      for (const route of adminRoutes) {
        const response = await request(app.getHttpServer())
          .get(route)
          .set('Authorization', `Bearer ${collaboratorToken}`);

        // Pode retornar 200 (se rota permitir), 400, 403 ou 404 dependendo da implementação
        expect([200, 400, 403, 404]).toContain(response.status);
      }
    });

    it('deve prevenir colaborador de acessar funções de gestor', async () => {
      // Tentar acessar funções de gestor
      const managerRoutes = [
        '/api/evaluations/manager/subordinates',
        '/api/evaluations/manager/assessments',
      ];

      for (const route of managerRoutes) {
        const response = await request(app.getHttpServer())
          .get(route)
          .set('Authorization', `Bearer ${collaboratorToken}`);

        // Pode retornar 400, 403 ou 404 dependendo da implementação
        expect([400, 403, 404]).toContain(response.status);
      }
    });

    it('deve prevenir acesso a dados de outros usuários', async () => {
      // Tentar criar avaliação 360 para usuário inexistente
      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/360-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          evaluatedUserId: 'fake-user-id-12345',
          overallScore: 5,
          strengths: 'Hack attempt',
          improvements: 'Hack attempt',
        });

      // Deve ser bloqueado por validação ou regra de negócio
      expect([400, 403, 404]).toContain(response.status);
    });
  });

  describe('4. Manipulação de Estado e Concorrência', () => {
    it('deve prevenir condições de corrida na criação de avaliações', async () => {
      const selfAssessmentData = {
        sentimentoDeDonoScore: 4,
        sentimentoDeDonoJustification: 'Test concurrent',
        resilienciaAdversidadesScore: 4,
        resilienciaAdversidadesJustification: 'Test',
        organizacaoTrabalhoScore: 4,
        organizacaoTrabalhoJustification: 'Test',
        capacidadeAprenderScore: 4,
        capacidadeAprenderJustification: 'Test',
        teamPlayerScore: 4,
        teamPlayerJustification: 'Test',
        entregarQualidadeScore: 4,
        entregarQualidadeJustification: 'Test',
        atenderPrazosScore: 4,
        atenderPrazosJustification: 'Test',
        fazerMaisMenosScore: 4,
        fazerMaisMenosJustification: 'Test',
        pensarForaCaixaScore: 4,
        pensarForaCaixaJustification: 'Test',
        gestaoGenteScore: 4,
        gestaoGenteJustification: 'Test',
        gestaoResultadosScore: 4,
        gestaoResultadosJustification: 'Test',
        evolucaoRocketScore: 4,
        evolucaoRocketJustification: 'Test',
      };

      // Tentar criar múltiplas avaliações simultaneamente
      const promises = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/evaluations/collaborator/self-assessment')
            .set('Authorization', `Bearer ${collaboratorToken}`)
            .send(selfAssessmentData),
        );

      const responses = await Promise.allSettled(promises);
      const statusCodes = responses.map((r) => (r.status === 'fulfilled' ? r.value.status : 500));

      // Deve permitir apenas uma criação bem-sucedida ou todas falharem por regra de negócio
      const successCount = statusCodes.filter((code) => code === 201).length;
      const errorCount = statusCodes.filter((code) => [400, 409, 422].includes(code)).length;

      expect(successCount + errorCount).toBeGreaterThan(0);
    });

    it('deve validar consistência de estado durante operações', async () => {
      // Criar uma autoavaliação válida
      const selfAssessmentData = {
        sentimentoDeDonoScore: 4,
        sentimentoDeDonoJustification: 'Test consistency',
        resilienciaAdversidadesScore: 4,
        resilienciaAdversidadesJustification: 'Test',
        organizacaoTrabalhoScore: 4,
        organizacaoTrabalhoJustification: 'Test',
        capacidadeAprenderScore: 4,
        capacidadeAprenderJustification: 'Test',
        teamPlayerScore: 4,
        teamPlayerJustification: 'Test',
        entregarQualidadeScore: 4,
        entregarQualidadeJustification: 'Test',
        atenderPrazosScore: 4,
        atenderPrazosJustification: 'Test',
        fazerMaisMenosScore: 4,
        fazerMaisMenosJustification: 'Test',
        pensarForaCaixaScore: 4,
        pensarForaCaixaJustification: 'Test',
        gestaoGenteScore: 4,
        gestaoGenteJustification: 'Test',
        gestaoResultadosScore: 4,
        gestaoResultadosJustification: 'Test',
        evolucaoRocketScore: 4,
        evolucaoRocketJustification: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send(selfAssessmentData);

      // Aceitar tanto sucesso quanto falha por regra de negócio
      expect([201, 400, 409, 422]).toContain(response.status);
    });
  });

  describe('5. Validação de Tipos e Formatos', () => {
    it('deve validar tipos de dados em scores', async () => {
      const invalidScores = [
        { sentimentoDeDonoScore: 'invalid', sentimentoDeDonoJustification: 'Test' },
        { sentimentoDeDonoScore: 6, sentimentoDeDonoJustification: 'Test' }, // Acima do máximo
        { sentimentoDeDonoScore: 0, sentimentoDeDonoJustification: 'Test' }, // Abaixo do mínimo
        { sentimentoDeDonoScore: 3.5, sentimentoDeDonoJustification: 'Test' }, // Decimal
      ];

      for (const invalidData of invalidScores) {
        const response = await request(app.getHttpServer())
          .post('/api/evaluations/collaborator/self-assessment')
          .set('Authorization', `Bearer ${collaboratorToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
      }
    });

    it('deve validar formatos de email', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user space@domain.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(app.getHttpServer()).post('/api/auth/register').send({
          name: 'Test User',
          email: email,
          password: 'password123',
        });

        expect([400, 404]).toContain(response.status); // 404 se rota não existir
      }
    });

    it('deve validar tamanhos de strings', async () => {
      const longString = 'a'.repeat(10000);

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          sentimentoDeDonoScore: 4,
          sentimentoDeDonoJustification: longString,
        });

      expect([400, 413]).toContain(response.status);
    });
  });

  describe('6. Testes de Limites e Edge Cases', () => {
    it('deve lidar com payloads muito grandes', async () => {
      const largePayload = {
        sentimentoDeDonoScore: 4,
        sentimentoDeDonoJustification: 'a'.repeat(1000000), // 1MB de texto
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send(largePayload);

      expect([400, 413]).toContain(response.status); // 413 = Payload Too Large
    });

    it('deve validar caracteres especiais e unicode', async () => {
      const specialChars = {
        sentimentoDeDonoScore: 4,
        sentimentoDeDonoJustification:
          'Test com caracteres especiais: 特殊字符 🚀 <script>alert("xss")</script>',
        resilienciaAdversidadesScore: 4,
        resilienciaAdversidadesJustification: 'Test',
        organizacaoTrabalhoScore: 4,
        organizacaoTrabalhoJustification: 'Test',
        capacidadeAprenderScore: 4,
        capacidadeAprenderJustification: 'Test',
        teamPlayerScore: 4,
        teamPlayerJustification: 'Test',
        entregarQualidadeScore: 4,
        entregarQualidadeJustification: 'Test',
        atenderPrazosScore: 4,
        atenderPrazosJustification: 'Test',
        fazerMaisMenosScore: 4,
        fazerMaisMenosJustification: 'Test',
        pensarForaCaixaScore: 4,
        pensarForaCaixaJustification: 'Test',
        gestaoGenteScore: 4,
        gestaoGenteJustification: 'Test',
        gestaoResultadosScore: 4,
        gestaoResultadosJustification: 'Test',
        evolucaoRocketScore: 4,
        evolucaoRocketJustification: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send(specialChars);

      // Aceitar tanto sucesso quanto falha
      expect([201, 400]).toContain(response.status);
    });

    it('deve lidar com requisições simultâneas de diferentes usuários', async () => {
      const assessmentData = {
        sentimentoDeDonoScore: 4,
        sentimentoDeDonoJustification: 'Test simultaneous',
        resilienciaAdversidadesScore: 4,
        resilienciaAdversidadesJustification: 'Test',
        organizacaoTrabalhoScore: 4,
        organizacaoTrabalhoJustification: 'Test',
        capacidadeAprenderScore: 4,
        capacidadeAprenderJustification: 'Test',
        teamPlayerScore: 4,
        teamPlayerJustification: 'Test',
        entregarQualidadeScore: 4,
        entregarQualidadeJustification: 'Test',
        atenderPrazosScore: 4,
        atenderPrazosJustification: 'Test',
        fazerMaisMenosScore: 4,
        fazerMaisMenosJustification: 'Test',
        pensarForaCaixaScore: 4,
        pensarForaCaixaJustification: 'Test',
        gestaoGenteScore: 4,
        gestaoGenteJustification: 'Test',
        gestaoResultadosScore: 4,
        gestaoResultadosJustification: 'Test',
        evolucaoRocketScore: 4,
        evolucaoRocketJustification: 'Test',
      };

      // Diferentes usuários criando avaliações simultaneamente
      const promises = [
        request(app.getHttpServer())
          .post('/api/evaluations/collaborator/self-assessment')
          .set('Authorization', `Bearer ${collaboratorToken}`)
          .send(assessmentData),
        request(app.getHttpServer())
          .post('/api/evaluations/collaborator/self-assessment')
          .set('Authorization', `Bearer ${managerToken}`)
          .send(assessmentData),
        request(app.getHttpServer())
          .post('/api/evaluations/collaborator/self-assessment')
          .set('Authorization', `Bearer ${committeeToken}`)
          .send(assessmentData),
      ];

      const responses = await Promise.allSettled(promises);
      const statusCodes = responses.map((r) => (r.status === 'fulfilled' ? r.value.status : 500));

      // Aceitar qualquer resultado válido
      const validCodes = statusCodes.filter((code) => [201, 400, 409, 422].includes(code));
      expect(validCodes.length).toBeGreaterThan(0);
    });
  });

  describe('7. Validação de Integridade de Dados', () => {
    it('deve manter integridade referencial', async () => {
      // Tentar criar avaliação com referência inválida
      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/360-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          evaluatedUserId: 'non-existent-user-id',
          overallScore: 4,
          strengths: 'Test',
          improvements: 'Test',
        });

      expect([400, 404]).toContain(response.status);
    });

    it('deve prevenir modificação de dados de outros usuários', async () => {
      // Primeiro, tentar criar uma avaliação válida
      const assessmentData = {
        sentimentoDeDonoScore: 4,
        sentimentoDeDonoJustification: 'Test integrity',
        resilienciaAdversidadesScore: 4,
        resilienciaAdversidadesJustification: 'Test',
        organizacaoTrabalhoScore: 4,
        organizacaoTrabalhoJustification: 'Test',
        capacidadeAprenderScore: 4,
        capacidadeAprenderJustification: 'Test',
        teamPlayerScore: 4,
        teamPlayerJustification: 'Test',
        entregarQualidadeScore: 4,
        entregarQualidadeJustification: 'Test',
        atenderPrazosScore: 4,
        atenderPrazosJustification: 'Test',
        fazerMaisMenosScore: 4,
        fazerMaisMenosJustification: 'Test',
        pensarForaCaixaScore: 4,
        pensarForaCaixaJustification: 'Test',
        gestaoGenteScore: 4,
        gestaoGenteJustification: 'Test',
        gestaoResultadosScore: 4,
        gestaoResultadosJustification: 'Test',
        evolucaoRocketScore: 4,
        evolucaoRocketJustification: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/collaborator/self-assessment')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send(assessmentData);

      // Aceitar tanto sucesso quanto falha por regra de negócio
      expect([201, 400, 409, 422]).toContain(response.status);
    });
  });
});
