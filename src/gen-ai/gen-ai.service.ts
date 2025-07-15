import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

import { BrutalFactsDto, OpenAiChatCompletionResponseDto } from './dto/gen-ai-response.dto';
import {
  TeamEvaluationSummaryData,
  TeamEvaluationSummaryDto,
  TeamScoreAnalysisData,
} from './dto/team-evaluation.dto';
import { CollaboratorEvaluationData } from './dto/collaborator-summary.dto';
import { PersonalInsightsData } from './dto/personal-insights.dto';
import { ClimateSentimentAnalysisData } from '../evaluations/assessments/dto/climate-sentiment-analysis.dto';

function isBrutalFactsDto(obj: unknown): obj is BrutalFactsDto {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'facts' in obj &&
    typeof (obj as BrutalFactsDto).facts === 'string'
  );
}

@Injectable()
export class GenAiService {
  private readonly logger = new Logger(GenAiService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Gera "brutal facts" a partir de um texto de avaliação usando uma LLM.
   * @param evaluationText O texto completo da avaliação.
   * @returns Uma promessa que resolve para uma string com os fatos.
   */
  async getSummary(evaluationText: string): Promise<string> {
    const prompt = `
    Você é um agente especializado em extrair fatos diretos e honestos de avaliações de desempenho do sistema RPE.
      Baseado no seguinte texto de uma avaliação de desempenho, extraia varios "brutal facts" (fatos diretos e honestos) sobre os pontos a melhorar, em um único texto.
      Neste caso, você deve extrair dados baseados nas notas dos colaboradores, focando em insights que podem ser extraídos das notas e do texto de avaliação em feedbacks360 e do gestor.
      Exemplo de Input: Nota geral 4.12, Avaliações; ["avaliação 1", "avaliação 2"]
      Exemplo de output: Nenhum colaborador alcançou o status de alto desempenho (nota 4.5+). Isso indica ou uma evitação de inflação nas notas ou um problema fundamental na aquisição ou desenvolvimento de talentos. Também é nítido que alguns colaboradores tiveram problemas de atrasos.

      IMPORTANTE: Retorne EXATAMENTE no formato JSON abaixo, sem nenhum texto adicional:
      {
        "facts": "Texto aqui, lorem ipsum"
      }

      Nota geral + Avaliações (requer refatoração): "${evaluationText}"
    `;

    // Corpo da requisição para a API da OpenAI
    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, // baixa temperatura para respostas mais diretas e menos criativas
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log('Enviando requisição para a LLM...');

      // faz a chamada POST para o endpoint de chat completions
      const response: AxiosResponse<OpenAiChatCompletionResponseDto> = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Resposta da LLM recebida com sucesso.');

      // extrai o conteúdo da resposta e faz o parse do JSON
      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      // usa função Type Guard para validar a estrutura
      if (!isBrutalFactsDto(parsedJson)) {
        this.logger.error(
          'O JSON retornado pela LLM não tem o formato esperado { "facts": "string" }',
          parsedJson,
        );
        throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
      }

      return parsedJson.facts || '';
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado no LLMService:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar fatos a partir da avaliação.');
    }
  }

  /**
   * Gera análise estratégica de equipe baseada em dados estruturados de avaliações
   * @param teamData Dados estruturados da equipe com avaliações
   * @returns Uma promessa que resolve para uma string com insights sobre a equipe
   */
  async getTeamEvaluationSummary(teamData: TeamEvaluationSummaryData): Promise<string> {
    const prompt = `
    Você é um consultor sênior de RH especializado em análise de performance de equipes.
    Analise os dados de avaliação da equipe abaixo e forneça insights estratégicos sobre:
    
    1. Padrões de performance da equipe
    2. Identificação de talentos de alto desempenho
    3. Colaboradores que precisam de atenção/desenvolvimento
    4. Tendências comportamentais observadas
    5. Recomendações estratégicas para liderança
    
    DADOS DA EQUIPE:
    - Ciclo: ${teamData.cycle}
    - Média geral da equipe: ${teamData.teamAverageScore.toFixed(2)}
    - Total de colaboradores: ${teamData.totalCollaborators}
    - Alto desempenho (≥4.5): ${teamData.highPerformers} colaboradores
    - Baixo desempenho (≤2.5): ${teamData.lowPerformers} colaboradores
    
    AVALIAÇÕES POR COLABORADOR:
    ${teamData.collaborators
      .map(
        (collab) => `
    ${collab.collaboratorName} (${collab.jobTitle} - ${collab.seniority}):
    - Média: ${collab.averageScore.toFixed(2)}
    - Avaliações 360: ${collab.assessments360.length} recebidas
    - Avaliações de Gestor: ${collab.managerAssessments.length} recebidas
    ${collab.committeeScore ? `- Nota do Comitê: ${collab.committeeScore}` : ''}
    
    Principais feedbacks:
    ${collab.assessments360
      .slice(0, 3)
      .map((a) => `• ${a.improvements || a.strengths}`)
      .join('\n')}
    ${collab.managerAssessments
      .slice(0, 2)
      .map((m) =>
        m.answers
          .slice(0, 2)
          .map((ans) => `• ${ans.justification}`)
          .join('\n'),
      )
      .join('\n')}
    `,
      )
      .join('\n---\n')}
    
    Forneça uma análise profissional e acionável em português, focando em insights que ajudem a liderança a tomar decisões estratégicas sobre desenvolvimento de talentos, retenção e ações de melhoria.
    
    IMPORTANTE: Retorne EXATAMENTE no formato JSON abaixo:
    {
      "facts": "Sua análise completa aqui..."
    }
    `;

    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // temperatura baixa para análise mais objetiva
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log('Enviando dados da equipe para análise pela LLM...');

      const response: AxiosResponse<OpenAiChatCompletionResponseDto> = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Análise da equipe recebida com sucesso.');

      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      // Verificar se é o formato simples { "facts": "string" }
      if (this.isTeamEvaluationSummaryDto(parsedJson)) {
        return parsedJson.facts || '';
      }

      // Verificar se é o formato estruturado e converter
      if (this.isStructuredInsightsResponse(parsedJson)) {
        const structuredResponse = parsedJson as any;
        
        // Converter o formato estruturado para texto único
        const textInsights = this.convertStructuredInsightsToText(structuredResponse.facts);
        return textInsights;
      }
        
      this.logger.error(
        'O JSON retornado pela LLM não tem o formato esperado { "facts": "string" } nem formato estruturado',
        parsedJson,
      );
      throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado na análise da equipe:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar análise da equipe.');
    }
  }

  /**
   * Gera resumo estratégico baseado nas notas finais dos colaboradores por pilar
   * @param teamScoreData Dados de notas finais da equipe organizados por pilar
   * @returns Uma promessa que resolve para uma string com resumo estratégico
   */
  async getTeamScoreAnalysis(teamScoreData: TeamScoreAnalysisData): Promise<string> {
    const prompt = `
    Você é um consultor sênior de RH especializado em análise quantitativa de performance.
    Analise as notas finais da equipe por pilar e forneça insights estratégicos concisos.
    
    DADOS DA EQUIPE - CICLO ${teamScoreData.cycle}:
    
    ESTATÍSTICAS GERAIS:
    - Total de colaboradores: ${teamScoreData.totalCollaborators}
    - Média geral da equipe: ${teamScoreData.teamAverageScore.toFixed(2)}
    - Colaboradores em zona crítica (≤2.5): ${teamScoreData.criticalPerformers}
    - Colaboradores de alto desempenho (≥4.5): ${teamScoreData.highPerformers}
    
    MÉDIAS POR PILAR:
    - Comportamento: ${teamScoreData.behaviorAverage?.toFixed(2) || 'N/A'}
    - Execução: ${teamScoreData.executionAverage?.toFixed(2) || 'N/A'}
    
    DISTRIBUIÇÃO DE NOTAS FINAIS:
    ${teamScoreData.collaborators
      .map(
        (collab) => `
    ${collab.collaboratorName}: ${collab.finalScore?.toFixed(2) || 'Sem nota final'}
    - Comportamento: ${collab.behaviorScore?.toFixed(2) || 'N/A'}
    - Execução: ${collab.executionScore?.toFixed(2) || 'N/A'}
    ${collab.hasCommitteeScore ? '(Nota equalizada pelo comitê)' : '(Média das avaliações)'}
    `,
      )
      .join('\n')}
    
    Forneça um resumo estratégico em 2-3 frases que:
    1. Identifique padrões de performance da equipe
    2. Destaque pontos fortes ou áreas de atenção por pilar
    3. Sugira recomendações práticas se relevante
    
    Exemplos de tom:
    - "Nenhum colaborador em zona crítica de desempenho. Isso sugere práticas eficazes de contratação e gestão."
    - "Os colaboradores demonstram evolução consistente nas avaliações, com destaque para o crescimento nas competências comportamentais."
    
    IMPORTANTE: Retorne EXATAMENTE no formato JSON abaixo:
    {
      "facts": "Seu resumo estratégico aqui..."
    }
    `;

    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // temperatura muito baixa para análise objetiva
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log('Enviando dados de notas da equipe para análise pela LLM...');

      const response: AxiosResponse<OpenAiChatCompletionResponseDto> = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Análise de notas da equipe recebida com sucesso.');

      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      if (!this.isTeamEvaluationSummaryDto(parsedJson)) {
        this.logger.error(
          'O JSON retornado pela LLM não tem o formato esperado { "facts": "string" }',
          parsedJson,
        );
        throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
      }

      return parsedJson.facts || '';
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado na análise de notas da equipe:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar análise de notas da equipe.');
    }
  }

  /**
   * Gera resumo automático de um colaborador para equalização do comitê
   * @param collaboratorData Dados completos do colaborador com todas as avaliações
   * @returns Uma promessa que resolve para uma string com o resumo para equalização
   */
  async getCollaboratorSummaryForEqualization(collaboratorData: CollaboratorEvaluationData): Promise<string> {
    const prompt = `
    Você é um consultor sênior de RH especializado em equalização de performance para comitês de avaliação.
    Analise TODOS os dados do colaborador abaixo e gere um resumo executivo que facilite a equalização, focando em:

    1. **PERFORMANCE GERAL**: Análise da consistência entre diferentes tipos de avaliação
    2. **PONTOS FORTES**: Competências mais destacadas pelos avaliadores
    3. **ÁREAS DE DESENVOLVIMENTO**: Oportunidades de melhoria identificadas
    4. **DISCREPÂNCIAS**: Diferenças significativas entre autoavaliação vs. feedback de terceiros
    5. **RECOMENDAÇÃO DE NOTA**: Sugestão de nota final baseada em evidências
    6. **CONTEXTO ORGANIZACIONAL**: Considerações sobre senioridade e expectativas do cargo

    DADOS DO COLABORADOR:
    Nome: ${collaboratorData.collaboratorName}
    Cargo: ${collaboratorData.jobTitle} (${collaboratorData.seniority})
    Ciclo: ${collaboratorData.cycle}

    ESTATÍSTICAS GERAIS:
    - Média geral: ${collaboratorData.statistics.averageScore.toFixed(2)}
    - Total de avaliações: ${collaboratorData.statistics.totalEvaluations}
    - Score por pilar: Comportamento (${collaboratorData.statistics.scoresByPillar.comportamento.toFixed(2)}), Execução (${collaboratorData.statistics.scoresByPillar.execucao.toFixed(2)}), Gestão (${collaboratorData.statistics.scoresByPillar.gestao.toFixed(2)})

    AUTOAVALIAÇÃO:
    ${collaboratorData.selfAssessment 
      ? `Média: ${collaboratorData.selfAssessment.averageScore.toFixed(2)}
      Principais respostas:
      ${collaboratorData.selfAssessment.answers.slice(0, 6).map(ans => 
        `• ${ans.pillarName} - ${ans.criterionName}: ${ans.score}/5 - "${ans.justification}"`
      ).join('\n')}`
      : 'Não realizada'}

    AVALIAÇÕES 360° RECEBIDAS (${collaboratorData.assessments360.length}):
    ${collaboratorData.assessments360.map(assessment => `
    Avaliador: ${assessment.authorName} (${assessment.authorJobTitle})
    - Nota geral: ${assessment.overallScore}/5
    - Pontos fortes: "${assessment.strengths}"
    - Melhorias: "${assessment.improvements}"`).join('\n')}

    AVALIAÇÕES DE GESTOR (${collaboratorData.managerAssessments.length}):
    ${collaboratorData.managerAssessments.map(assessment => `
    Gestor: ${assessment.authorName} (${assessment.authorJobTitle})
    Principais feedbacks:
    ${assessment.answers.slice(0, 4).map(ans => 
      `• ${ans.pillarName} - ${ans.criterionName}: ${ans.score}/5 - "${ans.justification}"`
    ).join('\n')}`).join('\n')}

    MENTORING RECEBIDO (${collaboratorData.mentoringAssessments.length}):
    ${collaboratorData.mentoringAssessments.map(assessment => `
    Mentor: ${assessment.authorName}
    - Nota: ${assessment.score}/5 - "${assessment.justification}"`).join('\n')}

    REFERÊNCIAS RECEBIDAS (${collaboratorData.referenceFeedbacks.length}):
    ${collaboratorData.referenceFeedbacks.map(ref => `
    Por: ${ref.authorName} - "${ref.justification}"`).join('\n')}

    CONTEXTO ADICIONAL PARA ANÁLISE:
    - **Senioridade**: ${collaboratorData.seniority} - Considere as expectativas para este nível
    - **Cargo**: ${collaboratorData.jobTitle} - Analise se o desempenho está alinhado com as responsabilidades
    - **Volume de feedback**: ${collaboratorData.statistics.totalEvaluations} avaliações - Quanto maior, mais confiável a média
    - **Consistência entre avaliadores**: Compare se diferentes pessoas têm percepções similares
    - **Evolução vs. posição atual**: Considere se o colaborador está crescendo ou estagnado

    CRITÉRIOS DE AVALIAÇÃO UTILIZADOS:
    **Comportamento**: Sentimento de Dono, Resiliência, Organização, Capacidade de Aprender, Team Player
    **Execução**: Entregar com Qualidade, Atender Prazos, Fazer Mais com Menos, Pensar Fora da Caixa
    **Gestão**: Gestão de Gente, Gestão de Resultados, Evolução da Rocket Corp

    FORNEÇA UM RESUMO EXECUTIVO EM PORTUGUÊS que ajude o comitê a:
    - Entender rapidamente o perfil do colaborador
    - Identificar padrões nas avaliações
    - Tomar decisão fundamentada sobre a nota final
    - Focar nos pontos mais relevantes para equalização
    - Considerar o contexto de senioridade e cargo

    ESTRUTURA SUGERIDA DO RESUMO:
    1. **Performance Geral**: Resumo executivo em 2-3 frases
    2. **Pontos Fortes**: 3-4 competências mais destacadas
    3. **Áreas de Desenvolvimento**: 2-3 oportunidades de melhoria
    4. **Discrepâncias**: Diferenças entre autoavaliação e feedback externo
    5. **Recomendação de Nota**: Sugestão fundamentada (1-5) com justificativa

    IMPORTANTE: Retorne EXATAMENTE no formato JSON abaixo:
    {
      "facts": "Seu resumo executivo completo aqui..."
    }
    `;

    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2, // temperatura baixa para análise objetiva e consistente
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log(`Gerando resumo de equalização para colaborador: ${collaboratorData.collaboratorName}`);

      const response: AxiosResponse<OpenAiChatCompletionResponseDto> = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Resumo de equalização gerado com sucesso.');

      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      if (!this.isTeamEvaluationSummaryDto(parsedJson)) {
        this.logger.error(
          'O JSON retornado pela LLM não tem o formato esperado { "facts": "string" }',
          parsedJson,
        );
        throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
      }

      return parsedJson.facts || '';
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado na geração do resumo de equalização:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar resumo de equalização.');
    }
  }

  /**
   * Gera insights personalizados para um colaborador baseado em suas avaliações
   * @param personalData Dados completos do colaborador com todas as avaliações
   * @returns Uma promessa que resolve para uma string com insights personalizados
   */
  async getPersonalInsights(personalData: PersonalInsightsData): Promise<string> {
    const prompt = `
    Você é um consultor especializado em desenvolvimento pessoal e carreira, focado em fornecer insights acionáveis para colaboradores.
    Analise os dados de avaliação abaixo e gere insights personalizados e dicas práticas para o colaborador, focando em:

    1. **PONTOS FORTES**: Competências que se destacam nas avaliações
    2. **OPORTUNIDADES DE CRESCIMENTO**: Áreas específicas para desenvolvimento 
    3. **PADRÕES COMPORTAMENTAIS**: Tendências observadas pelos avaliadores
    4. **DICAS PRÁTICAS**: Sugestões concretas e acionáveis para melhoria
    5. **PRÓXIMOS PASSOS**: Plano de ação para o próximo ciclo

    DADOS DO COLABORADOR:
    Nome: ${personalData.collaborator.name}
    Cargo: ${personalData.collaborator.jobTitle} (${personalData.collaborator.seniority})
    Unidade: ${personalData.collaborator.businessUnit}
    Ciclo: ${personalData.cycle}

    NOTAS OBTIDAS:
    - Média geral: ${personalData.scores.averageScore.toFixed(2)}/5
    ${personalData.scores.selfEvaluation ? `- Autoavaliação: ${personalData.scores.selfEvaluation.toFixed(2)}/5` : ''}
    ${personalData.scores.managerEvaluation ? `- Avaliação do gestor: ${personalData.scores.managerEvaluation.toFixed(2)}/5` : ''}
    ${personalData.scores.committeeEvaluation ? `- Avaliação do comitê: ${personalData.scores.committeeEvaluation.toFixed(2)}/5` : ''}

    FEEDBACK 360° RECEBIDO (${personalData.assessments360.length} avaliações):
    ${personalData.assessments360.map(assessment => `
    Avaliador: ${assessment.assessorName}
    Pontos fortes destacados: "${assessment.strengths}"
    Sugestões de melhoria: "${assessment.improvements}"`).join('\n')}

    FEEDBACK DO GESTOR:
    ${personalData.managerAssessments.map(assessment => `
    ${assessment.answers.map(answer => 
      `Critério: ${answer.criterionId} - Nota: ${answer.score}/5
      Justificativa: "${answer.justification}"`
    ).join('\n')}`).join('\n')}

    ${personalData.committeeAssessment ? `
    AVALIAÇÃO DO COMITÊ:
    Nota final: ${personalData.committeeAssessment.finalScore}/5
    Justificativa: "${personalData.committeeAssessment.justification}"
    ` : ''}

    DIRETRIZES PARA OS INSIGHTS:
    
    **Tom e Abordagem:**
    - Use linguagem encorajadora e construtiva
    - Foque no crescimento e desenvolvimento, não em deficiências
    - Seja específico e prático nas sugestões
    - Reconheça conquistas antes de abordar melhorias
    
    **Estrutura dos Insights:**
    1. **Reconhecimento**: Destaque 2-3 pontos fortes principais
    2. **Oportunidades**: Identifique 2-3 áreas de maior potencial de crescimento
    3. **Dicas Práticas**: Forneça 3-4 ações concretas que podem ser implementadas
    4. **Objetivos**: Sugira metas específicas para o próximo período
    
    **Foco nas Avaliações 360:**
    - Priorize insights das avaliações 360°, pois refletem a percepção dos pares
    - Compare com feedback do gestor para identificar consensos
    - Se há discrepâncias, ajude a entender diferentes perspectivas
    
    **Exemplos de Dicas Práticas:**
    - "Para melhorar a comunicação, pratique resumir suas ideias em 3 pontos principais antes de apresentar"
    - "Considere agendar 15 minutos semanais com cada membro da equipe para feedback contínuo"
    - "Para desenvolver liderança, volunteer-se para liderar um projeto pequeno no próximo trimestre"
    
    IMPORTANTE: 
    - Escreva na segunda pessoa (você) para falar diretamente com o colaborador
    - Seja empático e motivador
    - Inclua tanto reconhecimento quanto desenvolvimento
    - Mantenha um tom profissional mas acessível
    - Retorne EXATAMENTE no formato JSON abaixo:
    
    {
      "facts": "Seus insights personalizados completos aqui..."
    }
    `;

    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, // temperatura moderada para balance entre criatividade e objetividade
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log(`Gerando insights personalizados para: ${personalData.collaborator.name}`);

      const response: AxiosResponse<OpenAiChatCompletionResponseDto> = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Insights personalizados gerados com sucesso.');

      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      if (!this.isTeamEvaluationSummaryDto(parsedJson)) {
        this.logger.error(
          'O JSON retornado pela LLM não tem o formato esperado { "facts": "string" }',
          parsedJson,
        );
        throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
      }

      return parsedJson.facts || '';
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado na geração de insights pessoais:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar insights personalizados.');
    }
  }

  private isTeamEvaluationSummaryDto(obj: unknown): obj is TeamEvaluationSummaryDto {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'facts' in obj &&
      typeof (obj as TeamEvaluationSummaryDto).facts === 'string'
    );
  }

  private isStructuredInsightsResponse(obj: unknown): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'facts' in obj &&
      typeof (obj as any).facts === 'object'
    );
  }

  private convertStructuredInsightsToText(structuredFacts: any): string {
    try {
      let result = '';
      
      // Se é um objeto estruturado com seções
      if (typeof structuredFacts === 'object') {
        for (const [section, content] of Object.entries(structuredFacts)) {
          result += `**${section}:**\n`;
          
          if (Array.isArray(content)) {
            content.forEach((item: string, index: number) => {
              result += `${index + 1}. ${item}\n`;
            });
          } else if (typeof content === 'string') {
            result += `${content}\n`;
          }
          result += '\n';
        }
      } else if (typeof structuredFacts === 'string') {
        result = structuredFacts;
      }
      
      return result.trim();
    } catch (error) {
      this.logger.error('Erro ao converter insights estruturados para texto:', error);
      return 'Insights gerados com formato inesperado. Contate o suporte técnico.';
    }
  }

  /**
   * Gera análise de sentimento da avaliação de clima organizacional
   * @param climateData Dados das avaliações de clima organizacional
   * @returns Uma promessa que resolve para uma string com a análise de sentimento
   */
  async getClimateSentimentAnalysis(climateData: ClimateSentimentAnalysisData): Promise<string> {
    const prompt = `
    Você é um especialista em clima organizacional e análise de sentimento, focado em fornecer insights acionáveis para melhorar o ambiente de trabalho.
    
    Analise os dados da avaliação de clima organizacional abaixo e forneça uma análise completa de sentimento e recomendações práticas.

    DADOS DA AVALIAÇÃO DE CLIMA - CICLO ${climateData.cycle}:
    Total de avaliações: ${climateData.totalAssessments}

    ANÁLISE POR CRITÉRIO:

    ${climateData.criteria.map(criterion => `
    **${criterion.name}**
    - Média: ${criterion.averageScore.toFixed(2)}/5
    - Total de respostas: ${criterion.totalResponses}
    - Justificativas dos colaboradores:
    ${criterion.justifications.map((justification, index) => `${index + 1}. "${justification}"`).join('\n')}
    `).join('\n')}

    DIRETRIZES PARA A ANÁLISE:

    **1. ANÁLISE DE SENTIMENTO:**
    - Identifique o sentimento geral (positivo, neutro, negativo) para cada critério
    - Analise padrões nas justificativas (palavras-chave, tom, emoções)
    - Considere a distribuição das notas (1-5) para entender a satisfação
    - Identifique temas recorrentes nas justificativas

    **2. PONTOS FORTES:**
    - Destaque aspectos positivos do clima organizacional
    - Identifique práticas que estão funcionando bem
    - Reconheça conquistas e melhorias já implementadas

    **3. ÁREAS DE PREOCUPAÇÃO:**
    - Identifique problemas ou insatisfações recorrentes
    - Analise critérios com notas mais baixas
    - Destaque justificativas que indicam problemas

    **4. RECOMENDAÇÕES PRÁTICAS:**
    - Forneça 5-7 dicas específicas e acionáveis
    - Foque em ações que podem ser implementadas rapidamente
    - Considere diferentes níveis de intervenção (individual, equipe, organizacional)
    - Priorize recomendações baseadas na urgência e impacto

    **5. SCORE DE SENTIMENTO:**
    - Calcule um score de 0-100 baseado na análise geral
    - Considere: médias das notas, tom das justificativas, distribuição de respostas
    - 0-30: Clima crítico, 31-60: Clima neutro, 61-100: Clima positivo

    **EXEMPLOS DE RECOMENDAÇÕES:**
    - "Implementar programa de reconhecimento mensal para valorizar contribuições"
    - "Criar canais de comunicação mais abertos entre liderança e equipe"
    - "Estabelecer políticas claras de equilíbrio trabalho-vida pessoal"
    - "Desenvolver programa de mentoria para fortalecer relacionamentos"
    - "Realizar reuniões de feedback mais frequentes e estruturadas"

    **FORMATO DE RESPOSTA:**
    Retorne EXATAMENTE no formato JSON abaixo:

    {
      "sentimentAnalysis": "Análise completa do sentimento geral...",
      "improvementTips": "1. Primeira dica prática\\n2. Segunda dica prática\\n3. Terceira dica prática...",
      "strengths": "Pontos fortes identificados...",
      "areasOfConcern": "Áreas que precisam de atenção...",
      "overallSentimentScore": 75
    }

    IMPORTANTE:
    - Seja específico e prático nas recomendações
    - Use linguagem clara e acessível
    - Foque em ações que podem ser implementadas
    - Considere o contexto organizacional
    - Mantenha um tom construtivo e positivo
    `;

    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // temperatura baixa para análise objetiva
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log(`Gerando análise de sentimento para avaliação de clima - Ciclo ${climateData.cycle}`);

      const response: AxiosResponse<OpenAiChatCompletionResponseDto> = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Análise de sentimento de clima gerada com sucesso.');

      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      // Verificar se tem a estrutura esperada
      if (this.isClimateSentimentAnalysisResponse(parsedJson)) {
        return JSON.stringify(parsedJson);
      }

      this.logger.error(
        'O JSON retornado pela LLM não tem o formato esperado para análise de sentimento',
        parsedJson,
      );
      throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado na análise de sentimento de clima:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar análise de sentimento de clima.');
    }
  }

  /**
   * Type guard para verificar se a resposta da análise de sentimento tem o formato correto
   */
  private isClimateSentimentAnalysisResponse(obj: unknown): obj is {
    sentimentAnalysis: string;
    improvementTips: string;
    strengths: string;
    areasOfConcern: string;
    overallSentimentScore: number;
  } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'sentimentAnalysis' in obj &&
      'improvementTips' in obj &&
      'strengths' in obj &&
      'areasOfConcern' in obj &&
      'overallSentimentScore' in obj &&
      typeof (obj as any).sentimentAnalysis === 'string' &&
      typeof (obj as any).improvementTips === 'string' &&
      typeof (obj as any).strengths === 'string' &&
      typeof (obj as any).areasOfConcern === 'string' &&
      typeof (obj as any).overallSentimentScore === 'number'
    );
  }
}
