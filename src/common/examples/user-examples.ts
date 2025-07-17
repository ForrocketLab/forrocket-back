import {
  IUser,
  UserRole,
  CreateUserData,
  UserPermissionContext,
  hasRole,
  isManager,
  createPermissionContext
} from '../index';

/**
 * Exemplos práticos de uso das estruturas de dados de usuário
 * 
 * Este arquivo demonstra como utilizar as interfaces e tipos
 * definidos para o sistema RPE em cenários reais.
 */

// ==========================================
// EXEMPLOS DE USUÁRIOS POR TIPO
// ==========================================

/**
 * Exemplo: Colaborador Simples
 * - Apenas função de colaborador
 * - Participa como avaliado
 */
export const exemploColaboradorSimples: IUser = {
  id: 'user-001',
  name: 'Ana Silva',
  email: 'ana.silva@rocketcorp.com',
  passwordHash: '$2b$10$...',
  roles: [UserRole.COLABORADOR],
  
  // Dados organizacionais
  jobTitle: 'Desenvolvedora Frontend',
  seniority: 'Pleno',
  careerTrack: 'Tech',
  businessUnit: 'Digital Products',
  
  // Relacionamentos
  projects: ['projeto-app-mobile', 'projeto-dashboard'],
  managerId: 'user-002', // Tem um gestor
  // directReports: undefined (não é gestor)
  mentorId: 'user-003',
  
  // Metadados
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-06-15'),
  isActive: true
};

/**
 * Exemplo: Colaborador Gestor
 * - Função de colaborador E gestor
 * - É avaliado E avalia seus liderados
 */
export const exemploColaboradorGestor: IUser = {
  id: 'user-002',
  name: 'Bruno Santos',
  email: 'bruno.santos@rocketcorp.com',
  passwordHash: '$2b$10$...',
  roles: [UserRole.COLABORADOR, UserRole.GESTOR],
  
  // Dados organizacionais
  jobTitle: 'Tech Lead',
  seniority: 'Sênior',
  careerTrack: 'Tech',
  businessUnit: 'Digital Products',
  
  // Relacionamentos
  projects: ['projeto-app-mobile', 'projeto-api-core'],
  managerId: 'user-004', // Também tem um gestor
  directReports: ['user-001', 'user-005', 'user-006'], // Gerencia 3 pessoas
  mentorId: 'user-004',
  
  // Metadados
  createdAt: new Date('2023-03-10'),
  updatedAt: new Date('2024-06-15'),
  isActive: true
};

/**
 * Exemplo: Sócio (Comitê)
 * - Função de colaborador E comitê
 * - É avaliado E participa do comitê de equalização
 */
export const exemploSocioComite: IUser = {
  id: 'user-004',
  name: 'Carla Oliveira',
  email: 'carla.oliveira@rocketcorp.com',
  passwordHash: '$2b$10$...',
  roles: [UserRole.COLABORADOR, UserRole.COMMITTEE],
  
  // Dados organizacionais
  jobTitle: 'Head of Engineering',
  seniority: 'Principal',
  careerTrack: 'Tech',
  businessUnit: 'Digital Products',
  
  // Relacionamentos
  projects: ['projeto-estrategia-tech', 'projeto-arquitetura'],
  managerId: 'user-007', // CEO ou outro sócio
  directReports: ['user-002', 'user-008'], // Gerencia tech leads
  // mentorId: undefined (sócios podem não ter mentor)
  
  // Metadados
  createdAt: new Date('2022-01-01'),
  updatedAt: new Date('2024-06-15'),
  isActive: true
};

/**
 * Exemplo: Profissional de RH
 * - Função de RH (pode ou não ser avaliado)
 * - Acesso para configuração e acompanhamento
 */
export const exemploRH: IUser = {
  id: 'user-009',
  name: 'Diana Costa',
  email: 'diana.costa@rocketcorp.com',
  passwordHash: '$2b$10$...',
  roles: [UserRole.COLABORADOR, UserRole.RH], // RH que também é avaliado
  
  // Dados organizacionais
  jobTitle: 'People & Culture Manager',
  seniority: 'Sênior',
  careerTrack: 'Business',
  businessUnit: 'Operations',
  
  // Relacionamentos
  projects: ['projeto-cultura', 'projeto-onboarding'],
  managerId: 'user-010', // Head of Operations
  directReports: ['user-011'], // Analista de RH
  mentorId: 'user-010',
  
  // Metadados
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2024-06-15'),
  isActive: true
};

/**
 * Exemplo: Administrador do Sistema
 * - Função de admin
 * - Acesso total ao sistema
 */
export const exemploAdmin: IUser = {
  id: 'user-admin',
  name: 'Eduardo Tech',
  email: 'eduardo.tech@rocketcorp.com',
  passwordHash: '$2b$10$...',
  roles: [UserRole.ADMIN],
  
  // Dados organizacionais
  jobTitle: 'DevOps Engineer',
  seniority: 'Sênior',
  careerTrack: 'Tech',
  businessUnit: 'Operations',
  
  // Relacionamentos
  projects: ['projeto-infraestrutura', 'projeto-seguranca'],
  // managerId: undefined (admin pode não ter gestor)
  // directReports: undefined (foco em infraestrutura)
  // mentorId: undefined
  
  // Metadados
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-06-15'),
  isActive: true
};

// ==========================================
// EXEMPLOS DE CRIAÇÃO DE USUÁRIOS
// ==========================================

/**
 * Exemplo: Dados para criar um novo colaborador
 */
export const exemploCreateUser: CreateUserData = {
  name: 'Felipe Novo',
  email: 'felipe.novo@rocketcorp.com',
  password: 'senhaSegura123!', // Será hasheada
  roles: [UserRole.COLABORADOR],
  
  // Dados organizacionais
  jobTitle: 'Desenvolvedor Backend',
  seniority: 'Júnior',
  careerTrack: 'Tech',
  businessUnit: 'Digital Products',
  
  // Relacionamentos
  projects: ['projeto-onboarding'],
  managerId: 'user-002',
  mentorId: 'user-001',
  
  // Campos opcionais (terão valores padrão)
  // isActive: true (padrão)
  // directReports: [] (padrão para não-gestores)
};

// ==========================================
// EXEMPLOS DE VERIFICAÇÃO DE PERMISSÕES
// ==========================================

/**
 * Exemplo: Verificando permissões de um usuário
 */
export function exemploVerificacaoPermissoes() {
  const usuario = exemploColaboradorGestor;
  
  // Verificações básicas usando type guards
  console.log('É colaborador?', hasRole(usuario, UserRole.COLABORADOR)); // true
  console.log('É gestor?', hasRole(usuario, UserRole.GESTOR)); // true
  console.log('É do comitê?', hasRole(usuario, UserRole.COMMITTEE)); // false
  console.log('É manager?', isManager(usuario)); // true (tem role GESTOR e directReports)
  
  // Criando contexto de permissões
  const contexto: UserPermissionContext = createPermissionContext(usuario);
  console.log('Contexto de permissões:', contexto);
  /*
  Resultado:
  {
    userId: 'user-002',
    roles: ['colaborador', 'gestor'],
    isManager: true,
    isCommitteeMember: false,
    isHR: false,
    isAdmin: false,
    managedUserIds: ['user-001', 'user-005', 'user-006']
  }
  */
}

// ==========================================
// EXEMPLOS DE CENÁRIOS DE NEGÓCIO
// ==========================================

/**
 * Exemplo: Determinando quem pode avaliar quem
 */
export function exemploQuemPodeAvaliar(avaliador: IUser, avaliado: IUser): boolean {
  // Gestores podem avaliar seus liderados diretos
  if (hasRole(avaliador, UserRole.GESTOR)) {
    return avaliador.directReports?.includes(avaliado.id) ?? false;
  }
  
  // Membros do comitê podem avaliar qualquer colaborador
  if (hasRole(avaliador, UserRole.COMMITTEE)) {
    return hasRole(avaliado, UserRole.COLABORADOR);
  }
  
  // RH pode avaliar para fins de acompanhamento
  if (hasRole(avaliador, UserRole.RH)) {
    return hasRole(avaliado, UserRole.COLABORADOR);
  }
  
  // Admin pode avaliar qualquer um
  if (hasRole(avaliador, UserRole.ADMIN)) {
    return true;
  }
  
  return false;
}

/**
 * Exemplo: Determinando nível de acesso a relatórios
 */
export function exemploNivelAcessoRelatorios(usuario: IUser): 'nenhum' | 'proprio' | 'equipe' | 'empresa' | 'total' {
  if (hasRole(usuario, UserRole.ADMIN)) {
    return 'total'; // Acesso a tudo
  }
  
  if (hasRole(usuario, UserRole.RH)) {
    return 'empresa'; // Acesso a relatórios da empresa
  }
  
  if (hasRole(usuario, UserRole.COMMITTEE)) {
    return 'empresa'; // Sócios veem dados da empresa
  }
  
  if (hasRole(usuario, UserRole.GESTOR) && (usuario.directReports?.length ?? 0) > 0) {
    return 'equipe'; // Gestores veem dados da equipe
  }
  
  if (hasRole(usuario, UserRole.COLABORADOR)) {
    return 'proprio'; // Colaboradores veem apenas seus dados
  }
  
  return 'nenhum';
}

/**
 * Exemplo: Validando estrutura organizacional
 */
export function exemploValidarEstrutura(usuarios: IUser[]): string[] {
  const erros: string[] = [];
  
  usuarios.forEach(usuario => {
    // Verificar se gestor tem liderados
    if (hasRole(usuario, UserRole.GESTOR) && (!usuario.directReports || usuario.directReports.length === 0)) {
      erros.push(`Usuário ${usuario.name} tem role GESTOR mas não possui liderados`);
    }
    
    // Verificar se liderados existem
    if (usuario.directReports) {
      usuario.directReports.forEach(lideradoId => {
        const liderado = usuarios.find(u => u.id === lideradoId);
        if (!liderado) {
          erros.push(`Liderado ${lideradoId} do gestor ${usuario.name} não encontrado`);
        } else if (liderado.managerId !== usuario.id) {
          erros.push(`Inconsistência: ${liderado.name} não tem ${usuario.name} como gestor`);
        }
      });
    }
    
    // Verificar se gestor existe
    if (usuario.managerId) {
      const gestor = usuarios.find(u => u.id === usuario.managerId);
      if (!gestor) {
        erros.push(`Gestor ${usuario.managerId} do usuário ${usuario.name} não encontrado`);
      } else if (!hasRole(gestor, UserRole.GESTOR)) {
        erros.push(`Usuário ${gestor.name} é definido como gestor mas não tem role GESTOR`);
      }
    }
  });
  
  return erros;
} 