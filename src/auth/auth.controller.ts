import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  ValidationPipe,
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
import { LoginDto, LoginResponseDto, ErrorResponseDto } from './dto/login.dto';
import { UserInfoDto, UserProfileDto } from './dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import { User } from './entities/user.entity';

/**
 * Controlador responsável pelos endpoints de autenticação
 * Gerencia as rotas relacionadas ao login, autenticação e perfil de usuários
 */
@ApiTags('Autenticação')
@ApiExtraModels(LoginDto, LoginResponseDto, UserInfoDto, UserProfileDto, ErrorResponseDto)
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint para realizar login no sistema RPE
   * @param loginDto - Dados de login (email e senha)
   * @returns Token JWT e informações do usuário para autenticação
   */
  @Public()
  @Post('login')
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
   * Endpoint para obter informações do perfil do usuário autenticado
   * @param user - Usuário atual (extraído do JWT)
   * @returns Informações do perfil do usuário
   */
  @Get('profile')
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
          projects: ['app-mobile', 'dashboard'],
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
          projects: ['api-core', 'arquitetura'],
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
          projects: ['infraestrutura', 'ci-cd'],
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
      projects: user.projects,
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
  @Get('status')
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
} 