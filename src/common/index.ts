/**
 * Arquivo de índice para exportações centralizadas
 * 
 * Facilita as importações em outros módulos do sistema,
 * permitindo importar tudo de um local central.
 */

// Enums
export { UserRole } from './enums/user-role.enum';

// Interfaces
export { IUser } from './interfaces/user.interface';

// Types e utilitários
export {
  // Tipos para CRUD
  CreateUserData,
  UpdateUserData,
  PublicUserData,
  UserSummary,
  
  // Tipos para filtros e consultas
  UserFilters,
  UserSortOptions,
  UserPaginationOptions,
  
  // Tipos para relacionamentos
  UserHierarchy,
  UserWithRelations,
  
  // Tipos para permissões
  UserPermissionContext,
  UserAction,
  
  // Tipos para estatísticas
  UserStatistics,
  OrganizationalStructure,
  
  // Utilitários
  hasRole,
  isManager,
  isCommitteeMember,
  isHRMember,
  isAdmin,
  createPermissionContext
} from './types/user.types'; 