import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Entidade User para representar usuários no sistema RPE
 * Baseada na interface IUser com todos os campos necessários
 */
export class User {
  @ApiProperty({
    description: 'ID único do usuário (UUID)',
    example: '12345678-90ab-cdef-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Oliveira',
  })
  name: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'ana.oliveira@rocketcorp.com',
  })
  email: string;

  @Exclude() 
  passwordHash: string;

  @ApiProperty({
    description: 'Papéis/funções do usuário no sistema (JSON string)',
    example: '["colaborador", "gestor"]',
  })
  roles: string; 

  @ApiProperty({
    description: 'Data da última atividade do usuário',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  lastActivityAt: Date | null;

  // ==========================================
  // DADOS DE SEGURANÇA E RECUPERAÇÃO DE SENHA 
  // ==========================================

  @ApiProperty({
    description: 'Número de tentativas de login falhas consecutivas',
    example: 0,
    default: 0,
  })
  failedLoginAttempts: number;

  @ApiProperty({
    description: 'Indica se a conta do usuário está bloqueada devido a muitas tentativas de login falhas',
    example: false,
    default: false,
  })
  isLocked: boolean;

  @ApiProperty({
    description: 'Data e hora até a qual a conta estará bloqueada (se for um bloqueio temporário)',
    example: '2024-07-16T15:00:00Z',
    required: false,
    nullable: true,
  })
  lockUntil: Date | null;

  @Exclude() 
  @ApiProperty({
    description: 'Código único para redefinição de senha, enviado por e-mail',
    example: 'ABC123XYZ',
    required: false,
    nullable: true,
  })
  passwordResetCode: string | null;

  @Exclude() 
  @ApiProperty({
    description: 'Data e hora de expiração do código de redefinição de senha',
    example: '2024-07-16T15:05:00Z',
    required: false,
    nullable: true,
  })
  passwordResetCodeExpiresAt: Date | null;

  // ==========================================
  // DADOS DE ESTRUTURA ORGANIZACIONAL
  // ==========================================

  @ApiProperty({
    description: 'Cargo/Posição do colaborador',
    example: 'Desenvolvedora Frontend',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Nível de senioridade',
    example: 'Pleno',
  })
  seniority: string;

  @ApiProperty({
    description: 'Trilha de carreira',
    example: 'Tech',
  })
  careerTrack: string;

  @ApiProperty({
    description: 'Unidade de negócio',
    example: 'Digital Products',
  })
  businessUnit: string;

  @ApiProperty({
    description: 'Hub de negócio',
    example: 'Technology Hub',
  })
  businessHub: string | null;

  // ==========================================
  // DADOS DE ALOCAÇÃO E RELACIONAMENTO
  // ==========================================

  @ApiProperty({
    description: 'Projetos em que o usuário está alocado (JSON string)',
    example: '["projeto-app-mobile", "projeto-dashboard"]',
  })
  projects: string | null; 

  @ApiProperty({
    description: 'ID do gestor direto',
    example: 'gestor-id-123',
    required: false,
  })
  managerId?: string | null; 

  @ApiProperty({
    description: 'IDs dos liderados diretos (apenas para gestores, JSON string)',
    example: '["liderado-1", "liderado-2"]',
    required: false,
  })
  directReports?: string | null; 

  @ApiProperty({
    description: 'ID do mentor designado',
    example: 'mentor-id-123',
    required: false,
  })
  mentorId?: string | null; 

  @ApiProperty({
    description: 'ID do líder designado',
    example: 'lider-id-123',
    required: false,
  })
  leaderId?: string | null; 

  @ApiProperty({
    description: 'IDs dos colaboradores sob liderança direta (JSON string)',
    example: '["colaborador-1", "colaborador-2"]',
    required: false,
  })
  directLeadership?: string | null; 

  @ApiProperty({
    description: 'IDs dos mentorados (JSON string)',
    example: '["mentorado-1", "mentorado-2"]',
    required: false,
  })
  mentoringIds?: string | null; 

  @ApiProperty({
    description: 'ID do lote de importação',
    example: 'batch-id-123',
    required: false,
  })
  importBatchId?: string | null; 

  // ==========================================
  // METADADOS DE CONTROLE
  // ==========================================

  @ApiProperty({
    description: 'Indica se o usuário está ativo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação do usuário',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
  })
  updatedAt: Date;

  /**
   * Método para converter entidade em objeto público (sem senha e dados sensíveis de segurança)
   */
  toPublic() {
    const {
      passwordHash,
      passwordResetCode,
      passwordResetCodeExpiresAt,
      ...publicUser
    } = this;
    return publicUser;
  }

  /**
   * Construtor para inicializar a entidade User a partir de um objeto parcial.
   * Útil para mapear dados do Prisma para a entidade.
   */
  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
