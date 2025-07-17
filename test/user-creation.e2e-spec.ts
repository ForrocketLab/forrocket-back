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
  let validMentorId: string;

  const validProjectMemberData = {
    userType: 'project_member',
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
    get mentorId() { return validMentorId; }
  };

  const validAdminData = {
    userType: 'admin',
    name: 'Admin Teste',
    email: 'admin.teste@rocketcorp.com',
    password: 'AdminSenh@123',
    jobTitle: 'DevOps Engineer',
    seniority: 'Sênior',
    careerTrack: 'Tech',
    businessUnit: 'Operations'
  };

  const validRhData = {
    userType: 'rh',
    name: 'RH Teste',
    email: 'rh.teste@rocketcorp.com',
    password: 'RhSenh@123',
    jobTitle: 'People & Culture Manager',
    seniority: 'Sênior',
    careerTrack: 'Business',
    businessUnit: 'Operations'
  };

  const validComiteData = {
    userType: 'comite',
    name: 'Comitê Teste',
    email: 'comite.teste@rocketcorp.com',
    password: 'ComiteSenh@123',
    jobTitle: 'Head of Engineering',
    seniority: 'Principal',
    careerTrack: 'Tech',
    businessUnit: 'Digital Products'
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

    // Buscar um mentor válido (Carla Dias)
    const mentor = await prismaService.user.findFirst({
      where: {
        email: 'carla.dias@rocketcorp.com'
      }
    });
    
    if (mentor) {
      validMentorId = mentor.id;
    }

    // Gerar tokens para diferentes tipos de usuário
    await generateTestTokens();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Limpar usuários criados nos testes (manter apenas os de seed)
    const seedEmails = [
      'eduardo.tech@rocketcorp.com',
      'diana.costa@rocketcorp.com', 
      'carla.dias@rocketcorp.com',
      'bruno.mendes@rocketcorp.com',
      'ana.oliveira@rocketcorp.com',
      'felipe.silva@rocketcorp.com',
      'lucas.fernandes@rocketcorp.com',
      'marina.santos@rocketcorp.com',
      'rafael.costa@rocketcorp.com'
    ];

    // Limpar relacionamentos primeiro
    await prismaService.userRoleAssignment.deleteMany({
      where: {
        user: {
          email: { notIn: seedEmails }
        }
      }
    });
    
    await prismaService.userProjectRole.deleteMany({
      where: {
        user: {
          email: { notIn: seedEmails }
        }
      }
    });
    
    await prismaService.userProjectAssignment.deleteMany({
      where: {
        user: {
          email: { notIn: seedEmails }
        }
      }
    });

    // Remover usuários de teste
    await prismaService.user.deleteMany({
      where: {
        email: { notIn: seedEmails }
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
          .send(validProjectMemberData)
          .expect(401);
      });

      it('deve rejeitar token inválido', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', 'Bearer token-invalido')
          .send(validProjectMemberData)
          .expect(401);
      });

      it('deve rejeitar usuário colaborador (sem permissão)', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${collaboratorToken}`)
          .send(validProjectMemberData)
          .expect(403)
          .expect(res => {
            expect(res.body.message).toContain('Acesso negado');
          });
      });

      it('deve aceitar usuário admin', async () => {
        const timestamp = Date.now();
        const testData = {
          ...validAdminData,
          email: `teste.admin.${timestamp}@rocketcorp.com`
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
          ...validRhData,
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

    describe('Validações de userType', () => {
      it('deve rejeitar dados sem userType', async () => {
        const { userType, ...dataWithoutUserType } = validProjectMemberData;

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(dataWithoutUserType)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(expect.arrayContaining([
              expect.stringContaining('userType deve ser um dos seguintes valores')
            ]));
          });
      });

      it('deve rejeitar userType inválido', async () => {
        const invalidData = {
          ...validProjectMemberData,
          userType: 'tipo_invalido'
        };

        return request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400)
          .expect(res => {
            expect(res.body.message).toEqual(expect.arrayContaining([
              'userType deve ser um dos seguintes valores: admin, rh, comite, project_member'
            ]));
          });
      });
    });

    describe('Criação de usuários por tipo', () => {
      describe('Usuário Admin', () => {
        it('deve criar usuário admin sem projectAssignments', async () => {
          const timestamp = Date.now();
          const testData = {
            ...validAdminData,
            email: `admin.create.${timestamp}@rocketcorp.com`
          };

          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testData)
            .expect(201)
            .expect(res => {
              expect(res.body.email).toBe(testData.email);
              expect(res.body.roles).toEqual(['admin']);
              expect(res.body.managerId).toBeUndefined();
              expect(res.body.mentorId).toBeUndefined();
              expect(res.body.projectRoles).toEqual([]);
            });
        });

        it('deve ignorar projectAssignments para usuário admin', async () => {
          const timestamp = Date.now();
          const adminWithProjects = {
            ...validAdminData,
            email: `admin.com.projetos.${timestamp}@rocketcorp.com`,
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
            .send(adminWithProjects)
            .expect(201)
            .expect(res => {
              expect(res.body.roles).toEqual(['admin']);
              expect(res.body.projectRoles).toEqual([]);
            });
        });
      });

      describe('Usuário RH', () => {
        it('deve criar usuário RH sem projectAssignments', async () => {
          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validRhData)
            .expect(201)
            .expect(res => {
              expect(res.body.email).toBe(validRhData.email);
              expect(res.body.roles).toEqual(['rh']);
              expect(res.body.projectRoles).toEqual([]);
            });
        });
      });

      describe('Usuário Comitê', () => {
        it('deve criar usuário comitê sem projectAssignments', async () => {
          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(validComiteData)
            .expect(201)
            .expect(res => {
              expect(res.body.email).toBe(validComiteData.email);
              expect(res.body.roles).toEqual(['comite']);
              expect(res.body.projectRoles).toEqual([]);
            });
        });
      });

      describe('Usuário Project Member', () => {
        it('deve criar membro de projeto com projectAssignments', async () => {
          const timestamp = Date.now();
          const testData = {
            ...validProjectMemberData,
            email: `joao.santos.${timestamp}@rocketcorp.com`
          };

          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testData)
            .expect(201)
            .expect(res => {
              expect(res.body.email).toBe(testData.email);
              expect(res.body.roles).toEqual(['colaborador']);
              expect(res.body.projectRoles).toHaveLength(1);
              expect(res.body.projectRoles[0].projectId).toBe('projeto-delta');
              expect(res.body.projectRoles[0].roles).toEqual(['COLLABORATOR']);
            });
        });

        it('deve rejeitar membro de projeto sem projectAssignments', async () => {
          const { projectAssignments, ...memberWithoutProjects } = validProjectMemberData;
          const testData = {
            ...memberWithoutProjects,
            email: 'membro.sem.projetos@rocketcorp.com'
          };

          return request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(testData)
            .expect(400)
            .expect(res => {
              expect(res.body.message).toContain('Membros de projeto devem ter pelo menos uma atribuição de projeto');
            });
        });

        it('deve criar gestor com role de manager', async () => {
          const managerData = {
            ...validProjectMemberData,
            email: 'gestor.teste@rocketcorp.com',
            projectAssignments: [
              {
                projectId: 'projeto-beta',
                roleInProject: 'gestor'
              }
            ]
          };

          const response = await request(app.getHttpServer())
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(managerData);

          if (response.status !== 201) {
            console.log('Erro na criação do gestor:', response.body);
          }

          expect(response.status).toBe(201);
          expect(response.body.roles).toEqual(['colaborador', 'gestor']);
          expect(response.body.projectRoles[0].roles).toEqual(['MANAGER']);
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
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
          ...validProjectMemberData,
          email: 'teste.gestor@rocketcorp.com',
          projectAssignments: [
            {
              projectId: 'projeto-gamma',
              roleInProject: 'gestor'
            }
          ]
        };

        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testData);

        if (response.status !== 201) {
          console.log('Erro na criação do gestor:', response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body.roles).toContain('colaborador');
        expect(response.body.roles).toContain('gestor');
        expect(response.body.projectRoles[0].roles).toContain('MANAGER');
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

        const testData = {
          ...validProjectMemberData,
          email: 'teste.sem.gestor@rocketcorp.com',
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
            if (managerInProject) {
              expect(res.body.managerId).toBe(managerInProject.user.id);
              expect(res.body.managerName).toBe(managerInProject.user.name);
            } else {
              expect(res.body.managerId).toBeUndefined();
              expect(res.body.managerName).toBeUndefined();
            }
          });
      });

      it('deve preencher dados do mentor automaticamente', async () => {
        const mentorId = validMentorId;
        const testData = {
          ...validProjectMemberData,
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
        const { mentorId, ...testDataWithoutMentor } = validProjectMemberData;
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
          ...validProjectMemberData,
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
            expect(user.id).toBeDefined();
            expect(user.email).toBe(testData.email);
            expect(user.name).toBe(testData.name);
            expect(user.jobTitle).toBe(testData.jobTitle);
            expect(user.seniority).toBe(testData.seniority);
            expect(user.careerTrack).toBe(testData.careerTrack);
            expect(user.businessUnit).toBe(testData.businessUnit);
            expect(user.roles).toBeDefined();
            expect(user.projectRoles).toBeDefined();
            expect(user.isActive).toBe(true);
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();

            // Não deve retornar senha
            expect(user.password).toBeUndefined();
            expect(user.passwordHash).toBeUndefined();
          });
      });

      it('deve criar relacionamentos no banco corretamente', async () => {
        const testData = {
          ...validProjectMemberData,
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
          where: {
            userId: userId,
            projectId: 'projeto-delta'
          }
        });
        expect(projectAssignment).toBeDefined();

        // Verificar UserProjectRole
        const projectRole = await prismaService.userProjectRole.findFirst({
          where: {
            userId: userId,
            projectId: 'projeto-delta',
            role: 'COLLABORATOR'
          }
        });
        expect(projectRole).toBeDefined();

        // Verificar UserRoleAssignment
        const roleAssignment = await prismaService.userRoleAssignment.findFirst({
          where: {
            userId: userId,
            role: 'COLLABORATOR'
          }
        });
        expect(roleAssignment).toBeDefined();
      });
    });
  });
}); 