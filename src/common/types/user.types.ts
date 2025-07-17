import { IUser } from '../interfaces/user.interface';
import { UserRole } from '../enums/user-role.enum';

/**
 * Tipos auxiliares para trabalhar com usuários no sistema RPE
 * 
 * Este arquivo contém tipos derivados e utilitários que facilitam
 * o desenvolvimento e garantem type safety em operações específicas.
 */

// ==========================================
// TIPOS PARA CRIAÇÃO E ATUALIZAÇÃO
// ==========================================

/**
 * Dados necessários para criar um novo usuário
 * - Remove campos gerados automaticamente (id, timestamps)
 * - Remove passwordHash (será gerado a partir da password)
 * - Torna campos opcionais que têm valores padrão
 */
export type CreateUserData = Omit<IUser, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash' | 'projects' | 'directReports' | 'isActive'> & {
  /**
   * Senha em texto plano (será hasheada antes de salvar)
   * - Não usar passwordHash diretamente na criação
   * - Validar complexidade antes do hash
   */
  password: string;
  
  /**
   * Campos opcionais na criação com valores padrão
   */
  projects?: string[];
  directReports?: string[];
  isActive?: boolean;
};

/**
 * Dados para atualização de usuário
 * - Todos os campos são opcionais
 * - Remove campos que não devem ser alterados diretamente
 */
export type UpdateUserData = Partial<Omit<IUser, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>> & {
  /**
   * Nova senha (opcional) - será hasheada se fornecida
   */
  password?: string;
};

/**
 * Dados públicos do usuário (sem informações sensíveis)
 * - Remove senha e outros dados sensíveis
 * - Usado para exibição em interfaces e APIs públicas
 */
export type PublicUserData = Omit<IUser, 'passwordHash'>;

/**
 * Dados básicos do usuário para listagens
 * - Apenas informações essenciais para performance
 * - Usado em dropdowns, autocompletes, etc.
 */
export type UserSummary = Pick<IUser, 'id' | 'name' | 'email' | 'jobTitle' | 'roles' | 'isActive'>;

// ==========================================
// TIPOS PARA FILTROS E CONSULTAS
// ==========================================

/**
 * Filtros para busca de usuários
 * - Todos os campos são opcionais
 * - Suporta busca por múltiplos critérios
 */
export interface UserFilters {
  name?: string;
  email?: string;
  roles?: UserRole[];
  jobTitle?: string;
  seniority?: string;
  careerTrack?: string;
  businessUnit?: string;
  managerId?: string;
  isActive?: boolean;
  projects?: string[];
}

/**
 * Opções de ordenação para listagem de usuários
 */
export interface UserSortOptions {
  field: keyof Pick<IUser, 'name' | 'email' | 'jobTitle' | 'seniority' | 'createdAt'>;
  direction: 'asc' | 'desc';
}

/**
 * Parâmetros para paginação de usuários
 */
export interface UserPaginationOptions {
  page: number;
  limit: number;
  sort?: UserSortOptions;
  filters?: UserFilters;
}

// ==========================================
// TIPOS PARA RELACIONAMENTOS
// ==========================================

/**
 * Estrutura hierárquica de um usuário
 * - Inclui gestor e liderados com dados básicos
 * - Usado para exibir organograma
 */
export interface UserHierarchy {
  user: PublicUserData;
  manager?: UserSummary;
  directReports: UserSummary[];
  mentor?: UserSummary;
}

/**
 * Dados de um usuário com relacionamentos expandidos
 * - Inclui objetos completos em vez de apenas IDs
 * - Usado quando precisamos de dados completos dos relacionamentos
 */
export interface UserWithRelations extends Omit<PublicUserData, 'managerId' | 'directReports' | 'mentorId'> {
  manager?: UserSummary;
  directReports: UserSummary[];
  mentor?: UserSummary;
}

// ==========================================
// TIPOS PARA VALIDAÇÃO DE PERMISSÕES
// ==========================================

/**
 * Contexto de permissões para um usuário
 * - Facilita verificação de permissões
 * - Usado em guards e middlewares
 */
export interface UserPermissionContext {
  userId: string;
  roles: UserRole[];
  isManager: boolean;
  isCommitteeMember: boolean;
  isHR: boolean;
  isAdmin: boolean;
  managedUserIds: string[];
}

/**
 * Ações que podem ser realizadas no sistema
 * - Usado para controle granular de permissões
 */
export enum UserAction {
  // Ações básicas
  VIEW_PROFILE = 'view_profile',
  EDIT_PROFILE = 'edit_profile',
  
  // Ações de gestão
  VIEW_TEAM = 'view_team',
  MANAGE_TEAM = 'manage_team',
  
  // Ações de avaliação
  EVALUATE_OTHERS = 'evaluate_others',
  VIEW_EVALUATIONS = 'view_evaluations',
  
  // Ações administrativas
  MANAGE_USERS = 'manage_users',
  VIEW_REPORTS = 'view_reports',
  CONFIGURE_SYSTEM = 'configure_system'
}

// ==========================================
// TIPOS PARA ESTATÍSTICAS E RELATÓRIOS
// ==========================================

/**
 * Estatísticas de usuários por categoria
 * - Usado em dashboards e relatórios
 */
export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
  bySeniority: Record<string, number>;
  byCareerTrack: Record<string, number>;
  byBusinessUnit: Record<string, number>;
}

/**
 * Distribuição de usuários na estrutura organizacional
 * - Usado para análises de estrutura da empresa
 */
export interface OrganizationalStructure {
  totalUsers: number;
  managersCount: number;
  averageTeamSize: number;
  maxTeamSize: number;
  usersWithoutManager: number;
  hierarchyLevels: number;
}

// ==========================================
// TYPE GUARDS E UTILITÁRIOS
// ==========================================

/**
 * Type guard para verificar se um usuário tem uma role específica
 */
export const hasRole = (user: Pick<IUser, 'roles'>, role: UserRole): boolean => {
  return user.roles.includes(role);
};

/**
 * Type guard para verificar se um usuário é gestor
 */
export const isManager = (user: Pick<IUser, 'roles' | 'directReports'>): boolean => {
  return hasRole(user, UserRole.GESTOR) && (user.directReports?.length ?? 0) > 0;
};

/**
 * Type guard para verificar se um usuário é membro do comitê
 */
export const isCommitteeMember = (user: Pick<IUser, 'roles'>): boolean => {
  return hasRole(user, UserRole.COMMITTEE);
};

/**
 * Type guard para verificar se um usuário é do RH
 */
export const isHRMember = (user: Pick<IUser, 'roles'>): boolean => {
  return hasRole(user, UserRole.RH);
};

/**
 * Type guard para verificar se um usuário é admin
 */
export const isAdmin = (user: Pick<IUser, 'roles'>): boolean => {
  return hasRole(user, UserRole.ADMIN);
};

/**
 * Utilitário para criar contexto de permissões
 */
export const createPermissionContext = (user: IUser): UserPermissionContext => {
  return {
    userId: user.id,
    roles: user.roles,
    isManager: isManager(user),
    isCommitteeMember: isCommitteeMember(user),
    isHR: isHRMember(user),
    isAdmin: isAdmin(user),
    managedUserIds: user.directReports ?? []
  };
}; 