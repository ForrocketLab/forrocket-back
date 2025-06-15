
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
import { UserInfoDto } from './dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import { User } from './entities/user.entity';

/**
 * Controlador responsável pelos endpoints de autenticação
 * Gerencia as rotas relacionadas ao login, autenticação e perfil de usuários
 */
@ApiTags('Autenticação')
@ApiExtraModels(LoginDto, LoginResponseDto, UserInfoDto, ErrorResponseDto)
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
      
      **Usuários disponíveis para teste:**
      - **Colaborador:** ana.oliveira@rocketcorp.com (password123)
      - **Gestor:** bruno.mendes@rocketcorp.com (password123)
      - **Comitê:** carla.dias@rocketcorp.com (password123)
    `,
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciais de login do usuário',
    examples: {
      colaborador: {
        summary: 'Login como Colaborador',
        description: 'Ana Oliveira - Colaborador comum',
        value: {
          email: 'ana.oliveira@rocketcorp.com',
          password: 'password123'
        }
      },
      gestor: {
        summary: 'Login como Gestor',
        description: 'Bruno Mendes - Gestor (também é colaborador)',
        value: {
          email: 'bruno.mendes@rocketcorp.com',
          password: 'password123'
        }
      },
      comite: {
        summary: 'Login como Comitê',
        description: 'Carla Dias - Membro do comitê (também é colaborador)',
        value: {
          email: 'carla.dias@rocketcorp.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OC05MGFiLWNkZWYtMTIzNC01Njc4OTBhYmNkZWYiLCJuYW1lIjoiQW5hIE9saXZlaXJhIiwiZW1haWwiOiJhbmEub2xpdmVpcmFAcm9ja2V0Y29ycC5jb20iLCJyb2xlcyI6WyJjb2xhYm9yYWRvciJdLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU5NjY5MH0...',
      user: {
        id: '12345678-90ab-cdef-1234-567890abcdef',
        name: 'Ana Oliveira',
        email: 'ana.oliveira@rocketcorp.com',
        roles: ['colaborador']
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
    summary: 'Obter perfil do usuário autenticado',
    description: 'Retorna as informações do perfil do usuário atualmente autenticado baseado no token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    type: UserInfoDto,
    example: {
      id: '12345678-90ab-cdef-1234-567890abcdef',
      name: 'Ana Oliveira',
      email: 'ana.oliveira@rocketcorp.com',
      roles: ['colaborador']
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
  async getProfile(@CurrentUser() user: User): Promise<UserInfoDto> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles
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