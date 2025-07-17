import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { UserInfoDto, UserProjectRoleDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto, VerifyResetCodeDto, ResetPasswordDto } from './dto';

// Constantes para o bloqueio de conta
const MAX_LOGIN_ATTEMPTS = 3; // Número máximo de tentativas de login falhas
const LOCKOUT_TIME_MINUTES = 15; // Tempo de bloqueio da conta em minutos
const PASSWORD_RESET_CODE_EXPIRATION_MINUTES = 5; // Tempo de expiração do código em minutos

/**
 * Serviço responsável pela autenticação de usuários
 * Gerencia o processo de login, validação e geração de tokens JWT,
 * e agora também o fluxo de redefinição de senha e notificação de bloqueio.
 */
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Realiza o login do usuário
   * @param loginDto - Dados de login (email e senha)
   * @returns Token JWT e informações do usuário se o login for bem-sucedido
   * @throws UnauthorizedException se as credenciais forem inválidas ou a conta estiver bloqueada
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

    // ==========================================
    // Lógica de Bloqueio de Conta
    // ==========================================
    if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.lockUntil.getTime() - new Date().getTime()) / (1000 * 60),
      );
      console.log(
        `🔒 Conta do usuário ${email} está bloqueada por ${remainingTime} minutos.`,
      );
      throw new UnauthorizedException(
        `Conta bloqueada. Tente novamente em ${remainingTime} minutos.`,
      );
    }

    // Verifica se a senha está correta
    const isPasswordValid = await this.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      console.log('❌ Senha incorreta para usuário:', email);

      // Incrementa as tentativas falhas no banco de dados
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
        },
      });

      // Se as tentativas falhas excederem o limite, bloqueia a conta
      if (updatedUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_TIME_MINUTES);

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isLocked: true,
            lockUntil: lockUntil,
          },
        });
        console.log(`❌ Conta do usuário ${email} bloqueada.`);

        // ==========================================
        // Envio de e-mail de notificação de bloqueio
        // ==========================================
        const subject = 'Sua conta foi bloqueada devido a tentativas de login falhas';
        const text = `Prezado(a) ${user.name},\n\nDetectamos múltiplas tentativas de login falhas em sua conta (${user.email}). Por segurança, sua conta foi bloqueada por ${LOCKOUT_TIME_MINUTES} minutos.\n\nSe você não tentou fazer login, por favor, considere redefinir sua senha imediatamente usando a função "Esqueci a Senha" em nosso site.\n\nAtenciosamente,\nEquipe ForRocketLab`;
        const html = `<p>Prezado(a) ${user.name},</p>
                      <p>Detectamos múltiplas tentativas de login falhas em sua conta (<strong>${user.email}</strong>). Por segurança, sua conta foi bloqueada por ${LOCKOUT_TIME_MINUTES} minutos.</p>
                      <p>Você pode tentar novamente após este período ou usar a função "Esqueci a Senha" para redefinir sua senha imediatamente.</p>
                      <p>Se você não tentou fazer login, por favor, ignore este e-mail ou entre em contato com o suporte se tiver preocupações.</p>
                      <p>Atenciosamente,<br>Equipe ForRocketLab</p>`;

        try {
          await this.emailService.sendMail(email, subject, text, html);
          console.log(`✉️ E-mail de notificação de bloqueio enviado para: ${email}`);
        } catch (mailError) {
          console.error(`❌ Erro ao enviar e-mail de bloqueio para ${email}:`, mailError);

        }

        throw new UnauthorizedException(
          `Muitas tentativas de login falhas. Sua conta foi bloqueada por ${LOCKOUT_TIME_MINUTES} minutos.`,
        );
      }

      throw new UnauthorizedException('Credenciais inválidas');
    }

    // ==========================================
    // Login Bem-Sucedido: Resetar tentativas falhas e desbloquear
    // ==========================================
    if (user.failedLoginAttempts > 0 || user.isLocked) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          isLocked: false,
          lockUntil: null,
        },
      });
      console.log(
        `✅ Tentativas falhas e status de bloqueio resetados para ${email}.`,
      );
    }

    // Gera o token JWT
    const token = await this.generateJwtToken(user);

    // Converte o usuário para formato público
    const userInfo: UserInfoDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : [],
    };

    console.log('✅ Login realizado com sucesso para:', email);

    return {
      token,
      user: userInfo,
    };
  }

  /**
   * Inicia o processo de redefinição de senha, enviando um código para o email do usuário.
   * @param forgotPasswordDto - DTO contendo o email do usuário.
   * @throws NotFoundException se o usuário não for encontrado.
   * @throws InternalServerErrorException se houver um erro no envio do email.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    console.log(`🔄 Solicitação de redefinição de senha para: ${email}`);

    const user = await this.databaseService.findUserByEmail(email);
    if (!user) {
      console.log(`❌ Usuário não encontrado para redefinição de senha: ${email}`);
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date();
    resetCodeExpiresAt.setMinutes(resetCodeExpiresAt.getMinutes() + PASSWORD_RESET_CODE_EXPIRATION_MINUTES);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCode: resetCode,
        passwordResetCodeExpiresAt: resetCodeExpiresAt,
      },
    });

    const subject = 'Código de Redefinição de Senha - ForRocketLab';
    const text = `Seu código de redefinição de senha é: ${resetCode}. Este código é válido por ${PASSWORD_RESET_CODE_EXPIRATION_MINUTES} minutos.`;
    const html = `<p>Seu código de redefinição de senha é: <strong>${resetCode}</strong></p>
                  <p>Este código é válido por ${PASSWORD_RESET_CODE_EXPIRATION_MINUTES} minutos.</p>
                  <p>Se você não solicitou esta redefinição, por favor, ignore este e-mail.</p>`;

    try {
      await this.emailService.sendMail(email, subject, text, html);
      console.log(`✉️ Código de redefinição enviado para: ${email}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar e-mail de redefinição para ${email}:`, error);
      throw new InternalServerErrorException('Erro ao enviar e-mail de redefinição.');
    }
  }

  /**
   * Verifica se o código de redefinição de senha fornecido é válido e não expirou.
   * @param verifyResetCodeDto - DTO contendo o email e o código.
   * @returns True se o código for válido.
   * @throws BadRequestException se o código for inválido ou expirado.
   * @throws NotFoundException se o usuário não for encontrado.
   */
  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto): Promise<boolean> {
    const { email, code } = verifyResetCodeDto;
    console.log(`🔍 Verificando código de redefinição para: ${email}`);

    const user = await this.databaseService.findUserByEmail(email);
    if (!user) {
      console.log(`❌ Usuário não encontrado para verificação de código: ${email}`);
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (
      !user.passwordResetCode ||
      user.passwordResetCode !== code ||
      !user.passwordResetCodeExpiresAt ||
      user.passwordResetCodeExpiresAt < new Date()
    ) {
      console.log(`❌ Código de redefinição inválido ou expirado para: ${email}`);
      throw new BadRequestException('Código de redefinição inválido ou expirado.');
    }

    console.log(`✅ Código de redefinição válido para: ${email}`);
    return true;
  }

  /**
   * Redefine a senha do usuário após a verificação bem-sucedida do código.
   * @param resetPasswordDto - DTO contendo email, código e a nova senha.
   * @throws BadRequestException se o código for inválido ou expirado.
   * @throws NotFoundException se o usuário não for encontrado.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, code, newPassword } = resetPasswordDto;
    console.log(`🔑 Redefinindo senha para: ${email}`);

    const user = await this.databaseService.findUserByEmail(email);
    if (!user) {
      console.log(`❌ Usuário não encontrado para redefinição de senha: ${email}`);
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.verifyResetCode({ email, code });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetCode: null,
        passwordResetCodeExpiresAt: null,
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null,
      },
    });

    console.log(`✅ Senha redefinida com sucesso para: ${email}`);
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
  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
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
      roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : [],
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
    const userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : [];
    return userRoles.includes(role);
  }

  /**
   * Verifica se o usuário tem alguma das funções especificadas
   * @param user - Usuário
   * @param roles - Funções a verificar
   * @returns True se o usuário tem pelo menos uma das funções
   */
  hasAnyRole(user: User, roles: string[]): boolean {
    const userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : [];
    return roles.some((role) => userRoles.includes(role));
  }

  /**
   * Busca as roles específicas do usuário por projeto
   * @param userId - ID do usuário
   * @returns Lista de projetos com suas roles específicas
   */
  async getUserProjectRoles(userId: string): Promise<UserProjectRoleDto[]> {
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

    const projectRoles: UserProjectRoleDto[] = [];

    for (const assignment of userProjectAssignments) {
      if (!assignment.project.isActive) continue;

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