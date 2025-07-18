import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './user.dto';

/**
 * DTO para requisição de login
 * Contém validações completas para email e senha
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário para autenticação',
    example: 'ana.oliveira@rocketcorp.com',
    type: String,
    format: 'email',
    required: true
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'password123',
    type: String,
    minLength: 6,
    required: true
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}

/**
 * DTO para resposta de login bem-sucedido
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticação nas próximas requisições',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWJ5YXZ3dmQwMDAwdHpzZ281NTgxMnFvIiwibmFtZSI6IkFuYSBPbGl2ZWlyYSIsImVtYWlsIjoiYW5hLm9saXZlaXJhQHJvY2tldGNvcnAuY29tIiwicm9sZXMiOlsiY29sYWJvcmFkb3IiXSwiaWF0IjoxNzUwMDMxNTYxLCJleHAiOjE3NTAwNjAzNjEsImF1ZCI6IlJQRS1Vc2VycyIsImlzcyI6IlJQRS1TeXN0ZW0ifQ.signature',
    type: String
  })
  token: string;

  @ApiProperty({
    description: 'Informações básicas do usuário autenticado',
    type: UserInfoDto,
    example: {
      id: 'cmbyavwvd0000tzsgo55812qo',
      name: 'Ana Oliveira',
      email: 'ana.oliveira@rocketcorp.com',
      roles: ['colaborador']
    }
  })
  user: UserInfoDto;
}

/**
 * DTO para resposta de erro
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'Código de status HTTP', example: 401 })
  statusCode: number;

  @ApiProperty({ description: 'Mensagem de erro', example: 'Credenciais inválidas' })
  message: string;

  @ApiProperty({ description: 'Tipo do erro', example: 'Unauthorized' })
  error: string;

  @ApiProperty({ description: 'Timestamp do erro', example: '2024-01-15T10:00:00.000Z' })
  timestamp?: string;

  @ApiProperty({ description: 'Caminho da requisição', example: '/api/auth/login' })
  path?: string;
} 