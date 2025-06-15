import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../jwt-payload.interface';

/**
 * Estratégia JWT para validação de tokens
 * Verifica se o token é válido e se o usuário ainda existe
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'rpe-fallback-secret-key',
      issuer: 'RPE-System',
      audience: 'RPE-Users',
    });
  }

  /**
   * Valida o payload do JWT e retorna o usuário
   * @param payload - Payload decodificado do JWT
   * @returns Usuário validado
   */
  async validate(payload: JwtPayload) {
    console.log('🔐 Validando token JWT:', payload);
    
    // Verifica se o usuário ainda existe
    const user = await this.authService.findUserById(payload.userId);
    if (!user) {
      console.log('❌ Usuário não encontrado para o token');
      throw new UnauthorizedException('Token inválido - usuário não encontrado');
    }

    if (!user.isActive) {
      console.log('❌ Usuário inativo');
      throw new UnauthorizedException('Usuário inativo');
    }

    console.log('✅ Token válido para usuário:', user.email);
    return user;
  }
} 