export interface ProfileData {
  'Nome ( nome.sobrenome )': string;
  Email: string;
  'Ciclo (ano.semestre)': string;
  Unidade: string;
}

export interface SelfAssessmentData {
  CRITÉRIO: string;
  'DESCRIÇÃO GERAL': string;
  'AUTO-AVALIAÇÃO': number;
  'DESCRIÇÃO NOTA': string;
  'DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS': string;
}

export interface Feedback360Data {
  'EMAIL DO AVALIADO ( nome.sobrenome )': string;
  'PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS': string;
  PERÍODO: number;
  'VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR': string;
  'DÊ UMA NOTA GERAL PARA O COLABORADOR': number;
  'PONTOS QUE DEVE MELHORAR': string;
  'PONTOS QUE FAZ BEM E DEVE EXPLORAR': string;
}

export interface ReferenceData {
  'EMAIL DA REFERÊNCIA\n( nome.sobrenome )': string;
  JUSTIFICATIVA: string;
}

export interface CleanSelfAssessmentAnswer {
  criterion: string;
  description?: string;
  score?: number;
  scoreDescription?: string;
  justification?: string;
}

export interface CleanReferenceData {
  emailReference: string;
  justification: string;
}
