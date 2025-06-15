/**
 * Interface para o payload do token JWT
 * Define os dados que serão incluídos no token
 */
export interface JwtPayload {
  /**
   * ID único do usuário
   */
  userId: string;

  /**
   * Nome do usuário
   */
  name: string;

  /**
   * Email do usuário
   */
  email: string;

  /**
   * Papéis/funções do usuário no sistema
   */
  roles: string[];

  /**
   * Timestamp de criação do token (issued at)
   */
  iat?: number;

  /**
   * Timestamp de expiração do token
   */
  exp?: number;

  /**
   * Emissor do token
   */
  iss?: string;

  /**
   * Audiência do token
   */
  aud?: string;
} 