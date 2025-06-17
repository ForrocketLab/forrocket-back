import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { UserInfoDto, UserProjectRoleDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';

/**
 * Serviço responsável pela autenticação de usuários
 * Gerencia o processo de login, validação e geração de tokens JWT
 */
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
    private prisma: PrismaService
  ) {}

  /**
   * Realiza o login do usuário
   * @param loginDto - Dados de login (email e senha)
   * @returns Token JWT e informações do usuário se o login for bem-sucedido
   * @throws UnauthorizedException se as credenciais forem inválidas
   * @throws NotFoundException se o usuário não for encontrado
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    console.log('🔑 Iniciando processo de login para:', loginDto.email);
    
    const { email, password } = loginDto;

    // Busca o usuário pelo email
    const user = await this.databaseService.findUserByEmail(email);
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verifica se a senha está correta
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log('❌ Senha incorreta para usuário:', email);
      throw new UnauthorizedException('Senha incorreta');
    }

    // Gera o token JWT
    const token = await this.generateJwtToken(user);
    
    // Converte o usuário para formato público
    const userInfo: UserInfoDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles
    };

    console.log('✅ Login realizado com sucesso para:', email);
    
    return { 
      token,
      user: userInfo 
    };
  }

  /**
   * Busca usuário por ID
   * @param id - ID do usuário
   * @returns Usuário encontrado ou null
   */
  async findUserById(id: string): Promise<User | null> {
    return this.databaseService.findUserById(id);
  }

  /**
   * Busca usuário por email
   * @param email - Email do usuário
   * @returns Usuário encontrado ou null
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.databaseService.findUserByEmail(email);
  }

  /**
   * Compara uma senha em texto plano com um hash
   * @param password - Senha em texto plano
   * @param hash - Hash armazenado
   * @returns True se a senha coincidir, false caso contrário
   */
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Gera um token JWT para o usuário
   * @param user - Dados do usuário
   * @returns Token JWT assinado
   */
  private async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    };

    console.log('🔐 Gerando token JWT para payload:', payload);
    
    const token = await this.jwtService.signAsync(payload);
    
    console.log('✅ Token JWT gerado com sucesso');
    
    return token;
  }

  /**
   * Valida e decodifica um token JWT
   * @param token - Token JWT
   * @returns Payload do token se válido
   * @throws UnauthorizedException se o token for inválido
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      console.log('❌ Token inválido:', error.message);
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Verifica se o usuário tem uma determinada função
   * @param user - Usuário
   * @param role - Função a verificar
   * @returns True se o usuário tem a função
   */
  hasRole(user: User, role: string): boolean {
    return user.roles.includes(role);
  }

  /**
   * Verifica se o usuário tem alguma das funções especificadas
   * @param user - Usuário
   * @param roles - Funções a verificar
   * @returns True se o usuário tem pelo menos uma das funções
   */
  hasAnyRole(user: User, roles: string[]): boolean {
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Busca as roles específicas do usuário por projeto
   * @param userId - ID do usuário
   * @returns Lista de projetos com suas roles específicas
   */
  async getUserProjectRoles(userId: string): Promise<UserProjectRoleDto[]> {
    // Buscar atribuições de projeto do usuário
    const userProjectAssignments = await this.prisma.userProjectAssignment.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    // Para cada projeto ativo, buscar as roles específicas
    const projectRoles: UserProjectRoleDto[] = [];
    
    for (const assignment of userProjectAssignments) {
      if (!assignment.project.isActive) continue;

      // Buscar roles específicas do usuário neste projeto
      const userRoles = await this.prisma.userProjectRole.findMany({
        where: {
          userId,
          projectId: assignment.project.id,
        },
        select: {
          role: true,
        },
      });

      const roles = userRoles.map((ur) => ur.role);

      projectRoles.push({
        projectId: assignment.project.id,
        projectName: assignment.project.name,
        roles,
      });
    }

    return projectRoles.sort((a, b) => a.projectName.localeCompare(b.projectName));
  }
} 