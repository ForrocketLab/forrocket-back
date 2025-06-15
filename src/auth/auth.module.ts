import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Módulo de autenticação
 * Gerencia todas as funcionalidades relacionadas à autenticação
 */
@Module({
  imports: [
    // Módulo do banco de dados
    DatabaseModule,
    
    // Configuração do Passport
    PassportModule,
    
    // Configuração do JWT
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'rpe-fallback-secret-key',
      signOptions: { 
        expiresIn: '8h',
        issuer: 'RPE-System',
        audience: 'RPE-Users',
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {} 