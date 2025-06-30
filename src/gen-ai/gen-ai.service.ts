import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { BrutalFactsDto, OpenAiChatCompletionResponseDto } from './dto/gen-ai-response.dto';
import {
  TeamEvaluationSummaryData,
  TeamEvaluationSummaryDto,
  TeamScoreAnalysisData,
} from './dto/team-evaluation.dto';

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
      const response = await firstValueFrom(
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

      const response = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Análise da equipe recebida com sucesso.');

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

      const response = await firstValueFrom(
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

  private isTeamEvaluationSummaryDto(obj: unknown): obj is TeamEvaluationSummaryDto {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'facts' in obj &&
      typeof (obj as TeamEvaluationSummaryDto).facts === 'string'
    );
  }
}
