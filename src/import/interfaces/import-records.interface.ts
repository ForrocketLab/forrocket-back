/**
 * Interface para registros da planilha/arquivo 'Perfil'.
 * As propriedades devem corresponder EXATAMENTE aos cabeçalhos das colunas no seu arquivo XLSX/XLS.
 */
export interface UserProfileRecord {
  'Nome ( nome.sobrenome )': string; // Exatamente como no Excel
  Email: string;                   // Exatamente como no Excel
  'Ciclo (ano.semestre)': string;  // Exatamente como no Excel
  Unidade: string;                 // Exatamente como no Excel
}

/**
 * Interface para registros da planilha/arquivo 'Autoavaliação'.
 * As propriedades devem corresponder EXATAMENTE aos cabeçalhos das colunas no seu arquivo.
 * ATENÇÃO: 'Email do Colaborador' e 'Ciclo (ano.semestre)' NÃO estão aqui, serão passados como contexto.
 */
export interface SelfAssessmentRecord {
  CRITÉRIO: string;
  'DESCRIÇÃO GERAL'?: string;
  'AUTO-AVALIAÇÃO'?: number | string;
  'DESCRIÇÃO NOTA'?: string;
  // Nome exato do cabeçalho com quebra de linha
  'DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS'?: string;
}

/**
 * Interface para registros da planilha/arquivo 'Avaliação 360'.
 * As propriedades devem corresponder EXATAMENTE aos cabeçalhos das colunas no seu arquivo.
 * ATENÇÃO: 'Email do Avaliador' e 'Ciclo (ano.semestre)' NÃO estão aqui, serão passados como contexto.
 */
export interface Assessment360Record {
  'EMAIL DO AVALIADO ( nome.sobrenome )': string;
  'PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS'?: string;
  PERÍODO?: string; // Nome exato
  'VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR'?: string;
  'DÊ UMA NOTA GERAL PARA O COLABORADOR'?: number;
  'PONTOS QUE DEVE MELHORAR'?: string;
  'PONTOS QUE FAZ BEM E DEVE EXPLORAR'?: string;
}

/**
 * Interface para registros da planilha/arquivo 'Pesquisa de Referências'.
 * As propriedades devem corresponder EXATAMENTE aos cabeçalhos das colunas no seu arquivo.
 * ATENÇÃO: 'Email do Avaliador' e 'Ciclo (ano.semestre)' NÃO estão aqui, serão passados como contexto.
 */
export interface ReferenceFeedbackRecord {
  // Nome exato do cabeçalho com quebra de linha
  'EMAIL DA REFERÊNCIA\n( nome.sobrenome )': string;
  JUSTIFICATIVA?: string; // Nome exato
}