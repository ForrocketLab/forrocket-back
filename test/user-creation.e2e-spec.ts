import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('User Creation (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let hrToken: string;
  let collaboratorToken: string;

  const validUserData = {
    name: 'João Silva Santos',
    email: 'joao.santos@rocketcorp.com',
    password: 'MinhaSenh@123',
    jobTitle: 'Desenvolvedor Backend',
    seniority: 'Júnior',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products',
    projectAssignments: [
      {
        projectId: 'projeto-delta',
        roleInProject: 'colaborador'
      }
    ],
    mentorId: 'cmc06gfpa0002tz1cymfs5rww' // Carla Dias como mentor
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar ValidationPipe globalmente como na aplicação real
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Gerar tokens para diferentes tipos de usuário
    await generateTestTokens();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Limpar usuários criados nos testes (manter apenas os de seed)
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'teste'
        }
      }
    });
  });

  async function generateTestTokens() {
    // Token de admin
    const adminUser = await prismaService.user.findUnique({
      where: { email: 'eduardo.tech@rocketcorp.com' }
    });
    if (adminUser) {
      const loginResult = await authService.login({
        email: 'eduardo.tech@rocketcorp.com',
        password: 'password123'
      });
      adminToken = loginResult.token;
    }

    // Token de RH  
    const hrUser = await prismaService.user.findUnique({
      where: { email: 'diana.costa@rocketcorp.com' }
    });
    if (hrUser) {
      const loginResult = await authService.login({
        email: 'diana.costa@rocketcorp.com',
        password: 'password123'
      });
      hrToken = loginResult.token;
    }

    // Token de colaborador (sem permissão)
    const collaboratorUser = await prismaService.user.findUnique({
      where: { email: 'ana.oliveira@rocketcorp.com' }
    });
    if (collaboratorUser) {
      const loginResult = await authService.login({
        email: 'ana.oliveira@rocketcorp.com',
        password: 'password123'
      });
      collaboratorToken = loginResult.token;
    }
  }

  describe('POST /api/users', () => {
    describe('Autenticação e autorização', () => {
      it('deve rejeitar requisição sem token', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .send(validUserData)
          .expect(401);
      });

      it('deve rejeitar token inválido', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', 'Bearer token-invalido')
          .send(validUserData)
          .expect(401);
      });

      it('deve rejeitar usuário colaborador (sem permissão)', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${collaboratorToken}`)
          .send(validUserData)
          .expect(403)
          .expect(res => {
            expect(res.body.message).toContain('Acesso negado');
          });
      });

      it('deve aceitar usuário admin', async () => {
        const testData = {
          ...validUserData,
          email: 'teste.admin@rocketcorp.com'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            expect(res.body.email).toBe(testData.email);
            expect(res.body.name).toBe(testData.name);
            expect(res.body).not.toHaveProperty('passwordHash');
          });
      });

      it('deve aceitar usuário RH', async () => {
        const testData = {
          ...validUserData,
          email: 'teste.rh@rocketcorp.com'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${hrToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            expect(res.body.email).toBe(testData.email);
            expect(res.body.name).toBe(testData.name);
          });
      });
    });

    describe('Validações de entrada', () => {
      it('deve rejeitar dados vazios', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400)
          .expect(res => {
            expect(res.body.message).toBeInstanceOf(Array);
            expect(res.body.message.length).toBeGreaterThan(0);
          });
      });

      it('deve rejeitar email com domínio incorreto', async () => {
        const invalidData = {
          ...validUserData,
          email: 'teste@gmail.com'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(expect.arrayContaining(['Email deve ter o domínio @rocketcorp.com']));
          });
      });

      it('deve rejeitar senha muito curta', async () => {
        const invalidData = {
          ...validUserData,
          email: 'teste.senha@rocketcorp.com',
          password: '123'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(expect.arrayContaining(['Senha deve ter pelo menos 8 caracteres']));
          });
      });

      it('deve rejeitar jobTitle inválido', async () => {
        const invalidData = {
          ...validUserData,
          email: 'teste.job@rocketcorp.com',
          jobTitle: 'Cargo Inexistente'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);
      });

      it('deve rejeitar projectAssignments vazio', async () => {
        const invalidData = {
          ...validUserData,
          email: 'teste.projeto@rocketcorp.com',
          projectAssignments: []
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);
      });
    });

    describe('Regras de negócio', () => {
      it('deve rejeitar email já existente', async () => {
        // Criar primeiro usuário
        const firstUserData = {
          ...validUserData,
          email: 'teste.duplicado@rocketcorp.com'
        };

        await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(firstUserData)
          .expect(201);

        // Tentar criar segundo usuário com mesmo email
        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(firstUserData)
          .expect(409)
          .expect(res => {
            expect(res.body.message).toContain('já existe');
          });
      });

      it('deve rejeitar projeto inexistente', async () => {
        const invalidData = {
          ...validUserData,
          email: 'teste.projeto.inexistente@rocketcorp.com',
          projectAssignments: [
            {
              projectId: 'projeto-inexistente',
              roleInProject: 'colaborador'
            }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toContain('não encontrado');
          });
      });

      it('deve rejeitar mentor inexistente', async () => {
        const invalidData = {
          ...validUserData,
          email: 'teste.mentor.inexistente@rocketcorp.com',
          mentorId: 'mentor-inexistente'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toContain('Mentor não encontrado');
          });
      });
    });

    describe('Processamento automático', () => {
      it('deve criar colaborador com role correta', async () => {
        const testData = {
          ...validUserData,
          email: 'teste.colaborador@rocketcorp.com',
          projectAssignments: [
            {
              projectId: 'projeto-delta',
              roleInProject: 'colaborador'
            }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            expect(res.body.roles).toEqual(['colaborador']);
            expect(res.body.projectRoles).toHaveLength(1);
            expect(res.body.projectRoles[0].roles).toContain('COLLABORATOR');
          });
      });

      it('deve criar gestor com roles corretas', async () => {
        const testData = {
          ...validUserData,
          email: 'teste.gestor@rocketcorp.com',
          projectAssignments: [
            {
              projectId: 'projeto-delta',
              roleInProject: 'gestor'
            }
          ]
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            expect(res.body.roles).toContain('colaborador');
            expect(res.body.roles).toContain('gestor');
            expect(res.body.projectRoles[0].roles).toContain('MANAGER');
          });
      });

      it('deve identificar gestor automaticamente', async () => {
        // Primeiro, verificar se existe um gestor no projeto projeto-delta
        const managerInProject = await prismaService.userProjectRole.findFirst({
          where: {
            projectId: 'projeto-delta',
            role: 'MANAGER'
          },
          include: {
            user: true
          }
        });

        if (managerInProject) {
          const testData = {
            ...validUserData,
            email: 'teste.gestor.auto@rocketcorp.com',
            projectAssignments: [
              {
                projectId: 'projeto-delta',
                roleInProject: 'colaborador'
              }
            ]
          };

          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testData)
            .expect(201)
            .expect(res => {
              expect(res.body.managerId).toBe(managerInProject.user.id);
              expect(res.body.managerName).toBe(managerInProject.user.name);
            });
        } else {
          // Se não há gestor, deve funcionar sem gestor
          const testData = {
            ...validUserData,
            email: 'teste.sem.gestor@rocketcorp.com'
          };

          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testData)
            .expect(201)
            .expect(res => {
              expect(res.body.managerId).toBeUndefined();
              expect(res.body.managerName).toBeUndefined();
            });
        }
      });

      it('deve preencher dados do mentor automaticamente', async () => {
        const mentorId = 'cmc06gfpa0002tz1cymfs5rww'; // ID da Carla Dias
        const testData = {
          ...validUserData,
          email: 'teste.mentor.auto@rocketcorp.com',
          mentorId
        };

        const mentor = await prismaService.user.findUnique({
          where: { id: mentorId }
        });

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            expect(res.body.mentorId).toBe(mentorId);
            expect(res.body.mentorName).toBe(mentor?.name);
          });
      });

              it('deve funcionar sem mentor quando não informado', async () => {
          const { mentorId, ...testDataWithoutMentor } = validUserData;
          const testData = {
            ...testDataWithoutMentor,
            email: 'teste.sem.mentor@rocketcorp.com'
          };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            expect(res.body.mentorId).toBeUndefined();
            expect(res.body.mentorName).toBeUndefined();
          });
      });
    });

    describe('Estrutura de resposta', () => {
      it('deve retornar usuário completo sem senha', async () => {
        const testData = {
          ...validUserData,
          email: 'teste.resposta@rocketcorp.com'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201)
          .expect(res => {
            const user = res.body;
            
            // Campos obrigatórios
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('roles');
            expect(user).toHaveProperty('jobTitle');
            expect(user).toHaveProperty('seniority');
            expect(user).toHaveProperty('careerTrack');
            expect(user).toHaveProperty('businessUnit');
            expect(user).toHaveProperty('projectRoles');
            expect(user).toHaveProperty('isActive');
            expect(user).toHaveProperty('createdAt');
            expect(user).toHaveProperty('updatedAt');

            // Não deve conter senha
            expect(user).not.toHaveProperty('password');
            expect(user).not.toHaveProperty('passwordHash');

            // Validar tipos
            expect(typeof user.id).toBe('string');
            expect(typeof user.name).toBe('string');
            expect(typeof user.email).toBe('string');
            expect(Array.isArray(user.roles)).toBe(true);
            expect(Array.isArray(user.projectRoles)).toBe(true);
            expect(typeof user.isActive).toBe('boolean');
            expect(user.isActive).toBe(true);
          });
      });

      it('deve criar relacionamentos no banco corretamente', async () => {
        const testData = {
          ...validUserData,
          email: 'teste.relacionamentos@rocketcorp.com'
        };

        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData)
          .expect(201);

        const userId = response.body.id;

        // Verificar UserProjectAssignment
        const projectAssignment = await prismaService.userProjectAssignment.findFirst({
          where: { userId }
        });
        expect(projectAssignment).toBeDefined();
        expect(projectAssignment?.projectId).toBe('projeto-delta');

        // Verificar UserProjectRole
        const projectRole = await prismaService.userProjectRole.findFirst({
          where: { userId }
        });
        expect(projectRole).toBeDefined();
        expect(projectRole?.role).toBe('COLLABORATOR');
      });
    });
  });
}); 