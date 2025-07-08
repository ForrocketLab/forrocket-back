export const criteriaMap = new Map<string, string>([
  // Mapeamentos diretos para o id
  ['Organização', 'organizacao-trabalho'],
  ['Imagem', 'atender-prazos'],
  ['Iniciativa', 'sentimento-de-dono'],
  ['Aprendizagem Contínua', 'capacidade-aprender'],
  ['Produtividade', 'fazer-mais-menos'],
  ['Criatividade e Inovação', 'pensar-fora-caixa'],
  ['Gestão de Pessoas*', 'gestao-gente'],
  ['Gestão de Projetos*', 'gestao-resultados'],
  ['Gestão Organizacional*', 'evolucao-rocket-corp'],

  // Mapeamentos Agrupados (vários antigos para um novo)
  ['Comprometimento', 'resiliencia-adversidades'],
  ['Flexibilidade', 'resiliencia-adversidades'],

  ['Trabalho em Equipe', 'team-player'],
  ['Relacionamento Inter-Pessoal', 'team-player'],

  ['Qualidade', 'entregar-qualidade'],
  ['Foco no Cliente', 'entregar-qualidade'],

  ['Novos Clientes**', 'evolucao-rocket-corp'],
  ['Novos Projetos**', 'evolucao-rocket-corp'],
  ['Novos Produtos ou Serviços**', 'evolucao-rocket-corp'],
]);
