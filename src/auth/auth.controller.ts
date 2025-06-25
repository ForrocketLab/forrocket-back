import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  ValidationPipe,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService, UserSummary } from './user.service';
import { LoginDto, LoginResponseDto, ErrorResponseDto } from './dto/login.dto';
import { UserInfoDto, UserProfileDto, CreateUserDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import { User } from './entities/user.entity';
import { HRRoleGuard } from './guards/hr-role.guard';

/**
 * Controlador responsável pelos endpoints de autenticação
 * Gerencia as rotas relacionadas ao login, autenticação e perfil de usuários
 */
@ApiTags('Autenticação')
@ApiExtraModels(LoginDto, LoginResponseDto, UserInfoDto, UserProfileDto, CreateUserDto, ErrorResponseDto)
@Controller('api')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  /**
   * Endpoint para realizar login no sistema RPE
   * @param loginDto - Dados de login (email e senha)
   * @returns Token JWT e informações do usuário para autenticação
   */
  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realizar login no sistema',
    description: `
      Autentica um usuário e retorna um token JWT válido por 8 horas.
      O token contém informações do usuário incluindo seus papéis (roles) no sistema.
      
      **👥 Usuários disponíveis para teste:**
      
      **📧 ana.oliveira@rocketcorp.com** - Senha: password123
      • 👤 Ana Oliveira | 🎯 Colaboradora | 💼 Desenvolvedora Frontend Pleno | 🏢 Tech/Digital Products
      
      **📧 bruno.mendes@rocketcorp.com** - Senha: password123  
      • 👤 Bruno Mendes | 🎯 Gestor + Colaborador | 💼 Tech Lead Sênior | 🏢 Tech/Digital Products
      
      **📧 carla.dias@rocketcorp.com** - Senha: password123
      • 👤 Carla Dias | 🎯 Comitê + Colaboradora | 💼 Head of Engineering Principal | 🏢 Tech/Digital Products
      
      **📧 diana.costa@rocketcorp.com** - Senha: password123
      • 👤 Diana Costa | 🎯 RH + Colaboradora | 💼 People & Culture Manager Sênior | 🏢 Business/Operations
      
      **📧 felipe.silva@rocketcorp.com** - Senha: password123
      • 👤 Felipe Silva | 🎯 Colaborador | 💼 Desenvolvedor Backend Júnior | 🏢 Tech/Digital Products
      
      **📧 eduardo.tech@rocketcorp.com** - Senha: password123
      • 👤 Eduardo Tech | 🎯 Admin | 💼 DevOps Engineer Sênior | 🏢 Tech/Operations
      
      **🏢 Estrutura Organizacional:**
      👑 Carla Dias (Head) → Bruno Mendes (Tech Lead) → Ana Oliveira & Felipe Silva
      👑 Carla Dias (Head) → Diana Costa (RH)
      🔧 Eduardo Tech (Admin - Independente)
    `,
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciais de login do usuário',
    examples: {
      colaborador: {
        summary: 'Login como Colaborador',
        description: 'Ana Oliveira - Desenvolvedora Frontend Pleno',
        value: {
          email: 'ana.oliveira@rocketcorp.com',
          password: 'password123'
        }
      },
      gestor: {
        summary: 'Login como Gestor',
        description: 'Bruno Mendes - Tech Lead Sênior (Gestor + Colaborador)',
        value: {
          email: 'bruno.mendes@rocketcorp.com',
          password: 'password123'
        }
      },
      comite: {
        summary: 'Login como Comitê',
        description: 'Carla Dias - Head of Engineering Principal (Comitê + Colaborador)',
        value: {
          email: 'carla.dias@rocketcorp.com',
          password: 'password123'
        }
      },
      rh: {
        summary: 'Login como RH',
        description: 'Diana Costa - People & Culture Manager Sênior (RH + Colaborador)',
        value: {
          email: 'diana.costa@rocketcorp.com',
          password: 'password123'
        }
      },
      colaborador_junior: {
        summary: 'Login como Colaborador Júnior',
        description: 'Felipe Silva - Desenvolvedor Backend Júnior',
        value: {
          email: 'felipe.silva@rocketcorp.com',
          password: 'password123'
        }
      },
      admin: {
        summary: 'Login como Admin',
        description: 'Eduardo Tech - DevOps Engineer Sênior (Admin)',
        value: {
          email: 'eduardo.tech@rocketcorp.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
    examples: {
      colaborador: {
        summary: 'Resposta - Colaborador',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWJ5YXZ3dmQwMDAwdHpzZ281NTgxMnFvIiwibmFtZSI6IkFuYSBPbGl2ZWlyYSIsImVtYWlsIjoiYW5hLm9saXZlaXJhQHJvY2tldGNvcnAuY29tIiwicm9sZXMiOlsiY29sYWJvcmFkb3IiXX0...',
          user: {
            id: 'cmbyavwvd0000tzsgo55812qo',
            name: 'Ana Oliveira',
            email: 'ana.oliveira@rocketcorp.com',
            roles: ['colaborador']
          }
        }
      },
      gestor: {
        summary: 'Resposta - Gestor',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWJ5YXZ3dmgwMDAxdHpzZzVvd2Z4d2JxIiwibmFtZSI6IkJydW5vIE1lbmRlcyIsImVtYWlsIjoiYnJ1bm8ubWVuZGVzQHJvY2tldGNvcnAuY29tIiwicm9sZXMiOlsiY29sYWJvcmFkb3IiLCJnZXN0b3IiXX0...',
          user: {
            id: 'cmbyavwvh0001tzsg5owfxwbq',
            name: 'Bruno Mendes',
            email: 'bruno.mendes@rocketcorp.com',
            roles: ['colaborador', 'gestor']
          }
        }
      },
      admin: {
        summary: 'Resposta - Admin',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWJ5YXZ3dm4wMDA1dHpzZ3h5ejEyM2FiYyIsIm5hbWUiOiJFZHVhcmRvIFRlY2giLCJlbWFpbCI6ImVkdWFyZG8udGVjaEByb2NrZXRjb3JwLmNvbSIsInJvbGVzIjpbImFkbWluIl19...',
          user: {
            id: 'cmbyavwvn0005tzsgxyz123abc',
            name: 'Eduardo Tech',
            email: 'eduardo.tech@rocketcorp.com',
            roles: ['admin']
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
    type: ErrorResponseDto,
    example: {
      statusCode: 400,
      message: ['Email deve ter um formato válido', 'Senha deve ter pelo menos 6 caracteres'],
      error: 'Bad Request'
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
    type: ErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Senha incorreta',
      error: 'Unauthorized'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    type: ErrorResponseDto,
    example: {
      statusCode: 404,
      message: 'Usuário não encontrado',
      error: 'Not Found'
    }
  })
  async login(
    @Body() loginDto: LoginDto
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);
    return result;
  }

  /**
   * Endpoint para criar novos usuários no sistema
   * @param createUserDto - Dados para criação do usuário
   * @returns Usuário criado (sem a senha)
   */
  @Post('users')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Criar novo usuário no sistema RPE',
    description: `
      Cria um novo usuário no sistema aplicando todas as regras de negócio e validações automaticamente.
      
      **🔒 Acesso Restrito**: Apenas usuários com roles ADMIN ou RH podem criar novos usuários.
      
      **🤖 Processamento Automático:**
      - ✅ Validação de email @rocketcorp.com
      - ✅ Hash seguro da senha
      - ✅ Determinação automática de roles baseada nos projetos
      - ✅ Identificação automática do gestor direto
      - ✅ Atualização de relacionamentos hierárquicos
      - ✅ Associação a projetos e roles específicas
      
      **📋 Validações Aplicadas:**
      - Email único no sistema
      - Domínio corporativo obrigatório
      - Projetos devem existir e estar ativos
      - Mentor deve existir e estar ativo (se informado)
      - Valores de enum válidos para todos os campos
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserProfileDto,
    example: {
      id: 'cmbyavwvn0006tzsgxyz456def',
      name: 'João Silva Santos',
      email: 'joao.santos@rocketcorp.com',
      roles: ['colaborador'],
      jobTitle: 'Desenvolvedor Backend',
      seniority: 'Júnior',
      careerTrack: 'Tech',
      businessUnit: 'Digital Products',
      projectRoles: [
        {
          projectId: 'api-core',
          projectName: 'API Core',
          roles: ['COLLABORATOR']
        }
      ],
      managerId: 'cmbyavwvh0001tzsg5owfxwbq',
      managerName: 'Bruno Mendes',
      mentorId: 'cmbyavwvk0002tzsgi5r3edy5',
      mentorName: 'Carla Dias',
      isActive: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z'
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos ou regras de negócio violadas',
    type: ErrorResponseDto,
    examples: {
      'email-invalido': {
        summary: 'Email com domínio inválido',
        value: {
          statusCode: 400,
          message: 'Email deve ter o domínio @rocketcorp.com',
          error: 'Bad Request'
        }
      },
      'projeto-inexistente': {
        summary: 'Projeto não encontrado',
        value: {
          statusCode: 400,
          message: 'Projeto com ID projeto-inexistente não encontrado',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou usuário não autenticado',
    type: ErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Token inválido ou expirado',
      error: 'Unauthorized'
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para criar usuários',
    type: ErrorResponseDto,
    example: {
      statusCode: 403,
      message: 'Acesso negado. Apenas usuários ADMIN ou RH podem criar usuários.',
      error: 'Forbidden'
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Email já existe no sistema',
    type: ErrorResponseDto,
    example: {
      statusCode: 409,
      message: 'Usuário com este email já existe',
      error: 'Conflict'
    }
  })
  async createUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User
  ): Promise<UserProfileDto> {
    // Verificar se o usuário tem permissão para criar usuários
    if (!currentUser.roles.includes('admin') && !currentUser.roles.includes('rh')) {
      throw new ForbiddenException('Acesso negado. Apenas usuários ADMIN ou RH podem criar usuários.');
    }

    const newUser = await this.userService.createUser(createUserDto);
    return newUser;
  }

  /**
   * Endpoint para obter informações do perfil do usuário autenticado
   * @param user - Usuário atual (extraído do JWT)
   * @returns Informações do perfil do usuário
   */
  @Get('auth/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obter perfil completo do usuário autenticado',
    description: `
      Retorna as informações completas do perfil do usuário atualmente autenticado baseado no token JWT.
      Inclui dados organizacionais, relacionamentos hierárquicos e informações de projetos.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    type: UserProfileDto,
    examples: {
      colaborador: {
        summary: 'Perfil - Colaborador',
        value: {
          id: 'cmbyavwvd0000tzsgo55812qo',
          name: 'Ana Oliveira',
          email: 'ana.oliveira@rocketcorp.com',
          roles: ['colaborador'],
          jobTitle: 'Desenvolvedora Frontend',
          seniority: 'Pleno',
          careerTrack: 'Tech',
          businessUnit: 'Digital Products',
          projectRoles: [
            {
              projectId: 'app-mobile',
              projectName: 'App Mobile',
              roles: ['COLLABORATOR']
            },
            {
              projectId: 'dashboard',
              projectName: 'Dashboard Analytics',
              roles: ['COLLABORATOR']
            }
          ],
          managerId: 'cmbyavwvh0001tzsg5owfxwbq',
          managerName: 'Bruno Mendes',
          mentorId: 'cmbyavwvk0002tzsgi5r3edy5',
          mentorName: 'Carla Dias',
          isActive: true,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      gestor: {
        summary: 'Perfil - Gestor',
        value: {
          id: 'cmbyavwvh0001tzsg5owfxwbq',
          name: 'Bruno Mendes',
          email: 'bruno.mendes@rocketcorp.com',
          roles: ['colaborador', 'gestor'],
          jobTitle: 'Tech Lead',
          seniority: 'Sênior',
          careerTrack: 'Tech',
          businessUnit: 'Digital Products',
          projectRoles: [
            {
              projectId: 'api-core',
              projectName: 'API Core',
              roles: ['COLLABORATOR', 'MANAGER']
            },
            {
              projectId: 'arquitetura',
              projectName: 'Arquitetura',
              roles: ['COLLABORATOR', 'TECH_LEAD']
            }
          ],
          managerId: 'cmbyavwvk0002tzsgi5r3edy5',
          managerName: 'Carla Dias',
          directReports: ['cmbyavwvd0000tzsgo55812qo', 'cmbyavwvo0004tzsgxyz123abc'],
          directReportsNames: ['Ana Oliveira', 'Felipe Silva'],
          isActive: true,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      admin: {
        summary: 'Perfil - Admin',
        value: {
          id: 'cmbyavwvn0005tzsgxyz123abc',
          name: 'Eduardo Tech',
          email: 'eduardo.tech@rocketcorp.com',
          roles: ['admin'],
          jobTitle: 'DevOps Engineer',
          seniority: 'Sênior',
          careerTrack: 'Tech',
          businessUnit: 'Operations',
          projectRoles: [
            {
              projectId: 'infraestrutura',
              projectName: 'Infraestrutura',
              roles: ['COLLABORATOR', 'ADMIN']
            },
            {
              projectId: 'ci-cd',
              projectName: 'CI/CD Pipeline',
              roles: ['COLLABORATOR', 'ADMIN']
            }
          ],
          isActive: true,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
    type: ErrorResponseDto,
    example: {
      statusCode: 401,
      message: 'Token inválido ou expirado',
      error: 'Unauthorized'
    }
  })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    // Buscar roles específicas do usuário por projeto
    const projectRoles = await this.authService.getUserProjectRoles(user.id);
    
    // Retorna o perfil completo do usuário
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      jobTitle: user.jobTitle,
      seniority: user.seniority,
      careerTrack: user.careerTrack,
      businessUnit: user.businessUnit,
      projectRoles,
      managerId: user.managerId,
      directReports: user.directReports,
      mentorId: user.mentorId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Endpoint para verificar o status da API de autenticação
   * @returns Status da API
   */
  @Public()
  @Get('auth/status')
  @ApiOperation({
    summary: 'Verificar status da API de autenticação',
    description: 'Endpoint público para verificar se a API de autenticação está funcionando.',
  })
  @ApiResponse({
    status: 200,
    description: 'API funcionando corretamente',
    example: {
      status: 'ok',
      message: 'API de autenticação RPE funcionando',
      timestamp: '2024-01-15T10:00:00.000Z',
      version: '1.0.0'
    }
  })
  async getStatus() {
    return {
      status: 'ok',
      message: 'API de autenticação RPE funcionando',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Endpoint para listar todos os usuários (apenas RH/Admin)
   * @returns Lista de todos os usuários do sistema
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, HRRoleGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar todos os usuários (apenas RH/Admin)',
    description: `
      Retorna uma lista de todos os usuários do sistema com informações básicas.
      Disponível apenas para usuários com role 'rh' ou 'admin'.
      
      **Permissões:** Apenas RH ou Admin
      **Uso:** Gestão de colaboradores, relatórios, administração
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmbyavwvd0000tzsgo55812qo' },
          name: { type: 'string', example: 'Ana Oliveira' },
          email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
          roles: { type: 'array', items: { type: 'string' }, example: ['colaborador'] },
          jobTitle: { type: 'string', example: 'Desenvolvedora Frontend' },
          seniority: { type: 'string', example: 'Pleno' },
          careerTrack: { type: 'string', example: 'Tech' },
          businessUnit: { type: 'string', example: 'Digital Products' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          managerName: { type: 'string', example: 'Bruno Mendes', nullable: true },
          directReportsCount: { type: 'number', example: 2 }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas usuários do RH podem acessar esta funcionalidade.',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
    type: ErrorResponseDto
  })
  async getAllUsers(@CurrentUser() currentUser: User) {
    return this.userService.getAllUsers();
  }

  /**
   * Endpoint para listar todos os usuários com progresso de avaliações (apenas RH/Admin)
   * @returns Lista de todos os usuários do sistema com progresso detalhado das avaliações
   */
  @Get('users/with-evaluation-progress')
  @UseGuards(JwtAuthGuard, HRRoleGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar todos os usuários com progresso de avaliações (apenas RH/Admin)',
    description: `
      Retorna uma lista de todos os usuários do sistema com informações básicas e progresso detalhado das avaliações no ciclo ativo.
      Disponível apenas para usuários com role 'rh' ou 'admin'.
      
      **Permissões:** Apenas RH ou Admin
      **Uso:** Dashboard RH, acompanhamento de progresso, relatórios detalhados
      **Dados incluídos:** Autoavaliação, 360, Gestor, Mentoring, Referências
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários com progresso retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cmbyavwvd0000tzsgo55812qo' },
          name: { type: 'string', example: 'Ana Oliveira' },
          email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
          roles: { type: 'array', items: { type: 'string' }, example: ['colaborador'] },
          jobTitle: { type: 'string', example: 'Desenvolvedora Frontend' },
          seniority: { type: 'string', example: 'Pleno' },
          careerTrack: { type: 'string', example: 'Tech' },
          businessUnit: { type: 'string', example: 'Digital Products' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          managerName: { type: 'string', example: 'Bruno Mendes', nullable: true },
          evaluationProgress: {
            type: 'object',
            properties: {
              selfAssessment: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'SUBMITTED' },
                  submittedAt: { type: 'string', format: 'date-time', nullable: true }
                }
              },
              assessments360Received: { type: 'number', example: 3 },
              managerAssessment: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'SUBMITTED' },
                  submittedAt: { type: 'string', format: 'date-time', nullable: true }
                }
              },
              mentoringAssessmentsReceived: { type: 'number', example: 1 },
              referenceFeedbacksReceived: { type: 'number', example: 2 },
              committeeAssessment: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'PENDING' },
                  submittedAt: { type: 'string', format: 'date-time', nullable: true }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas usuários do RH podem acessar esta funcionalidade.',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum ciclo ativo encontrado',
    type: ErrorResponseDto
  })
  async getAllUsersWithEvaluationProgress(@CurrentUser() currentUser: User) {
    return this.userService.getAllUsersWithEvaluationProgress();
  }

  /**
   * Endpoint para obter dados detalhados de avaliação de um colaborador (apenas RH/Admin)
   * @param collaboratorId - ID do colaborador
   * @returns Dados detalhados das avaliações do colaborador
   */
  @Get('users/:collaboratorId/evaluation-details')
  @UseGuards(JwtAuthGuard, HRRoleGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Obter dados detalhados de avaliação de um colaborador (apenas RH/Admin)',
    description: `
      Retorna dados detalhados das avaliações de um colaborador específico, incluindo notas e resumos.
      Disponível apenas para usuários com role 'rh' ou 'admin'.
      
      **Permissões:** Apenas RH ou Admin
      **Uso:** Visualização detalhada de avaliações para análise do RH
      **Dados incluídos:** Autoavaliação, 360, Gestor, Mentoring, Referências, médias calculadas
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Dados detalhados de avaliação retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        cycle: { type: 'string', example: '2025.1' },
        currentPhase: { type: 'string', example: 'ASSESSMENTS' },
        collaborator: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cmbyavwvd0000tzsgo55812qo' },
            name: { type: 'string', example: 'Ana Oliveira' },
            email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
            jobTitle: { type: 'string', example: 'Desenvolvedora Frontend' },
            seniority: { type: 'string', example: 'Pleno' }
          }
        },
        evaluationScores: {
          type: 'object',
          properties: {
            selfAssessment: { type: 'number', example: 4.2, nullable: true },
            assessment360: { type: 'number', example: 4.0, nullable: true },
            managerAssessment: { type: 'number', example: 4.5, nullable: true },
            mentoring: { type: 'number', example: 4.8, nullable: true }
          }
        },
        selfAssessment: { type: 'object', nullable: true },
        assessments360Received: { type: 'array' },
        managerAssessmentsReceived: { type: 'array' },
        mentoringAssessmentsReceived: { type: 'array' },
        referenceFeedbacksReceived: { type: 'array' },
        committeeAssessment: { type: 'object', nullable: true },
        summary: {
          type: 'object',
          properties: {
            totalAssessmentsReceived: { type: 'number', example: 5 },
            hasCommitteeAssessment: { type: 'boolean', example: false },
            isEqualizationComplete: { type: 'boolean', example: false }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Colaborador não encontrado',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas usuários do RH podem acessar esta funcionalidade.',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
    type: ErrorResponseDto
  })
  async getCollaboratorEvaluationDetails(
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser() currentUser: User
  ) {
    return this.userService.getCollaboratorEvaluationDetails(collaboratorId);
  }

  @Get('users/potential-mentors')
  @UseGuards(JwtAuthGuard, HRRoleGuard)
  @ApiOperation({
    summary: 'Buscar usuários potenciais para serem mentores',
    description: 'Retorna lista de usuários ativos que não são mentores de ninguém ainda e podem ser designados como mentores',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários potenciais mentores retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-123' },
          name: { type: 'string', example: 'Ana Oliveira' },
          email: { type: 'string', example: 'ana.oliveira@rocketcorp.com' },
          jobTitle: { type: 'string', example: 'Desenvolvedora Frontend Pleno' },
          seniority: { type: 'string', example: 'Pleno' },
          businessUnit: { type: 'string', example: 'Tech/Digital Products' }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas usuários do RH/Admin podem acessar esta funcionalidade.',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
    type: ErrorResponseDto
  })
  async getPotentialMentors(@CurrentUser() currentUser: User): Promise<UserSummary[]> {
    return this.userService.getPotentialMentors();
  }
} 