import { UserRole } from '../enums/user-role.enum';

/**
 * Interface principal para modelar os usuários do sistema RPE
 * 
 * Esta interface define a estrutura completa de dados necessária para
 * gerenciar usuários no ecossistema da Rocket Corp, contemplando:
 * - Identificação e acesso
 * - Estrutura organizacional
 * - Relacionamentos hierárquicos
 * - Metadados de controle
 * 
 * A estrutura suporta todos os requisitos do MVP 1 e permite
 * futuras evoluções do sistema de avaliação de performance.
 */
export interface IUser {
  // ==========================================
  // DADOS DE IDENTIFICAÇÃO E ACESSO
  // ==========================================

  /**
   * Identificador único do usuário (UUID)
   * - Chave primária do sistema
   * - Imutável após criação
   * - Usado para relacionamentos entre entidades
   */
  id: string;

  /**
   * Nome completo do colaborador
   * - Usado para exibição em interfaces
   * - Importante para relatórios e comunicações
   */
  name: string;

  /**
   * Email para login e comunicações
   * - Deve ser único no sistema
   * - Usado como identificador de login
   * - Canal principal de comunicação
   */
  email: string;

  /**
   * Senha hasheada com bcrypt
   * - NUNCA armazenar senha em texto plano
   * - Usar salt para maior segurança
   * - Validar complexidade na criação/alteração
   */
  passwordHash: string;

  /**
   * Array de funções do usuário
   * - Controla permissões e acessos no sistema
   * - Permite múltiplas funções simultâneas
   * - Base para toda lógica de autorização
   * 
   * Exemplos de combinações:
   * - [COLABORADOR] = Colaborador simples
   * - [COLABORADOR, GESTOR] = Colaborador que também é gestor
   * - [COLABORADOR, COMITE] = Sócio que também é avaliado
   * - [RH] = Profissional de RH (pode ou não ser avaliado)
   * - [ADMIN] = Administrador do sistema
   */
  roles: UserRole[];

  // ==========================================
  // DADOS DE ESTRUTURA ORGANIZACIONAL
  // ==========================================

  /**
   * Cargo/Posição do colaborador
   * - Ex: "Desenvolvedor de Software", "Product Manager", "Designer UX"
   * - Usado para filtros e agrupamentos em relatórios
   * - Importante para definir critérios de avaliação específicos
   */
  jobTitle: string;

  /**
   * Nível de senioridade
   * - Ex: "Júnior", "Pleno", "Sênior", "Especialista", "Principal"
   * - Usado para calibração de expectativas na avaliação
   * - Influencia critérios e pesos das competências
   */
  seniority: string;

  /**
   * Trilha de carreira
   * - Ex: "Tech", "Business", "Design", "Data", "Product"
   * - Define competências específicas a serem avaliadas
   * - Usado para agrupamentos em relatórios e benchmarks
   */
  careerTrack: string;

  /**
   * Unidade de negócio
   * - Ex: "Digital Products", "AI Solutions", "Consulting", "Operations"
   * - Permite análises por área de atuação
   * - Usado para filtros em dashboards gerenciais
   */
  businessUnit: string;

  // ==========================================
  // DADOS DE ALOCAÇÃO E RELACIONAMENTO
  // ==========================================

  /**
   * Projetos em que o usuário está ou esteve alocado
   * - Array com nomes ou IDs dos projetos
   * - Histórico importante para contexto das avaliações
   * - Usado para análises de performance por projeto
   */
  projects: string[];

  /**
   * ID do gestor direto (opcional)
   * - Referência para o usuário que é gestor direto
   * - Usado para definir quem avalia quem
   * - Null para usuários sem gestor direto (ex: CEO, sócios)
   */
  managerId?: string;

  /**
   * Lista de IDs dos liderados diretos (apenas para gestores)
   * - Array com IDs dos colaboradores sob gestão
   * - Usado para definir responsabilidades de avaliação
   * - Vazio para colaboradores sem liderados
   */
  directReports?: string[];

  /**
   * ID do mentor designado (opcional)
   * - Referência para apoio no desenvolvimento (PDI/OKR)
   * - Pode ser diferente do gestor direto
   * - Usado para acompanhamento de desenvolvimento
   */
  mentorId?: string;

  // ==========================================
  // METADADOS DE CONTROLE
  // ==========================================

  /**
   * Data de criação do registro
   * - Timestamp de quando o usuário foi cadastrado
   * - Usado para auditoria e relatórios históricos
   */
  createdAt: Date;

  /**
   * Data da última atualização
   * - Timestamp da última modificação dos dados
   * - Importante para controle de versão e auditoria
   */
  updatedAt: Date;

  /**
   * Flag de usuário ativo
   * - Indica se o usuário está ativo na plataforma
   * - Usado para soft delete (não remove dados históricos)
   * - Controla acesso ao sistema
   */
  isActive: boolean;
}

/**
 * COMO DIFERENCIAR OS TIPOS DE USUÁRIOS:
 * 
 * A combinação da interface IUser com o enum UserRole resolve
 * elegantemente o problema de diferenciação de usuários:
 * 
 * 1. COLABORADOR SIMPLES:
 *    - roles: [UserRole.COLABORADOR]
 *    - directReports: undefined ou []
 *    - Participa apenas como avaliado
 * 
 * 2. COLABORADOR GESTOR:
 *    - roles: [UserRole.COLABORADOR, UserRole.GESTOR]
 *    - directReports: ['id1', 'id2', 'id3']
 *    - É avaliado E avalia seus liderados
 * 
 * 3. SÓCIO (COMITÊ):
 *    - roles: [UserRole.COLABORADOR, UserRole.COMITE]
 *    - Participa da avaliação E do comitê de equalização
 * 
 * 4. GESTOR SÓCIO:
 *    - roles: [UserRole.COLABORADOR, UserRole.GESTOR, UserRole.COMITE]
 *    - Combina todas as responsabilidades
 * 
 * 5. RH:
 *    - roles: [UserRole.RH] ou [UserRole.COLABORADOR, UserRole.RH]
 *    - Acesso para configuração e acompanhamento
 * 
 * 6. ADMIN:
 *    - roles: [UserRole.ADMIN]
 *    - Acesso total ao sistema
 * 
 */ 