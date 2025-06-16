/**
 * Enum para definir as funções (roles) dos usuários no sistema RPE
 * 
 * Este enum é fundamental para o controle de permissões e diferenciação
 * dos tipos de usuários no sistema de avaliação de performance.
 * 
 * Um usuário pode ter múltiplas funções simultaneamente, permitindo
 * flexibilidade na estrutura organizacional da Rocket Corp.
 */
export enum UserRole {
  /**
   * COLABORADOR - Função base para todos que são avaliados
   * - Todos os funcionários da empresa possuem esta função
   * - Participam do processo de avaliação como avaliados
   * - Podem definir OKRs e PDIs
   */
  COLABORADOR = 'colaborador',

  /**
   * GESTOR - Para quem avalia liderados diretos
   * - Possui colaboradores sob sua gestão
   * - Realiza avaliações de seus liderados
   * - Participa do processo de calibração
   * - Também é avaliado (possui role COLABORADOR)
   */
  GESTOR = 'gestor',

  /**
   * COMITE - Membro do comitê de equalização (sócios)
   * - Participa do comitê de equalização final
   * - Tem visão ampla das avaliações da empresa
   * - Pode ajustar notas finais no processo de calibração
   * - Também é avaliado (possui role COLABORADOR)
   */
  COMITE = 'comite',

  /**
   * RH - Acesso para parametrização e acompanhamento geral
   * - Configura parâmetros do sistema de avaliação
   * - Monitora o progresso dos ciclos avaliativos
   * - Gera relatórios e dashboards gerenciais
   * - Pode ou não ser avaliado (dependendo da política da empresa)
   */
  RH = 'rh',

  /**
   * ADMIN - Acesso para gerenciamento de permissões e do sistema
   * - Gerencia usuários e suas permissões
   * - Configura aspectos técnicos do sistema
   * - Acesso total a todas as funcionalidades
   * - Responsável pela manutenção da plataforma
   */
  ADMIN = 'admin'
} 